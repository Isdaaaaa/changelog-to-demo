import type { AudienceTag, ChangeItem } from "./change-parser";
import type { DemoStep } from "./demo-flow";
import type { NarrativeTheme } from "./narrative-engine";

export type LaunchRecapSection = {
  title: string;
  bullets: string[];
};

export type LaunchRecap = {
  heading: string;
  sections: LaunchRecapSection[];
  markdown: string;
};

export type LaunchTweet = {
  index: number;
  total: number;
  text: string;
  chars: number;
};

function pickTopItems(items: ChangeItem[], limit: number): ChangeItem[] {
  return items.slice(0, limit);
}

function normalizeBullet(text: string): string {
  return text.replace(/^[-•]\s*/, "").replace(/\.+$/g, "").trim();
}

function buildCustomerChangelog(items: ChangeItem[], themes: NarrativeTheme[]): string[] {
  const themed = themes.flatMap((theme) => theme.bullets.map(normalizeBullet));
  if (themed.length) return themed.slice(0, 6);

  return pickTopItems(items.filter((item) => item.audience.includes("customer")), 6).map(
    (item) => `${item.title} (${item.type})`,
  );
}

function buildInternalNotes(items: ChangeItem[], demoSteps: DemoStep[]): string[] {
  const internalItems = pickTopItems(items.filter((item) => item.audience.includes("internal")), 5);
  const itemNotes = internalItems.map((item) => `${item.title} [${item.type}]`);
  const stepCue = demoSteps[0]?.speakingNotes[0];

  if (stepCue) {
    return [...itemNotes, `Demo cue: ${normalizeBullet(stepCue)}`];
  }

  return itemNotes;
}

export function generateLaunchRecap(
  items: ChangeItem[],
  themes: NarrativeTheme[],
  demoSteps: DemoStep[],
  audience: AudienceTag,
): LaunchRecap {
  const customerBullets = buildCustomerChangelog(items, themes);
  const internalBullets = buildInternalNotes(items, demoSteps);

  const sections: LaunchRecapSection[] = [
    {
      title: "Customer changelog",
      bullets: customerBullets,
    },
    {
      title: "Internal notes",
      bullets: internalBullets,
    },
  ];

  const heading = `Launch recap · ${audience}`;

  const markdown = [
    `# ${heading}`,
    "",
    ...sections.flatMap((section) => [
      `## ${section.title}`,
      ...(section.bullets.length ? section.bullets.map((bullet) => `- ${bullet}`) : ["- No highlights yet."]),
      "",
    ]),
  ].join("\n");

  return {
    heading,
    sections,
    markdown,
  };
}

function withLimit(text: string, limit = 280): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function generateLaunchThread(recap: LaunchRecap): LaunchTweet[] {
  const contentTweets = recap.sections.flatMap((section) => {
    const firstTwo = section.bullets.slice(0, 2);
    if (!firstTwo.length) return [] as string[];

    return [`${section.title}: ${firstTwo.map(normalizeBullet).join(" · ")}`];
  });

  if (!contentTweets.length) return [];

  const tweetTexts = [
    "We shipped a focused release. Here is the launch recap 👇",
    ...contentTweets,
    "If you want the full notes and demo script, reply and we will share the breakdown.",
  ];

  const total = tweetTexts.length;
  return tweetTexts.map((text, index) => {
    const numbered = `${index + 1}/${total} ${text}`;
    const clipped = withLimit(numbered);
    return {
      index: index + 1,
      total,
      text: clipped,
      chars: clipped.length,
    };
  });
}
