import type { TweetData, ExtractedLink, SignalScore, SignalLevel } from "./types";

const BUILD_KEYWORDS = [
  "built", "building", "launched", "launching", "shipped", "shipping",
  "mvp", "prototype", "app", "tool", "agent", "open source", "open-source",
  "demo", "repo", "github", "waitlist", "docs", "documentation",
  "users can", "you can", "feature", "workflow", "integration",
  "deploy", "release", "v1", "v2", "beta", "alpha", "preview",
  "stack", "codebase", "frontend", "backend", "api", "sdk",
  "dashboard", "landing page", "sign up", "signup",
];

const PRODUCT_NOUNS = [
  "app", "platform", "tool", "extension", "saas", "website", "api",
  "plugin", "bot", "agent", "service", "library", "framework",
  "cli", "widget", "marketplace", "engine", "pipeline",
];

const LOW_SIGNAL_PATTERNS = [
  // Stock/crypto commentary
  /\$[A-Z]{1,5}\b/,
  /\b(stock|shares|puts|calls|bull|bear|squeeze|moon|hodl|trading|earnings)\b/i,
  // Meme/joke patterns
  /\b(ratio|L\b|W\b|ngl|fr fr|ong|no cap|lowkey|highkey|deadass)\b/i,
  // Pure opinion with no substance
  /^(whoever|imagine|people who|y'all|everyone|nobody|someone|if you)\b/i,
  // Motivational/generic
  /\b(grind|hustle|mindset|wake up|success is|never give up|believe in)\b/i,
];

export function scoreTweetSignal(
  tweet: TweetData,
  links: ExtractedLink[]
): SignalScore {
  const reasons: string[] = [];
  let score = 0;
  const text = (tweet.text || "").toLowerCase();
  const quotedText = (tweet.quotedTweet?.text || "").toLowerCase();
  const allText = `${text} ${quotedText}`;

  // --- Positive signals ---

  // Build/product keywords
  const matchedKeywords: string[] = [];
  for (const kw of BUILD_KEYWORDS) {
    if (allText.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    const pts = Math.min(matchedKeywords.length * 10, 40);
    score += pts;
    reasons.push(`Build keywords found: ${matchedKeywords.slice(0, 5).join(", ")} (+${pts})`);
  }

  // Product nouns
  const matchedNouns: string[] = [];
  for (const noun of PRODUCT_NOUNS) {
    // Word-boundary match to avoid false positives
    const re = new RegExp(`\\b${noun}\\b`, "i");
    if (re.test(allText)) {
      matchedNouns.push(noun);
    }
  }
  if (matchedNouns.length > 0) {
    const pts = Math.min(matchedNouns.length * 8, 24);
    score += pts;
    reasons.push(`Product nouns: ${matchedNouns.join(", ")} (+${pts})`);
  }

  // Outbound links (non-social)
  const usefulLinks = links.filter((l) => !l.error);
  if (usefulLinks.length > 0) {
    const pts = Math.min(usefulLinks.length * 12, 36);
    score += pts;
    reasons.push(`${usefulLinks.length} useful outbound link(s) (+${pts})`);
  }

  // GitHub link specifically
  const hasGithub = links.some((l) => l.url.includes("github.com"));
  if (hasGithub) {
    score += 15;
    reasons.push("GitHub link present (+15)");
  }

  // Quoted tweet with substance
  if (quotedText.length > 30) {
    score += 8;
    reasons.push("Quoted tweet with content (+8)");
  }

  // Tweet length — longer tweets tend to have more substance
  const textLen = (tweet.text || "").length;
  if (textLen > 200) {
    score += 10;
    reasons.push(`Long tweet (${textLen} chars) (+10)`);
  } else if (textLen > 100) {
    score += 5;
    reasons.push(`Medium tweet (${textLen} chars) (+5)`);
  }

  // Media attached (screenshots of product, demos)
  if (tweet.mediaUrls.length > 0) {
    score += 8;
    reasons.push(`${tweet.mediaUrls.length} media attachment(s) (+8)`);
  }

  // --- Negative signals ---

  // Low-signal pattern matches
  for (const pattern of LOW_SIGNAL_PATTERNS) {
    if (pattern.test(tweet.text || "")) {
      score -= 15;
      reasons.push(`Low-signal pattern: ${pattern.source} (-15)`);
    }
  }

  // Very short tweet with no links = likely noise
  if (textLen < 60 && usefulLinks.length === 0) {
    score -= 10;
    reasons.push("Short tweet with no links (-10)");
  }

  // No text at all
  if (!tweet.text) {
    score -= 20;
    reasons.push("No tweet text extracted (-20)");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: SignalLevel;
  if (score >= 40) {
    level = "high";
  } else if (score >= 20) {
    level = "medium";
  } else {
    level = "low";
  }

  const buildCandidate = level !== "low";

  return { score, level, buildCandidate, reasons };
}
