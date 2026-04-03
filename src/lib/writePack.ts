import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { TweetData, ExtractedLink } from "./types";

export async function writePack(
  outputDir: string,
  tweet: TweetData,
  links: ExtractedLink[],
  markdownFiles: Map<string, string>,
  buildBrief: string,
  claudePrompt: string
): Promise<void> {
  const sourcesDir = join(outputDir, "sources");
  await mkdir(sourcesDir, { recursive: true });

  // tweet.json
  await writeFile(
    join(outputDir, "tweet.json"),
    JSON.stringify(tweet, null, 2),
    "utf-8"
  );

  // tweet.md
  const tweetMd = formatTweetMarkdown(tweet);
  await writeFile(join(outputDir, "tweet.md"), tweetMd, "utf-8");

  // extracted-links.json
  await writeFile(
    join(outputDir, "extracted-links.json"),
    JSON.stringify(links, null, 2),
    "utf-8"
  );

  // Source markdown files
  for (const [filename, content] of markdownFiles) {
    await writeFile(join(sourcesDir, filename), content, "utf-8");
  }

  // build-brief.md
  await writeFile(join(outputDir, "build-brief.md"), buildBrief, "utf-8");

  // claude-prompt.md
  await writeFile(join(outputDir, "claude-prompt.md"), claudePrompt, "utf-8");
}

export function formatTweetMarkdown(tweet: TweetData): string {
  let md = `# Tweet by ${tweet.author || "Unknown"} (@${tweet.handle || "unknown"})\n\n`;
  md += `URL: ${tweet.canonicalUrl}\n`;
  if (tweet.timestamp) md += `Date: ${tweet.timestamp}\n`;
  md += `\n---\n\n`;

  if (tweet.text) {
    md += `${tweet.text}\n\n`;
  } else {
    md += `*Tweet text could not be extracted*\n\n`;
  }

  if (tweet.quotedTweet) {
    md += `---\n\n`;
    md += `**Quoted tweet`;
    if (tweet.quotedTweet.handle) md += ` from @${tweet.quotedTweet.handle}`;
    md += `:**\n\n`;
    if (tweet.quotedTweet.text) md += `> ${tweet.quotedTweet.text}\n\n`;
  }

  if (tweet.mediaUrls.length > 0) {
    md += `## Media\n\n`;
    for (const url of tweet.mediaUrls) {
      md += `- ${url}\n`;
    }
    md += "\n";
  }

  if (tweet.outboundUrls.length > 0) {
    md += `## Links\n\n`;
    for (const url of tweet.outboundUrls) {
      md += `- ${url}\n`;
    }
    md += "\n";
  }

  return md;
}
