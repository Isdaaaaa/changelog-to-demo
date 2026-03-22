export type ChangeType = "feat" | "fix" | "docs" | "chore" | "perf" | "refactor" | "other";
export type AudienceTag = "customer" | "internal" | "recruiter";

export type ChangeItem = {
  id: string;
  title: string;
  type: ChangeType;
  audience: AudienceTag[];
  sourceLine?: number;
};

const TYPE_PREFIX = /^(feat|fix|docs|chore|perf|refactor)(?:\([^)]+\))?!?:\s*(.+)$/i;
const BULLET_PREFIX = /^\s*(?:[-*•]\s+|\d+[.)]\s+)(?:\[[ xX]\]\s*)?(.*)$/;

const customerWords = /\b(user|customer|ui|dashboard|api|improv(e|ement|ed|ing)|faster|speed|ux)\b/i;
const internalWords = /\b(chore|refactor|ci|build|test|docs?|internal|tooling|cleanup|infra)\b/i;
const recruiterWords = /\b(leadership|cross-team|mentorship|architecture|performance impact|owned|initiative|mentored)\b/i;

function normalizeTitle(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function detectType(line: string): { type: ChangeType; title: string } {
  const typed = line.match(TYPE_PREFIX);
  if (typed) {
    return { type: typed[1].toLowerCase() as ChangeType, title: normalizeTitle(typed[2]) };
  }

  const lowered = line.toLowerCase();
  if (/\bfix|bug|patch|hotfix\b/.test(lowered)) return { type: "fix", title: normalizeTitle(line) };
  if (/\bperf|optimi[sz]e|latency|faster|speed\b/.test(lowered)) return { type: "perf", title: normalizeTitle(line) };
  if (/\brefactor\b/.test(lowered)) return { type: "refactor", title: normalizeTitle(line) };
  if (/\bdoc|readme\b/.test(lowered)) return { type: "docs", title: normalizeTitle(line) };
  if (/\bchore|deps|ci|build|test\b/.test(lowered)) return { type: "chore", title: normalizeTitle(line) };
  if (/\badd|new|launch|support|introduc(e|ed)\b/.test(lowered)) return { type: "feat", title: normalizeTitle(line) };

  return { type: "other", title: normalizeTitle(line) };
}

function mapAudience(type: ChangeType, title: string): AudienceTag[] {
  const tags = new Set<AudienceTag>();
  const haystack = `${type} ${title}`.toLowerCase();

  if (["feat", "fix", "perf"].includes(type) || customerWords.test(haystack)) tags.add("customer");
  if (["chore", "refactor", "docs"].includes(type) || internalWords.test(haystack)) tags.add("internal");
  if (recruiterWords.test(haystack) || /\barchitecture\b/.test(haystack)) tags.add("recruiter");

  if (!tags.size) tags.add("internal");
  return [...tags];
}

export function parseChangeItems(input: string): ChangeItem[] {
  const lines = input.split(/\r?\n/);

  const parsed: Array<ChangeItem | null> = lines.map((raw, index) => {
    const line = raw.trim();
    if (!line) return null;

    const bullet = raw.match(BULLET_PREFIX);
    const candidate = normalizeTitle(bullet ? bullet[1] : raw);
    if (!candidate) return null;

    const { type, title } = detectType(candidate);
    if (!title) return null;

    return {
      id: `chg-${index + 1}`,
      title,
      type,
      audience: mapAudience(type, title),
      sourceLine: index + 1,
    };
  });

  return parsed.filter((item): item is ChangeItem => item !== null);
}

export const SAMPLE_RELEASE = `- feat: Added guided import wizard for faster account setup
- fix: Dashboard filters now persist after refresh
- docs: Published migration notes for API v2 clients
1. chore: Update CI cache strategy for faster builds
2. refactor: Split notification service into typed modules
* perf: Reduced report generation latency by 38%
* Mentorship: Led cross-team rollout for launch readiness`;
