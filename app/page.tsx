"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { parseChangeItems, SAMPLE_RELEASE, type AudienceTag, type ChangeType } from "./change-parser";
import { generateDemoFlow } from "./demo-flow";
import { generateLaunchRecap, generateLaunchThread } from "./launch-content";
import { buildNarrativeGroups } from "./narrative-engine";

const audienceLabels: Record<AudienceTag, string> = {
  customer: "Customer",
  internal: "Internal",
  recruiter: "Recruiter",
};

const outputTabs = ["Demo", "Changelog", "Launch thread"] as const;
type OutputTab = (typeof outputTabs)[number];

type OutputMap = Record<OutputTab, string>;

type SamplePreset = {
  id: string;
  name: string;
  summary: string;
  release: string;
};

type CaptureHook = {
  id: string;
  title: string;
  format: "GIF" | "Screenshot";
  fileName: string;
  cue: string;
};

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "launch-week",
    name: "Launch week",
    summary: "Product launch blend: features, performance, docs, and rollout leadership.",
    release: SAMPLE_RELEASE,
  },
  {
    id: "platform-polish",
    name: "Platform polish",
    summary: "Post-launch cleanup focused on reliability, onboarding, and narrative-friendly wins.",
    release: `- feat: Added workspace templates for faster first-time setup
- fix: Resolved duplicate invoice email sends in billing flow
- perf: Reduced page transition jank across settings screens
- docs: Added troubleshooting guide for SSO provisioning
- refactor: Consolidated audit log handlers into typed shared utilities
- chore: Hardened release checklist automation for launch day handoff`,
  },
];

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);
}

function buildCaptureHooks(steps: ReturnType<typeof generateDemoFlow>, audience: AudienceTag): CaptureHook[] {
  return steps.map((step, idx) => {
    const format: CaptureHook["format"] = idx % 2 === 0 ? "GIF" : "Screenshot";
    const audienceLabel = audienceLabels[audience].toLowerCase();

    return {
      id: `hook-${step.index}`,
      title: `Step ${step.index}: ${step.title}`,
      format,
      fileName: `${String(step.index).padStart(2, "0")}-${slugify(step.title)}.${format === "GIF" ? "gif" : "png"}`,
      cue: `${step.speakingNotes[0] ?? "Highlight the value in one sentence"} (${audienceLabel} angle)`,
    };
  });
}

function compileDemoText(
  audience: AudienceTag,
  steps: ReturnType<typeof generateDemoFlow>,
  hooks: CaptureHook[],
): string {
  const lines = [`# ${audienceLabels[audience]} · Demo flow with speaking notes`];
  for (const step of steps) {
    lines.push(`\n## ${step.index}. ${step.title} (${step.durationLabel})`);
    for (const note of step.speakingNotes) lines.push(`- ${note}`);
  }

  if (hooks.length) {
    lines.push("\n## Capture hooks (screenshots & GIFs)");
    for (const hook of hooks) {
      lines.push(`- [${hook.format}] ${hook.fileName} — ${hook.cue}`);
    }
  }

  return lines.join("\n");
}

function compileThreadText(thread: ReturnType<typeof generateLaunchThread>): string {
  return thread.map((tweet) => `### Tweet ${tweet.index}/${tweet.total}\n${tweet.text}`).join("\n\n");
}

function exportMarkdown(filename: string, text: string) {
  if (!text.trim()) return;
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [selectedAudience, setSelectedAudience] = useState<AudienceTag>("customer");
  const [activeTab, setActiveTab] = useState<OutputTab>("Demo");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_PRESETS[0].id);
  const [loadedSampleName, setLoadedSampleName] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done">("idle");
  const [editedOutputs, setEditedOutputs] = useState<OutputMap>({
    Demo: "",
    Changelog: "",
    "Launch thread": "",
  });
  const [touchedTabs, setTouchedTabs] = useState<Record<OutputTab, boolean>>({
    Demo: false,
    Changelog: false,
    "Launch thread": false,
  });
  const sampleLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = useMemo(() => parseChangeItems(rawInput), [rawInput]);
  const narrative = useMemo(() => buildNarrativeGroups(parsed, selectedAudience), [parsed, selectedAudience]);
  const demoSteps = useMemo(() => generateDemoFlow(narrative.themes, selectedAudience), [narrative.themes, selectedAudience]);
  const customerNarrative = useMemo(() => buildNarrativeGroups(parsed, "customer"), [parsed]);
  const launchRecap = useMemo(
    () => generateLaunchRecap(parsed, customerNarrative.themes, demoSteps, selectedAudience),
    [customerNarrative.themes, demoSteps, parsed, selectedAudience],
  );
  const launchThread = useMemo(() => generateLaunchThread(launchRecap), [launchRecap]);
  const captureHooks = useMemo(() => buildCaptureHooks(demoSteps, selectedAudience), [demoSteps, selectedAudience]);

  const generatedOutputs = useMemo<OutputMap>(
    () => ({
      Demo: compileDemoText(selectedAudience, demoSteps, captureHooks),
      Changelog: launchRecap.markdown,
      "Launch thread": compileThreadText(launchThread),
    }),
    [captureHooks, demoSteps, launchRecap.markdown, launchThread, selectedAudience],
  );

  useEffect(() => {
    setEditedOutputs((prev) => ({
      Demo: touchedTabs.Demo ? prev.Demo : generatedOutputs.Demo,
      Changelog: touchedTabs.Changelog ? prev.Changelog : generatedOutputs.Changelog,
      "Launch thread": touchedTabs["Launch thread"] ? prev["Launch thread"] : generatedOutputs["Launch thread"],
    }));
  }, [generatedOutputs, touchedTabs]);

  useEffect(() => {
    return () => {
      if (sampleLoadTimerRef.current) clearTimeout(sampleLoadTimerRef.current);
    };
  }, []);

  const activeOutput = editedOutputs[activeTab];

  const samplePreset = useMemo(
    () => SAMPLE_PRESETS.find((preset) => preset.id === selectedSampleId) ?? SAMPLE_PRESETS[0],
    [selectedSampleId],
  );

  const onUseSample = (preset = samplePreset) => {
    setIsParsing(true);
    setTouchedTabs({ Demo: false, Changelog: false, "Launch thread": false });
    if (sampleLoadTimerRef.current) clearTimeout(sampleLoadTimerRef.current);
    sampleLoadTimerRef.current = setTimeout(() => {
      setRawInput(preset.release);
      setLoadedSampleName(preset.name);
      setIsParsing(false);
      sampleLoadTimerRef.current = null;
    }, 450);
  };

  const onCopyOutput = async () => {
    if (!activeOutput.trim()) return;
    await navigator.clipboard.writeText(activeOutput);
    setCopyState("done");
    setTimeout(() => setCopyState("idle"), 1200);
  };

  const onEditOutput = (value: string) => {
    setTouchedTabs((prev) => ({ ...prev, [activeTab]: true }));
    setEditedOutputs((prev) => ({ ...prev, [activeTab]: value }));
  };

  const onResetActiveOutput = () => {
    setTouchedTabs((prev) => ({ ...prev, [activeTab]: false }));
    setEditedOutputs((prev) => ({ ...prev, [activeTab]: generatedOutputs[activeTab] }));
  };

  const onExportMarkdown = () => {
    exportMarkdown(`storyline-${selectedAudience}-${activeTab.toLowerCase().replace(/\s+/g, "-")}.md`, activeOutput);
  };

  const onExportAllMarkdown = () => {
    const bundle = outputTabs
      .map((tab) => `# ${tab}\n\n${editedOutputs[tab].trim() || "_No content yet._"}`)
      .join("\n\n---\n\n");
    exportMarkdown(`storyline-${selectedAudience}-full.md`, bundle);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Changelog to Demo
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] tracking-[0.14em] text-blue-700">
                beta
              </span>
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Storyline Studio</h1>
            <p className="text-xs text-slate-500">Release notes → polished demo narrative, changelog, and launch thread.</p>
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
                  aria-pressed={selectedAudience === audience}
                  onClick={() => setSelectedAudience(audience)}
                >
                  {audienceLabels[audience]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onUseSample(samplePreset)}
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

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Sample dataset</p>
                <p className="mt-1 text-sm text-slate-700">Load a polished fake release to preview the full storytelling flow.</p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                {samplePreset.release.split(/\r?\n/).filter(Boolean).length} bullets
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={preset.id === selectedSampleId}
                  onClick={() => setSelectedSampleId(preset.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    preset.id === selectedSampleId
                      ? "border-blue-400 bg-white shadow-sm"
                      : "border-blue-100 bg-blue-50/40 hover:border-blue-200 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{preset.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{preset.summary}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUseSample(samplePreset)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-blue-700"
              >
                Load selected sample
              </button>
              {loadedSampleName && (
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  Loaded: {loadedSampleName}
                </span>
              )}
            </div>
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

          {activeTab === "Demo" &&
            (isParsing ? (
              <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Generating demo flow…</p>
                <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-16 animate-pulse rounded-lg bg-slate-200" />
              </article>
            ) : demoSteps.length === 0 ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">No demo flow yet.</p>
                <p className="mt-1">Add release bullets to generate 4–7 timed steps with speaking notes.</p>
              </article>
            ) : (
              <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Demo flow & speaking notes</p>
                {demoSteps.map((step) => (
                  <section key={step.index} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                          {step.index}
                        </span>
                        {step.title}
                      </h3>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{step.durationLabel}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {step.speakingNotes.map((note, idx) => (
                        <li key={`${step.index}-${idx}`} className="rounded bg-slate-50 px-2 py-1">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

                <section className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">Screenshot & GIF hook helpers</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                      {captureHooks.length} hooks
                    </span>
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {captureHooks.map((hook) => (
                      <li key={hook.id} className="rounded-lg border border-blue-100 bg-white p-2">
                        <p className="font-medium text-slate-900">
                          {hook.title} · <span className="text-blue-700">{hook.format}</span>
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-600">{hook.fileName}</p>
                        <p className="mt-1 text-xs text-slate-600">{hook.cue}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>
            ))}

          {activeTab === "Changelog" &&
            (isParsing ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Generating launch recap…</article>
            ) : parsed.length === 0 ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Launch recap appears here with customer changelog and internal notes.
              </article>
            ) : (
              <article className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">{launchRecap.heading}</p>
                {launchRecap.sections.map((section) => (
                  <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-3">
                    <h3 className="text-sm font-semibold text-slate-900">## {section.title}</h3>
                    {section.bullets.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">- No highlights yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {section.bullets.map((bullet) => (
                          <li key={`${section.title}-${bullet}`} className="rounded bg-slate-50 px-2 py-1 font-mono text-[13px]">
                            - {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </article>
            ))}

          {activeTab === "Launch thread" &&
            (isParsing ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Drafting social thread…</article>
            ) : launchThread.length === 0 ? (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Social thread cards appear here when release items are available.
              </article>
            ) : (
              <article className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Launch thread draft</p>
                {launchThread.map((tweet) => (
                  <section key={tweet.text} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm text-slate-800">{tweet.text}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-blue-700">tweet {tweet.index}</span>
                      <span className={tweet.chars > 260 ? "font-semibold text-amber-700" : ""}>{tweet.chars}/280 chars</span>
                    </div>
                  </section>
                ))}
              </article>
            ))}

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Editable output ({activeTab})</p>
              <div className="flex items-center gap-2">
                {copyState === "done" && <span className="text-xs font-medium text-emerald-700">Copied</span>}
                {touchedTabs[activeTab] && <span className="text-xs font-medium text-amber-700">Edited</span>}
              </div>
            </div>
            <textarea
              value={activeOutput}
              onChange={(e) => onEditOutput(e.target.value)}
              className="h-44 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-[13px] text-slate-800 outline-none ring-blue-500 focus:ring-2"
              placeholder="Generated markdown will appear here..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyOutput}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Copy output
            </button>
            <button
              type="button"
              onClick={onResetActiveOutput}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Reset tab draft
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
              Export tab Markdown
            </button>
            <button
              type="button"
              onClick={onExportAllMarkdown}
              className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200"
            >
              Export full Markdown
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
