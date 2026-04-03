const TWEET_URL_RE =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)\/status\/(\d+)/;

export interface NormalizedTweet {
  handle: string;
  statusId: string;
  canonicalUrl: string;
}

export function normalizeTweetUrl(input: string): NormalizedTweet {
  const match = input.trim().match(TWEET_URL_RE);
  if (!match) {
    throw new Error(
      `Invalid tweet URL: ${input}\nExpected format: https://x.com/<handle>/status/<id>`
    );
  }
  const [, handle, statusId] = match;
  return {
    handle: handle!,
    statusId: statusId!,
    canonicalUrl: `https://x.com/${handle}/status/${statusId}`,
  };
}
