# Plan

## Summary
Changelog to Demo turns raw release notes or commit history into a polished demo script, launch recap, and social copy. The MVP works on pasted text and a compare URL summary, grouping changes into audiences and producing editable outputs.

## Target user
- Product engineers and tech leads who need to present releases
- Developer advocates who create launch content
- Recruiter-facing portfolio demos that show product sense

## Portfolio positioning
Demonstrates storytelling from engineering output, thoughtful UX for content transformation, and AI-assisted but controllable outputs. Shows the ability to ship a polished, demo-ready tool quickly.

## MVP scope
- Inputs: paste release notes, merged PR titles, or a compare summary URL
- Processing: parse into change items and group by theme/audience
- Outputs: demo flow with speaking notes, customer changelog, launch recap, and social thread draft
- Editing: inline editable sections with copy/export buttons
- Sample dataset: seeded fake release to showcase without external APIs

## Non-goals
- Full Git provider integrations or live repo sync
- Multi-user auth or persistence beyond local storage/sample data
- Automated video/slide generation

## Technical approach
- Next.js + TypeScript + Tailwind for fast scaffolding and deployability
- Simple parser to split release notes/PR titles into structured change items
- Prompted transformations via OpenAI-compatible API with deterministic fallbacks for the sample data
- Audience-specific pipelines (customer, internal, recruiter demo) with reusable templates
- Client-side editable state; optional local storage for drafts

## Execution notes
- Keep the sample release narrative compelling and realistic
- Prioritize clarity of the grouping and demo flow over model cleverness
- Provide copy/export affordances to make it feel like a real tool
