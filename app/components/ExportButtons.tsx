"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/src/lib/types";
import {
  exportMarkdown,
  exportJSON,
  exportPDF,
  exportDOCX,
  exportLLMPack,
} from "@/app/lib/exports";

const EXPORTS = [
  { label: "Markdown", fn: exportMarkdown },
  { label: "JSON", fn: exportJSON },
  { label: "PDF", fn: exportPDF },
  { label: "DOCX", fn: exportDOCX },
  { label: "LLM Pack (.zip)", fn: exportLLMPack },
] as const;

export default function ExportButtons({ data }: { data: AnalysisResult }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function handleExport(label: string, fn: (d: AnalysisResult) => void | Promise<void>) {
    setBusy(label);
    try {
      await fn(data);
    } catch (e) {
      console.error(`Export failed (${label}):`, e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Export</h3>
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map(({ label, fn }) => (
          <button
            key={label}
            disabled={busy !== null}
            onClick={() => handleExport(label, fn)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
          >
            {busy === label ? "Generating..." : label}
          </button>
        ))}
      </div>
    </div>
  );
}
