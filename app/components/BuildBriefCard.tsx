"use client";

import Markdown from "react-markdown";

export default function BuildBriefCard({ content }: { content: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Build Brief</h3>
      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-200 prose-a:text-blue-400">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
