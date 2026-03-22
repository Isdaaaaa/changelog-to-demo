import type { AudienceTag, ChangeItem, ChangeType } from "./change-parser";

export type ThemeKey = "onboarding" | "reliability" | "performance" | "developerExperience" | "launchLeadership";

export type NarrativeTheme = {
  key: ThemeKey;
  title: string;
  intent: string;
  items: ChangeItem[];
  bullets: string[];
};

export type NarrativeResult = {
  audience: AudienceTag;
  totalItems: number;
  themes: NarrativeTheme[];
};

const THEME_PRIORITY: ThemeKey[] = [
  "onboarding",
  "reliability",
  "performance",
  "developerExperience",
  "launchLeadership",
];

const THEME_META: Record<ThemeKey, { title: string; intent: string }> = {
  onboarding: {
    title: "Onboarding & Activation",
    intent: "Highlight faster time-to-value for new or returning users.",
  },
  reliability: {
    title: "Reliability & Stability",
    intent: "Show trust gains from fixes, resilience, and fewer regressions.",
  },
  performance: {
    title: "Performance & Scale",
    intent: "Quantify speed, latency, and scale improvements.",
  },
  developerExperience: {
    title: "Developer Experience",
    intent: "Show workflow quality for internal teams and future maintainers.",
  },
  launchLeadership: {
    title: "Launch & Leadership",
    intent: "Surface cross-team ownership, mentorship, and strategic execution.",
  },
};

const THEME_WORDS: Record<ThemeKey, RegExp> = {
  onboarding: /\b(onboarding|import|setup|first[- ]time|activation|adoption|migration|playbook|wizard)\b/i,
  reliability: /\b(fix|bug|stability|reliability|persist|crash|incident|error|resilien|quality|regression)\b/i,
  performance: /\b(perf|performance|latency|faster|speed|optimi[sz]e|throughput|response time|cache)\b/i,
  developerExperience: /\b(refactor|typed?|module|pipeline|ci|build|test|tooling|docs?|maintain|developer experience|dx)\b/i,
  launchLeadership: /\b(launch|rollout|cross-team|lead|mentorship|mentor|ownership|initiative|architecture|strategy)\b/i,
};

const TYPE_THEME_WEIGHT: Record<ChangeType, Partial<Record<ThemeKey, number>>> = {
  feat: { onboarding: 2, launchLeadership: 1 },
  fix: { reliability: 3 },
  perf: { performance: 3 },
  refactor: { developerExperience: 3 },
  docs: { developerExperience: 2, onboarding: 1 },
  chore: { developerExperience: 2, reliability: 1 },
  other: {},
};

const AUDIENCE_PREFIX: Record<AudienceTag, string> = {
  customer: "Customer value:",
  internal: "Internal improvement:",
  recruiter: "Impact signal:",
};

function scoreTheme(item: ChangeItem, key: ThemeKey): number {
  const title = item.title.toLowerCase();
  let score = 0;
  if (THEME_WORDS[key].test(title)) score += 2;
  score += TYPE_THEME_WEIGHT[item.type][key] ?? 0;
  if (key === "launchLeadership" && item.audience.includes("recruiter")) score += 1;
  if (key === "onboarding" && /\b(user|customer|trial|account)\b/.test(title)) score += 1;
  return score;
}

function chooseTheme(item: ChangeItem): ThemeKey {
  let winner: ThemeKey = "developerExperience";
  let best = -1;

  for (const key of THEME_PRIORITY) {
    const score = scoreTheme(item, key);
    if (score > best) {
      best = score;
      winner = key;
    }
  }

  if (best > 0) return winner;
  if (item.type === "fix") return "reliability";
  if (item.type === "perf") return "performance";
  if (item.type === "feat") return "onboarding";
  return "developerExperience";
}

function conciseTitle(title: string): string {
  return title.replace(/^(added|improved|updated|reduced|split|published)\s+/i, (m) => m.toLowerCase());
}

function customerBullets(theme: NarrativeTheme): string[] {
  return theme.items.map((item) => `- ${AUDIENCE_PREFIX.customer} ${conciseTitle(item.title)}.`);
}

function internalBullets(theme: NarrativeTheme): string[] {
  return theme.items.map((item) => `- ${AUDIENCE_PREFIX.internal} ${conciseTitle(item.title)} (${item.type}).`);
}

function recruiterBullets(theme: NarrativeTheme): string[] {
  return theme.items.map((item) => `- ${AUDIENCE_PREFIX.recruiter} ${conciseTitle(item.title)}; demonstrates execution and ownership.`);
}

export function buildNarrativeGroups(items: ChangeItem[], audience: AudienceTag): NarrativeResult {
  const selected = items.filter((item) => item.audience.includes(audience));

  const grouped = new Map<ThemeKey, ChangeItem[]>();
  for (const key of THEME_PRIORITY) grouped.set(key, []);

  for (const item of selected) {
    const key = chooseTheme(item);
    grouped.get(key)?.push(item);
  }

  const themes = THEME_PRIORITY.map((key): NarrativeTheme | null => {
    const themedItems = grouped.get(key) ?? [];
    if (!themedItems.length) return null;

    const base: NarrativeTheme = {
      key,
      title: THEME_META[key].title,
      intent: THEME_META[key].intent,
      items: themedItems,
      bullets: [],
    };

    base.bullets =
      audience === "customer"
        ? customerBullets(base)
        : audience === "internal"
          ? internalBullets(base)
          : recruiterBullets(base);

    return base;
  }).filter((theme): theme is NarrativeTheme => Boolean(theme));

  return { audience, totalItems: selected.length, themes };
}

export const audienceTemplateHelpers = {
  customer: customerBullets,
  internal: internalBullets,
  recruiter: recruiterBullets,
};
