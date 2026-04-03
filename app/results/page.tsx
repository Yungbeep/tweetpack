"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { AnalysisResult } from "@/src/lib/types";
import TweetOverview from "@/app/components/TweetOverview";
import ScoreCard from "@/app/components/ScoreCard";
import BuildBriefCard from "@/app/components/BuildBriefCard";
import SourceList from "@/app/components/SourceList";
import ExportButtons from "@/app/components/ExportButtons";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");

  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setError("No URL provided.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function analyze() {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const result: AnalysisResult = await res.json();
        setData(result);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }

    analyze();
    return () => controller.abort();
  }, [url]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
        <p className="text-zinc-400">Analyzing tweet...</p>
        <p className="text-sm text-zinc-600">
          Extracting content and fetching linked pages. This may take a moment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-400">
            Analysis Failed
          </h2>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-400 hover:underline"
        >
          Try another URL
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-zinc-400 hover:text-white"
        >
          &larr; New analysis
        </button>
        <h1 className="text-2xl font-bold text-white">tweetpack</h1>
      </div>

      <div className="space-y-6">
        <TweetOverview tweet={data.tweet} />

        <div className="grid gap-6 md:grid-cols-2">
          <ScoreCard signal={data.signal} />
          <ExportButtons data={data} />
        </div>

        <BuildBriefCard content={data.buildBrief} />

        <SourceList links={data.links} />
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
