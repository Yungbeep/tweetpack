import { NextRequest, NextResponse } from "next/server";
import { normalizeTweetUrl } from "@/src/lib/normalize";
import { extractTweet } from "@/src/lib/extractX";
import { extractAndFetchLinks } from "@/src/lib/extractLinks";
import { scoreTweetSignal } from "@/src/lib/scoreSignal";
import { generateBuildBrief } from "@/src/lib/buildBrief";
import { buildClaudePrompt } from "@/src/lib/promptBuilder";
import { formatTweetMarkdown } from "@/src/lib/writePack";
import type { AnalysisResult } from "@/src/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    // 1. Normalize
    let norm;
    try {
      norm = normalizeTweetUrl(url);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 }
      );
    }

    // 2. Extract tweet
    const tweet = await extractTweet(norm);

    // 3. Fetch outbound links
    const { links, markdownFiles } = await extractAndFetchLinks(
      tweet.outboundUrls,
      ""
    );

    // 4. Score signal
    const signal = scoreTweetSignal(tweet, links);

    // 5. Generate outputs
    const buildBrief = generateBuildBrief(tweet, links, markdownFiles, signal);
    const claudePrompt = buildClaudePrompt(tweet, links, "");
    const tweetMarkdown = formatTweetMarkdown(tweet);

    // 6. Collect sources
    const sources: AnalysisResult["sources"] = [];
    for (const [filename, content] of markdownFiles) {
      sources.push({ filename, content });
    }

    const result: AnalysisResult = {
      tweet,
      signal,
      links,
      buildBrief,
      claudePrompt,
      tweetMarkdown,
      sources,
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "Analysis failed" },
      { status: 500 }
    );
  }
}
