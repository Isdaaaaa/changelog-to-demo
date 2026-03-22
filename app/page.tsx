const audience = ["Customer", "Internal", "Recruiter"];
const outputTabs = ["Demo", "Changelog", "Launch thread"];

export default function Home() {
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
              {audience.map((item, idx) => (
                <button
                  key={item}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    idx === 0 ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
                  }`}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
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
            <p className="mt-1 text-sm text-slate-600">Paste changelog text, add release URL, and choose what to include.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Release notes input</span>
            <textarea
              className="h-40 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="Drop markdown notes, Jira links, or sprint recap bullets..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Release URL helper</span>
            <input
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none ring-blue-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="https://github.com/acme/product/releases/tag/v1.2.0"
              type="url"
            />
          </label>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">Change buckets</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Customer visible", "bg-emerald-100 text-emerald-800"],
                ["Internal improvements", "bg-slate-200 text-slate-700"],
                ["Recruiter highlights", "bg-amber-100 text-amber-800"],
                ["Needs verification", "bg-red-100 text-red-700"],
              ].map(([label, classes]) => (
                <label key={label} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>
                </label>
              ))}
            </div>
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

          <article className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-700">Demo flow · draft</p>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">1. Open with customer value (00:20)</p>
                <p>&ldquo;Today we reduced setup time by 42% with guided imports and safer defaults.&rdquo;</p>
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">2. Walk through updated workflow (01:10)</p>
                <p>Highlight the bulk action panel and mention fallback guardrails for failures.</p>
              </li>
              <li className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">3. Close with launch CTA (00:30)</p>
                <p>Invite users to try sample data and point to the migration checklist.</p>
              </li>
            </ol>
          </article>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Copy script
            </button>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Regenerate section
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
