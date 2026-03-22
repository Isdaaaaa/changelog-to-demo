import type { AudienceTag } from "./change-parser";
import type { NarrativeTheme } from "./narrative-engine";

export type DemoStep = {
  index: number;
  title: string;
  durationLabel: string;
  speakingNotes: string[];
};

const MIN_STEPS = 4;
const MAX_STEPS = 7;

const audienceNouns: Record<AudienceTag, string> = {
  customer: "customer value",
  internal: "team velocity",
  recruiter: "execution impact",
};

function toDurationLabel(itemCount: number): string {
  const minutes = Math.max(1, Math.min(3, Math.ceil(itemCount / 2)));
  return `${minutes} min`;
}

function buildNotes(theme: NarrativeTheme, audience: AudienceTag): string[] {
  const highlight = theme.bullets.slice(0, 2).map((bullet) => bullet.replace(/^-\s*/, "").replace(/\.$/, ""));

  return [
    `Frame the step around ${theme.intent.toLowerCase()}`,
    ...highlight,
    `Tie back to ${audienceNouns[audience]} before moving to the next step`,
  ];
}

function splitStep(step: DemoStep): [DemoStep, DemoStep] {
  const midpoint = Math.max(1, Math.ceil(step.speakingNotes.length / 2));
  const leftNotes = step.speakingNotes.slice(0, midpoint);
  const rightNotes = step.speakingNotes.slice(midpoint);

  return [
    {
      ...step,
      title: `${step.title} — Setup`,
      speakingNotes: leftNotes,
      durationLabel: "1 min",
    },
    {
      ...step,
      title: `${step.title} — Proof`,
      speakingNotes: rightNotes.length ? rightNotes : ["Show one concrete before/after moment"],
      durationLabel: "1 min",
    },
  ];
}

export function generateDemoFlow(themes: NarrativeTheme[], audience: AudienceTag): DemoStep[] {
  if (!themes.length) return [];

  let steps: DemoStep[] = themes.map((theme, index) => ({
    index: index + 1,
    title: theme.title,
    durationLabel: toDurationLabel(theme.items.length),
    speakingNotes: buildNotes(theme, audience),
  }));

  while (steps.length < MIN_STEPS) {
    let splitAt = -1;
    for (let i = 0; i < steps.length; i += 1) {
      if (steps[i].speakingNotes.length >= 3) {
        splitAt = i;
        break;
      }
    }
    if (splitAt === -1) break;
    const [first, second] = splitStep(steps[splitAt]);
    steps = [...steps.slice(0, splitAt), first, second, ...steps.slice(splitAt + 1)];
  }

  if (steps.length > MAX_STEPS) {
    const kept = steps.slice(0, MAX_STEPS - 1);
    const merged = steps.slice(MAX_STEPS - 1);
    const mergedNotes = merged.flatMap((step) => step.speakingNotes.slice(0, 1));

    kept.push({
      index: kept.length + 1,
      title: "Wrap-up & launch cue",
      durationLabel: "1 min",
      speakingNotes: mergedNotes.length
        ? mergedNotes
        : ["Summarize the demo arc and close with next action"],
    });

    steps = kept;
  }

  return steps.map((step, idx) => ({ ...step, index: idx + 1 }));
}
