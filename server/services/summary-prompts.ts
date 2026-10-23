import { SummaryLength } from './summary-request.js';

export function buildSummaryPrompt(
  movieInfo: string,
  length: SummaryLength,
  isSpoilerFree: boolean
): string {
  const spoilerInstructions = isSpoilerFree
    ? `This is SPOILER-FREE. Do not disclose major twists, hidden identities, significant deaths, final outcomes, or the ending. Focus on the premise, setup, characters, and central conflict.`
    : `SPOILERS ARE ENABLED. Discuss meaningful plot developments, revelations, character outcomes, and the ending when they are relevant and known.`;

  const modeInstructions = {
    quick: `Write a concise premise-focused summary of about 100–150 words. Explain the premise, main character, and central conflict. Avoid extensive plot progression, thematic analysis, and cinematic critique.`,
    standard: `Write a moderately detailed summary of about 250–400 words. Cover the story progression, important characters and their motivations, the central conflict, and relevant themes. Do not turn this into a scene-by-scene plot recap.`,
    detailed: `Write a substantially comprehensive analysis of about 500–800 words. Cover story progression, character development and motivations, internal and external conflicts, relevant themes, emotional impact, and cinematic elements supported by reliable information.`,
    storyline: `Write a distinct, chronological plot explanation of about 500–800 words. Explain how the story develops from its setup through successive major developments toward its resolution. Keep the events in narrative order and focus on what happens and why; do not substitute a thematic review or reuse a general summary. Respect the spoiler policy below. If spoiler-free, stop before revealing protected turns or the ending. If reliable plot details are unavailable, say so rather than inventing events.`,
  }[length];

  return `You are a careful movie analyst. Use the movie information and reliable knowledge of this specific film only. Never invent plot events, character relationships, identities, deaths, motivations, or endings. If the available information does not support a detail, omit it or state that it is not clear.

Requested mode: ${length}
${modeInstructions}

Spoiler policy: ${spoilerInstructions}

Movie information:
${movieInfo}

Return only valid JSON with exactly this structure:
{
  "title": "Movie title",
  "summary": "The requested movie explanation",
  "keyPoints": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"]
}`;
}
