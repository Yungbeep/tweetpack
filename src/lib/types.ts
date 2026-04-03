import { z } from "zod/v4";

export const TweetDataSchema = z.object({
  url: z.string().url(),
  canonicalUrl: z.string().url(),
  author: z.string().optional(),
  handle: z.string().optional(),
  text: z.string().optional(),
  timestamp: z.string().optional(),
  mediaUrls: z.array(z.string().url()).default([]),
  quotedTweet: z
    .object({
      author: z.string().optional(),
      handle: z.string().optional(),
      text: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
  outboundUrls: z.array(z.string().url()).default([]),
});

export type TweetData = z.infer<typeof TweetDataSchema>;

export const ExtractedLinkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  filename: z.string(),
  fetchedAt: z.string(),
  error: z.string().optional(),
});

export type ExtractedLink = z.infer<typeof ExtractedLinkSchema>;

export interface BuildBrief {
  product: string;
  features: string[];
  userFlow: string[];
  inferredStack: string[];
  openQuestions: string[];
  assumptions: string[];
}

export type SignalLevel = "high" | "medium" | "low";

export interface SignalScore {
  score: number;
  level: SignalLevel;
  buildCandidate: boolean;
  reasons: string[];
}

export interface AnalysisResult {
  tweet: TweetData;
  signal: SignalScore;
  links: ExtractedLink[];
  buildBrief: string;
  claudePrompt: string;
  tweetMarkdown: string;
  sources: Array<{ filename: string; content: string }>;
}
