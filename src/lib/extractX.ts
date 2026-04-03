import * as cheerio from "cheerio";
import type { TweetData } from "./types";
import type { NormalizedTweet } from "./normalize";

// Attempt 1: Twitter syndication API (no JS needed)
async function fetchViaEmbed(
  norm: NormalizedTweet
): Promise<Partial<TweetData> | null> {
  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${norm.statusId}&token=0`;
  try {
    const res = await fetch(syndicationUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result: Partial<TweetData> = {
      author: data.user?.name,
      handle: data.user?.screen_name,
      text: data.text,
      timestamp: data.created_at,
      mediaUrls: [],
      outboundUrls: [],
    };
    if (data.mediaDetails) {
      result.mediaUrls = data.mediaDetails.map(
        (m: { media_url_https: string }) => m.media_url_https
      );
    }
    if (data.quoted_tweet) {
      result.quotedTweet = {
        author: data.quoted_tweet.user?.name,
        handle: data.quoted_tweet.user?.screen_name,
        text: data.quoted_tweet.text,
      };
    }
    if (data.entities?.urls) {
      result.outboundUrls = data.entities.urls
        .map((u: { expanded_url: string }) => u.expanded_url)
        .filter(
          (u: string) => !u.includes("twitter.com") && !u.includes("x.com")
        );
    }
    return result;
  } catch {
    return null;
  }
}

// Attempt 2: direct HTML fetch + parse meta tags
async function fetchViaHtml(
  norm: NormalizedTweet
): Promise<Partial<TweetData> | null> {
  try {
    const res = await fetch(norm.canonicalUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDesc =
      $('meta[property="og:description"]').attr("content") || "";

    const handleMatch = ogTitle.match(/@([A-Za-z0-9_]+)/);

    const result: Partial<TweetData> = {
      text: ogDesc || undefined,
      handle: handleMatch?.[1] || undefined,
      author:
        ogTitle
          .replace(/ on X:?.*/, "")
          .replace(/ on Twitter:?.*/, "")
          .trim() || undefined,
      mediaUrls: [],
      outboundUrls: [],
    };

    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && !ogImage.includes("profile_images")) {
      result.mediaUrls = [ogImage];
    }

    return result;
  } catch {
    return null;
  }
}

// Attempt 3: Playwright browser fallback
async function fetchViaBrowser(
  norm: NormalizedTweet
): Promise<Partial<TweetData> | null> {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.warn("  Playwright not installed, skipping browser fallback");
    return null;
  }
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(norm.canonicalUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page
      .waitForSelector('[data-testid="tweetText"]', { timeout: 10000 })
      .catch(() => {});

    const tweetText = await page
      .$eval('[data-testid="tweetText"]', (el: Element) => el.textContent)
      .catch(() => null);

    const authorName = await page
      .$eval(
        '[data-testid="User-Name"] > div:first-child span',
        (el: Element) => el.textContent
      )
      .catch(() => null);

    const timestamp = await page
      .$eval("time", (el: Element) => el.getAttribute("datetime"))
      .catch(() => null);

    const links: string[] = await page.$$eval(
      "article a[href]",
      (anchors: Element[]) =>
        anchors
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(
            (h) =>
              h.startsWith("http") &&
              !h.includes("twitter.com") &&
              !h.includes("x.com")
          )
    );

    const mediaUrls: string[] = await page.$$eval(
      'article img[src*="pbs.twimg.com/media"]',
      (imgs: Element[]) => imgs.map((img) => (img as HTMLImageElement).src)
    );

    let quotedTweet: TweetData["quotedTweet"];
    const quotedEl = await page.$('[data-testid="quoteTweet"]');
    if (quotedEl) {
      const qText = await quotedEl
        .$eval('[data-testid="tweetText"]', (el: Element) => el.textContent)
        .catch(() => null);
      quotedTweet = { text: qText || undefined };
    }

    return {
      text: tweetText || undefined,
      author: authorName || undefined,
      timestamp: timestamp || undefined,
      mediaUrls,
      outboundUrls: [...new Set(links)],
      quotedTweet,
    };
  } catch (e) {
    console.warn("  Browser extraction failed:", (e as Error).message);
    return null;
  } finally {
    await browser?.close();
  }
}

export async function extractTweet(norm: NormalizedTweet): Promise<TweetData> {
  console.log("  Trying syndication API...");
  let partial = await fetchViaEmbed(norm);

  if (!partial?.text) {
    console.log("  Trying HTML meta tags...");
    const htmlResult = await fetchViaHtml(norm);
    partial = mergePartials(partial, htmlResult);
  }

  if (!partial?.text) {
    console.log("  Trying browser fallback...");
    const browserResult = await fetchViaBrowser(norm);
    partial = mergePartials(partial, browserResult);
  }

  if (!partial?.text && !partial?.author) {
    console.warn(
      "  Warning: could not extract tweet content. Continuing with partial data."
    );
  }

  return {
    url: norm.canonicalUrl,
    canonicalUrl: norm.canonicalUrl,
    author: partial?.author,
    handle: partial?.handle || norm.handle,
    text: partial?.text,
    timestamp: partial?.timestamp,
    mediaUrls: partial?.mediaUrls || [],
    quotedTweet: partial?.quotedTweet,
    outboundUrls: partial?.outboundUrls || [],
  };
}

function mergePartials(
  base: Partial<TweetData> | null,
  overlay: Partial<TweetData> | null
): Partial<TweetData> {
  if (!base) return overlay || {};
  if (!overlay) return base;
  return {
    author: base.author || overlay.author,
    handle: base.handle || overlay.handle,
    text: base.text || overlay.text,
    timestamp: base.timestamp || overlay.timestamp,
    mediaUrls: base.mediaUrls?.length ? base.mediaUrls : overlay.mediaUrls,
    outboundUrls: [
      ...new Set([
        ...(base.outboundUrls || []),
        ...(overlay.outboundUrls || []),
      ]),
    ],
    quotedTweet: base.quotedTweet || overlay.quotedTweet,
  };
}
