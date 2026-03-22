"use client";

import { useMemo, useState } from "react";

type ChangeType = "feat" | "fix" | "perf" | "docs" | "chore" | "refactor" | "other";
type Audience = "customer" | "internal" | "recruiter";

type ChangeItem = {
  id: string;
  title: string;
  type: ChangeType;
  audiences: Audience[];
  sourceLine?: number;
};

const audienceLabels: Record<Audience, string> = {
  customer: "Customer",
  internal: "Internal",
  recruiter: "Recruiter",
};

const outputTabs = ["Demo", "Changelog", "Launch thread"];

const sampleRelease = `## v1.8.0\n- feat: Added guided import flow for first-time users\n- fix: Resolved dashboard chart lag for high-volume teams\n- refactor: Split parser pipeline into reusable modules\n- docs: Added integration playbook for onboarding\n1. perf: Improved API response time by 28%\n2. chore: tighten CI checks for release branches\n* Led cross-team launch prep and mentoring for onboarding owners`;

const typePattern = /^(feat|fix|docs|chore|perf|refactor)\s*:\s*/i;
const bulletPattern = /^\s*(?:[-*•]|\d+[.)])\s+/;

function classifyType(line: string): ChangeType {
  const match = line.match(typePattern);
  if (!match) return "other";
  return match[1].toLowerCase() as ChangeType;
}

function parseReleaseNotes(input: string): ChangeItem[] {
  return input
    .split("\n")
    .map((raw, index) => ({ raw, index: index + 1 }))
    .filter(({ raw }) => {
      const trimmed = raw.trim();
      return Boolean(trimmed) && (bulletPattern.test(trimmed) || typePattern.test(trimmed));
    })
    .map(({ raw, index }, i) => {
      let cleaned = raw.trim().replace(bulletPattern, "");
      const type = classifyType(cleaned);
      if (type !== "other") cleaned = cleaned.replace(typePattern, "");
      const title = cleaned.trim().replace(/\.$/, "");
      const lower = title.toLowerCase();

      const audiences = new Set<Audience>();

      if (
        ["feat", "fix", "perf"].includes(type) ||
        /(user|customer|ui|dashboard|api|improv|experience|workflow|onboarding)/.test(lower)
      ) {
        audiences.add("customer");
      }
      if (
        ["chore", "refactor", "docs"].includes(type) ||
        /(internal|tooling|ci|build|test|docs|infra|pipeline|maintenance)/.test(lower)
      ) {
        audiences.add("internal");
      }
      if (/(leadership|cross-team|mentorship|mentor|architecture|performance impact|scal|ownership)/.test(lower)) {
        audiences.add("recruiter");
      }

      if (audiences.size === 0) audiences.add("customer");

      return {
        id: `chg-${i + 1}`,
        title,
        type,
        audiences: [...audiences],
        sourceLine: index,
      } satisfies ChangeItem;
    })
    .filter((item) => item.title.length > 0);
}

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
  const [selectedAudience, setSelectedAudience] = useState<Audience>("customer");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const parsed = useMemo(() => parseReleaseNotes(rawInput), [rawInput]);

  const grouped = useMemo(() => {
    return parsed.filter((item) => item.audiences.includes(selectedAudience));
  }, [parsed, selectedAudience]);

  const onUseSample = () => {
    setIsParsing(true);
    setTimeout(() => {
      setRawInput(sampleRelease);
      setIsParsing(false);
    }, 450);
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
              {(Object.keys(audienceLabels) as Audience[]).map((audience) => (
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
            <p className="mt-1 text-sm text-slate-600">Paste release notes or PR bullets to extract structured change items.</p>
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
                {parsed.slice(0, 4).map((item) => (
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
              {outputTabs.map((tab, idx) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    idx === 0 ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {isParsing ? (
            <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Grouping changes…</p>
              <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
            </article>
          ) : grouped.length === 0 ? (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">No {audienceLabels[selectedAudience].toLowerCase()} items yet.</p>
              <p className="mt-1">Try adding lines like feat:, fix:, docs:, chore:, perf:, or refactor: to seed this view.</p>
            </article>
          ) : (
            <article className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">
                {audienceLabels[selectedAudience]} narrative queue · {grouped.length} item{grouped.length > 1 ? "s" : ""}
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                {grouped.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeForType(item.type)}`}>{item.type}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Source line {item.sourceLine ?? "n/a"}</p>
                  </li>
                ))}
              </ul>
            </article>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Copy script
            </button>
            <button
              type="button"
              onClick={() => setRawInput("")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear input
            </button>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Export Markdown
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
