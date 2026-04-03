#!/usr/bin/env node

import { Command } from "commander";
import { join, resolve } from "node:path";
import { normalizeTweetUrl } from "./lib/normalize.js";
import { extractTweet } from "./lib/extractX.js";
import { extractAndFetchLinks } from "./lib/extractLinks.js";
import { generateBuildBrief } from "./lib/buildBrief.js";
import { buildClaudePrompt } from "./lib/promptBuilder.js";
import { writePack } from "./lib/writePack.js";
import { scoreTweetSignal } from "./lib/scoreSignal.js";

const program = new Command();

program
  .name("tweetpack")
  .description(
    "Turn a public X/Twitter post URL into an LLM-readable local build pack"
  )
  .version("1.0.0")
  .argument("<url>", "Tweet/post URL (x.com or twitter.com)")
  .option("-o, --output <dir>", "Output base directory", ".")
  .action(async (url: string, opts: { output: string }) => {
    try {
      console.log("\n[tweetpack] Starting...\n");

      // 1. Normalize URL
      console.log("[1/6] Normalizing URL...");
      const norm = normalizeTweetUrl(url);
      console.log(`  Canonical: ${norm.canonicalUrl}`);

      // 2. Extract tweet
      console.log("\n[2/6] Extracting tweet...");
      const tweet = await extractTweet(norm);
      if (tweet.text) {
        console.log(
          `  Got tweet text (${tweet.text.length} chars) by @${tweet.handle}`
        );
      } else {
        console.log("  Warning: no tweet text extracted");
      }

      // 3. Fetch outbound links
      const outputDirName = `${norm.handle}_${norm.statusId}`;
      const outputDir = resolve(opts.output, outputDirName);
      const sourcesDir = join(outputDir, "sources");

      console.log(`\n[3/6] Fetching ${tweet.outboundUrls.length} outbound link(s)...`);
      const { links, markdownFiles } = await extractAndFetchLinks(
        tweet.outboundUrls,
        sourcesDir
      );

      // 4. Score signal quality + generate brief
      console.log("\n[4/6] Scoring build signal...");
      const signal = scoreTweetSignal(tweet, links);
      console.log(`  Score:  ${signal.score}/100`);
      console.log(`  Level:  ${signal.level}`);
      console.log(`  Build candidate: ${signal.buildCandidate ? "yes" : "no"}`);
      for (const r of signal.reasons) {
        console.log(`    ${r}`);
      }

      console.log("\n[5/6] Generating build brief and prompt...");
      const buildBrief = generateBuildBrief(tweet, links, markdownFiles, signal);
      const claudePrompt = buildClaudePrompt(tweet, links, outputDir);

      // 6. Write output
      console.log("\n[6/6] Writing output pack...");
      await writePack(
        outputDir,
        tweet,
        links,
        markdownFiles,
        buildBrief,
        claudePrompt
      );

      // Summary
      const successLinks = links.filter((l) => !l.error).length;
      const failLinks = links.filter((l) => l.error).length;

      console.log("\n========================================");
      console.log(" tweetpack complete!");
      console.log("========================================");
      console.log(`  Output:     ${outputDir}`);
      console.log(`  Tweet:      ${tweet.text ? "extracted" : "partial"}`);
      console.log(`  Author:     @${tweet.handle || "unknown"}`);
      console.log(`  Signal:     ${signal.score}/100 (${signal.level}) ${signal.buildCandidate ? "— build candidate" : "— not a build candidate"}`);
      console.log(`  Links:      ${successLinks} fetched, ${failLinks} failed`);
      console.log(`  Sources:    ${markdownFiles.size} page(s) saved`);
      console.log("");
      console.log("  Files created:");
      console.log("    tweet.json");
      console.log("    tweet.md");
      console.log("    extracted-links.json");
      console.log("    build-brief.md");
      console.log("    claude-prompt.md");
      if (markdownFiles.size > 0) {
        console.log(`    sources/ (${markdownFiles.size} files)`);
      }
      console.log("========================================\n");
    } catch (err) {
      console.error(`\n[tweetpack] Error: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

program.parse();
