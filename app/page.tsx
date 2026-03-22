"use client";

import { useMemo, useState } from "react";

import { parseChangeItems, SAMPLE_RELEASE, type AudienceTag, type ChangeType } from "./change-parser";
import { buildNarrativeGroups } from "./narrative-engine";

const audienceLabels: Record<AudienceTag, string> = {
  customer: "Customer",
  internal: "Internal",
  recruiter: "Recruiter",
};

const outputTabs = ["Demo", "Changelog", "Launch thread"] as const;
type OutputTab = (typeof outputTabs)[number];

function badgeForType(type: ChangeType) {
  switch (type) {
    case "feat":
      return "bg-blue-100 text-blue-800";
    case "fix":
      return "bg-emerald-100 text-emerald-800";
    case "perf":
      return "bg-amber-100 text-amber-900";
    case "docs":
      return "bg-indigo-100 text-indigo-800";
    case "chore":
      return "bg-slate-200 text-slate-700";
    case "refactor":
      return "bg-fuchsia-100 text-fuchsia-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function Home() {
  const [selectedAudience, setSelectedAudience] = useState<AudienceTag>("customer");
  const [activeTab, setActiveTab] = useState<OutputTab>("Demo");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const parsed = useMemo(() => parseChangeItems(rawInput), [rawInput]);
  const narrative = useMemo(() => buildNarrativeGroups(parsed, selectedAudience), [parsed, selectedAudience]);

  const outputTitle =
    activeTab === "Demo"
      ? "Demo talking points"
      : activeTab === "Changelog"
        ? "Customer/internal changelog draft"
        : "Launch thread draft";

  const compiledText = useMemo(() => {
    const lines = [`${audienceLabels[selectedAudience]} · ${outputTitle}`];
    for (const theme of narrative.themes) {
      lines.push(`\n${theme.title}`);
      lines.push(theme.intent);
      for (const bullet of theme.bullets) lines.push(bullet);
    }
    return lines.join("\n");
  }, [narrative.themes, outputTitle, selectedAudience]);

  const onUseSample = () => {
    setIsParsing(true);
    setTimeout(() => {
      setRawInput(SAMPLE_RELEASE);
      setIsParsing(false);
    }, 450);
  };

  const onCopyScript = async () => {
    if (!compiledText.trim()) return;
    await navigator.clipboard.writeText(compiledText);
  };

  const onExportMarkdown = () => {
    if (!compiledText.trim()) return;
    const blob = new Blob([compiledText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyline-${selectedAudience}-${activeTab.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600">Changelog to Demo</p>
            <h1 className="text-lg font-semibold text-slate-900">Storyline Studio</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 p-1">
              {(Object.keys(audienceLabels) as AudienceTag[]).map((audience) => (
                <button
                  key={audience}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    selectedAudience === audience ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                  type="button"
                  onClick={() => setSelectedAudience(audience)}
                >
                  {audienceLabels[audience]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onUseSample}
              className="rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
            >
              Use sample release
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(320px,1fr)_minmax(420px,1.2fr)] lg:px-8">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Inputs & Grouping</h2>
            <p className="mt-1 text-sm text-slate-600">Paste release notes or PR bullets to extract grouped themes.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Release notes input</span>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="h-40 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="- feat: Added trial setup wizard\n- fix: Improved dashboard load time"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Parser preview</p>
            {isParsing ? (
              <div className="mt-3 space-y-2">
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              </div>
            ) : parsed.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No parsed items yet. Paste bullet points or use sample data.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {parsed.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2">
                    <span className="line-clamp-2">{item.title}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeForType(item.type)}`}>{item.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Outputs</h2>
            <div className="flex rounded-xl border border-slate-300 bg-slate-50 p-1">
              {outputTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    activeTab === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {isParsing ? (
            <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Building narrative themes…</p>
              <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
            </article>
          ) : narrative.totalItems === 0 ? (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">No {audienceLabels[selectedAudience].toLowerCase()} items yet.</p>
              <p className="mt-1">Try feat/fix/perf/docs/chore/refactor lines, then switch audiences to inspect grouped narratives.</p>
            </article>
          ) : (
            <article className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">{outputTitle}</p>
              <div className="space-y-3">
                {narrative.themes.map((theme) => (
                  <section key={theme.key} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{theme.title}</h3>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{theme.items.length} items</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{theme.intent}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {theme.bullets.map((bullet, idx) => (
                        <li key={`${theme.key}-${idx}`} className="rounded bg-slate-50 px-2 py-1">
                          {bullet.replace(/^-\s*/, "")}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyScript}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Copy script
            </button>
            <button
              type="button"
              onClick={() => setRawInput("")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear input
            </button>
            <button
              type="button"
              onClick={onExportMarkdown}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Export Markdown
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
