import { htmlToReadableMarkdown } from "./readable.js";
import type { ExtractedLink } from "./types.js";

const SKIP_DOMAINS = [
  "twitter.com",
  "x.com",
  "t.co",
  "pic.twitter.com",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "facebook.com",
  "tiktok.com",
];

function shouldSkip(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return SKIP_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return true;
  }
}

function sanitizeFilename(url: string): string {
  try {
    const u = new URL(url);
    const base = (u.hostname + u.pathname)
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80);
    return base || "page";
  } catch {
    return "page";
  }
}

export async function extractAndFetchLinks(
  urls: string[],
  _sourcesDir: string
): Promise<{ links: ExtractedLink[]; markdownFiles: Map<string, string> }> {
  const seen = new Set<string>();
  const unique = urls.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  const links: ExtractedLink[] = [];
  const markdownFiles = new Map<string, string>();

  for (const url of unique) {
    if (shouldSkip(url)) {
      console.log(`  Skipping: ${url}`);
      continue;
    }

    const filename = sanitizeFilename(url) + ".md";
    console.log(`  Fetching: ${url}`);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; tweetpack/1.0)",
          Accept: "text/html",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        links.push({
          url,
          filename,
          fetchedAt: new Date().toISOString(),
          error: `HTTP ${res.status}`,
        });
        continue;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        links.push({
          url,
          filename,
          fetchedAt: new Date().toISOString(),
          error: `Non-HTML content: ${contentType}`,
        });
        continue;
      }

      const html = await res.text();
      const markdown = htmlToReadableMarkdown(html, url);

      const titleMatch = markdown.match(/^# (.+)$/m);
      const title = titleMatch?.[1] || undefined;

      markdownFiles.set(filename, markdown);

      links.push({
        url,
        title,
        filename,
        fetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      links.push({
        url,
        filename,
        fetchedAt: new Date().toISOString(),
        error: (e as Error).message,
      });
    }
  }

  return { links, markdownFiles };
}
