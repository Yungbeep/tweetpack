"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TWEET_URL_RE =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/\d+/;

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a tweet URL.");
      return;
    }
    if (!TWEET_URL_RE.test(trimmed)) {
      setError(
        "Invalid URL. Expected format: https://x.com/<handle>/status/<id>"
      );
      return;
    }
    router.push(`/results?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white mb-3">
          tweetpack
        </h1>
        <p className="text-lg text-zinc-400 mb-10">
          Turn any tweet into a buildable spec for LLMs
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://x.com/someone/status/123456789"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-4 text-lg text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {error && <p className="text-red-400 text-sm text-left">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-4 text-lg font-semibold text-white transition hover:bg-blue-500 active:bg-blue-700"
          >
            Analyze
          </button>
        </form>

        <p className="mt-8 text-sm text-zinc-600">
          Paste a public X/Twitter post URL to extract, summarize, and package
          it for reconstruction with Claude Code or ChatGPT.
        </p>
      </div>
    </main>
  );
}
