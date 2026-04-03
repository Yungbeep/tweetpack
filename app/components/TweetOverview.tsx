import type { TweetData } from "@/src/lib/types";

export default function TweetOverview({ tweet }: { tweet: TweetData }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {tweet.author || "Unknown"}
          </h2>
          <p className="text-zinc-400">@{tweet.handle || "unknown"}</p>
        </div>
        {tweet.timestamp && (
          <time className="text-sm text-zinc-500">
            {new Date(tweet.timestamp).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      {tweet.text ? (
        <p className="whitespace-pre-wrap text-zinc-200 leading-relaxed">
          {tweet.text}
        </p>
      ) : (
        <p className="italic text-zinc-500">Tweet text could not be extracted</p>
      )}

      {tweet.quotedTweet?.text && (
        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="mb-1 text-sm text-zinc-400">
            Quoted{tweet.quotedTweet.handle ? ` @${tweet.quotedTweet.handle}` : ""}
          </p>
          <p className="text-sm text-zinc-300">{tweet.quotedTweet.text}</p>
        </div>
      )}

      {tweet.mediaUrls.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tweet.mediaUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              Media {i + 1}
            </a>
          ))}
        </div>
      )}

      <a
        href={tweet.canonicalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm text-blue-400 hover:underline"
      >
        View original tweet
      </a>
    </div>
  );
}
