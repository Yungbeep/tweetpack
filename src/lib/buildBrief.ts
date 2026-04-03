import type { TweetData, ExtractedLink, BuildBrief, SignalScore } from "./types";

export function generateBuildBrief(
  tweet: TweetData,
  links: ExtractedLink[],
  sourceMarkdowns: Map<string, string>,
  signal: SignalScore
): string {
  if (signal.level === "low") {
    return generateLowSignalReport(tweet, signal);
  }
  if (signal.level === "medium") {
    return generateMediumSignalBrief(tweet, links, sourceMarkdowns, signal);
  }
  return generateHighSignalBrief(tweet, links, sourceMarkdowns, signal);
}

// ── Low signal: no fake product analysis ──────────────────────────

function generateLowSignalReport(tweet: TweetData, signal: SignalScore): string {
  let md = `# Build Brief — Not Enough Signal\n\n`;
  md += `Generated from: ${tweet.canonicalUrl}\n`;
  md += `Author: ${tweet.author || "Unknown"} (@${tweet.handle || "unknown"})\n`;
  md += `Date extracted: ${new Date().toISOString()}\n\n`;

  md += `## Signal Assessment\n\n`;
  md += `**Score:** ${signal.score}/100\n`;
  md += `**Level:** ${signal.level}\n`;
  md += `**Build candidate:** No\n\n`;

  md += `This tweet does not appear to describe a product, tool, or buildable project. `;
  md += `It may be a personal opinion, commentary, joke, or other non-build content.\n\n`;

  if (tweet.text) {
    md += `### Original Tweet\n\n> ${tweet.text}\n\n`;
  }

  md += `### Why This Was Scored Low\n\n`;
  for (const r of signal.reasons) {
    md += `- ${r}\n`;
  }
  md += `\n`;

  md += `### What To Do\n\n`;
  md += `- If this tweet links to or references a product elsewhere in a thread, try extracting the thread root or a more specific tweet.\n`;
  md += `- If the product context is in a reply or quoted tweet that wasn't captured, provide that URL instead.\n`;
  md += `- This tool works best with tweets that announce, demo, or describe a specific product or project.\n`;

  return md;
}

// ── Medium signal: cautious brief with uncertainty ────────────────

function generateMediumSignalBrief(
  tweet: TweetData,
  links: ExtractedLink[],
  sourceMarkdowns: Map<string, string>,
  signal: SignalScore
): string {
  const brief = analyzeTweet(tweet, links, sourceMarkdowns);

  let md = `# Build Brief — Limited Signal\n\n`;
  md += `Generated from: ${tweet.canonicalUrl}\n`;
  md += `Author: ${tweet.author || "Unknown"} (@${tweet.handle || "unknown"})\n`;
  md += `Date extracted: ${new Date().toISOString()}\n\n`;

  md += `## Signal Assessment\n\n`;
  md += `**Score:** ${signal.score}/100\n`;
  md += `**Level:** ${signal.level}\n`;
  md += `**Build candidate:** Yes (with caveats)\n\n`;

  md += `> **Warning:** This tweet has some build-related signals but not enough for a confident analysis. `;
  md += `The following brief is speculative — verify details before building.\n\n`;

  md += `### Signal Reasons\n\n`;
  for (const r of signal.reasons) {
    md += `- ${r}\n`;
  }
  md += `\n`;

  md += `## What This Product Might Do\n\n`;
  md += `${brief.product}\n\n`;

  md += `## Possible Feature Set (Uncertain)\n\n`;
  for (const f of brief.features) {
    md += `- ${f}\n`;
  }
  md += "\n";

  md += `## Speculative User Flow\n\n`;
  for (let i = 0; i < brief.userFlow.length; i++) {
    md += `${i + 1}. ${brief.userFlow[i]}\n`;
  }
  md += "\n";

  md += `## Inferred Stack\n\n`;
  for (const s of brief.inferredStack) {
    md += `- ${s}\n`;
  }
  md += "\n";

  md += `## Open Questions (Many)\n\n`;
  md += `- Is this actually a buildable product, or just a discussion/idea?\n`;
  for (const q of brief.openQuestions) {
    md += `- ${q}\n`;
  }
  md += "\n";

  md += `## Assumptions Made\n\n`;
  for (const a of brief.assumptions) {
    md += `- ${a}\n`;
  }
  md += "\n";

  return md;
}

// ── High signal: full confident brief ─────────────────────────────

function generateHighSignalBrief(
  tweet: TweetData,
  links: ExtractedLink[],
  sourceMarkdowns: Map<string, string>,
  signal: SignalScore
): string {
  const brief = analyzeTweet(tweet, links, sourceMarkdowns);

  let md = `# Build Brief\n\n`;
  md += `Generated from: ${tweet.canonicalUrl}\n`;
  md += `Author: ${tweet.author || "Unknown"} (@${tweet.handle || "unknown"})\n`;
  md += `Date extracted: ${new Date().toISOString()}\n\n`;

  md += `## Signal Assessment\n\n`;
  md += `**Score:** ${signal.score}/100\n`;
  md += `**Level:** ${signal.level}\n`;
  md += `**Build candidate:** Yes\n\n`;

  md += `## What This Product Appears to Do\n\n`;
  md += `${brief.product}\n\n`;

  md += `## Likely MVP Feature Set\n\n`;
  for (const f of brief.features) {
    md += `- ${f}\n`;
  }
  md += "\n";

  md += `## Likely User Flow\n\n`;
  for (let i = 0; i < brief.userFlow.length; i++) {
    md += `${i + 1}. ${brief.userFlow[i]}\n`;
  }
  md += "\n";

  md += `## Inferred Stack\n\n`;
  for (const s of brief.inferredStack) {
    md += `- ${s}\n`;
  }
  md += "\n";

  md += `## Open Questions\n\n`;
  for (const q of brief.openQuestions) {
    md += `- ${q}\n`;
  }
  md += "\n";

  md += `## Assumptions Made\n\n`;
  for (const a of brief.assumptions) {
    md += `- ${a}\n`;
  }
  md += "\n";

  return md;
}

// ── Shared analysis logic ─────────────────────────────────────────

function analyzeTweet(
  tweet: TweetData,
  links: ExtractedLink[],
  sourceMarkdowns: Map<string, string>
): BuildBrief {
  const text = tweet.text || "";
  const allContent = [
    text,
    tweet.quotedTweet?.text || "",
    ...Array.from(sourceMarkdowns.values()).map((md) => md.slice(0, 2000)),
  ].join("\n");

  const lowerContent = allContent.toLowerCase();

  const stackSignals: Record<string, string[]> = {
    React: ["react", "jsx", "next.js", "nextjs", "vercel"],
    "Next.js": ["next.js", "nextjs", "vercel"],
    Vue: ["vue", "nuxt"],
    Svelte: ["svelte", "sveltekit"],
    "Node.js": ["node", "express", "fastify"],
    Python: ["python", "django", "flask", "fastapi"],
    "Tailwind CSS": ["tailwind"],
    TypeScript: ["typescript", "tsx"],
    Supabase: ["supabase"],
    Firebase: ["firebase"],
    PostgreSQL: ["postgres", "postgresql"],
    MongoDB: ["mongodb", "mongo"],
    Redis: ["redis"],
    Docker: ["docker"],
    AWS: ["aws", "lambda", "s3"],
    Stripe: ["stripe"],
    OpenAI: ["openai", "gpt", "chatgpt"],
    Claude: ["claude", "anthropic"],
  };

  const inferredStack: string[] = [];
  for (const [tech, signals] of Object.entries(stackSignals)) {
    if (signals.some((s) => lowerContent.includes(s))) {
      inferredStack.push(tech);
    }
  }

  const hasGithub = links.some((l) => l.url.includes("github.com"));
  if (hasGithub) inferredStack.push("Open source (GitHub repo linked)");

  if (inferredStack.length === 0) {
    inferredStack.push("Not enough information to infer stack");
  }

  const product = text
    ? `Based on the tweet: "${text.slice(0, 300)}${text.length > 300 ? "..." : ""}"`
    : "Could not extract tweet text. Refer to source materials for context.";

  const features: string[] = [];
  features.push("Core functionality described in tweet");
  if (tweet.mediaUrls.length > 0)
    features.push("Visual/UI component (media attached)");
  if (links.length > 0)
    features.push(
      `Reference materials from ${links.length} linked source(s)`
    );
  if (tweet.quotedTweet?.text)
    features.push("Additional context from quoted tweet");

  const userFlow: string[] = [
    "User discovers the product",
    "User accesses the main interface",
    "User performs the core action described in the tweet",
    "User gets the result/output",
  ];

  const openQuestions: string[] = [
    "What is the exact scope of the MVP vs full product?",
    "Is authentication required?",
    "What is the primary deployment target?",
    "Are there any paid/premium features?",
  ];
  if (!tweet.text)
    openQuestions.unshift(
      "Tweet text could not be fully extracted — verify source content manually"
    );

  const assumptions: string[] = [
    "This is a web-based product unless otherwise indicated",
    "The MVP should focus on the single core feature shown",
    "No authentication needed for initial prototype",
    "Modern browser support only",
  ];

  return {
    product,
    features,
    userFlow,
    inferredStack,
    openQuestions,
    assumptions,
  };
}
