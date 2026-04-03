import type { SignalScore } from "@/src/lib/types";

const levelColors: Record<string, { bar: string; badge: string; text: string }> = {
  high: {
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    text: "text-emerald-400",
  },
  medium: {
    bar: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    text: "text-amber-400",
  },
  low: {
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    text: "text-red-400",
  },
};

export default function ScoreCard({ signal }: { signal: SignalScore }) {
  const colors = levelColors[signal.level];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Build Signal</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium uppercase ${colors.badge}`}
        >
          {signal.level}
        </span>
      </div>

      <div className="mb-2 flex items-end gap-2">
        <span className={`text-4xl font-bold ${colors.text}`}>
          {signal.score}
        </span>
        <span className="mb-1 text-zinc-500">/100</span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${colors.bar}`}
          style={{ width: `${signal.score}%` }}
        />
      </div>

      <p className="mb-3 text-sm text-zinc-400">
        {signal.buildCandidate
          ? "This tweet appears to describe a buildable product or project."
          : "This tweet does not appear to describe a buildable product."}
      </p>

      <details className="group">
        <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300">
          Scoring reasons
        </summary>
        <ul className="mt-2 space-y-1">
          {signal.reasons.map((reason, i) => (
            <li key={i} className="text-xs text-zinc-500">
              {reason}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
