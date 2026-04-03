import type { ExtractedLink } from "@/src/lib/types";

export default function SourceList({ links }: { links: ExtractedLink[] }) {
  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-lg font-semibold text-white">Extracted Sources</h3>
        <p className="mt-2 text-sm text-zinc-500">No outbound links found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Extracted Sources ({links.length})
      </h3>
      <ul className="space-y-3">
        {links.map((link, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="min-w-0 flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-sm text-blue-400 hover:underline"
              >
                {link.title || link.url}
              </a>
              <p className="mt-0.5 truncate text-xs text-zinc-600">
                {link.filename}
              </p>
            </div>
            {link.error ? (
              <span className="shrink-0 rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                {link.error}
              </span>
            ) : (
              <span className="shrink-0 rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                fetched
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
