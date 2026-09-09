import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database.js';
import { TMDBMovie } from './tmdb.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    geminiClient = new GoogleGenAI({
      apiKey,
    });
  }

  return geminiClient;
}

export interface GenerateSummaryOptions {
  movie: TMDBMovie;
  length: 'quick' | 'standard' | 'detailed';
  isSpoilerFree: boolean;
  forceRegenerate?: boolean;
}

export interface SummaryOutput {
  id: string;
  movieId: number;
  length: 'quick' | 'standard' | 'detailed';
  isSpoilerFree: boolean;
  summary: string;
  keyPoints: string[];
  createdAt: string;
}

export interface GenerateAudioOptions {
  summaryId: string;
  movieId: number;
  movieTitle: string;
  summaryText: string;
  voiceName?: string;
  forceRegenerate?: boolean;
}

export interface AudioOutput {
  id: string;
  summaryId: string;
  movieId: number;
  movieTitle: string;
  audioBase64: string;
  mimeType: string;
  voiceName: string;
  createdAt: string;
}

export const aiService = {

  // ============================================================
  // MOVIE SUMMARY
  // ============================================================

  async generateMovieSummary(
    options: GenerateSummaryOptions
  ): Promise<SummaryOutput> {

    const {
      movie,
      length,
      isSpoilerFree,
    } = options;

    /*
     * IMPORTANT:
     * We intentionally DO NOT check the database cache here.
     *
     * Every request creates a completely new Gemini generation.
     */

    const ai = getGeminiClient();

    // Unique value for EVERY generation.
    const generationId =
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const prompt = `
You are an expert movie critic, film analyst, and storyteller.

Generate a completely NEW movie summary for this request.

==================================================
NEW GENERATION
==================================================

Generation ID: ${generationId}

This is a fresh generation.

Do NOT reproduce, copy, or closely imitate a previous response.

Even if the same movie and same options are requested again,
create a fresh response with different wording, observations,
sentence structure, and emphasis.

Do not intentionally repeat a previous summary.

==================================================
MOVIE
==================================================

Title: ${movie.title}

Overview:
${movie.overview}

Release Date:
${movie.releaseDate || 'Unknown'}

Genres:
${movie.genres?.join(', ') || 'Unknown'}

Rating:
${movie.voteAverage ?? 'Unknown'}

==================================================
REQUEST
==================================================

Summary Length:
${length}

Spoiler-Free:
${isSpoilerFree}

==================================================
USE YOUR OWN KNOWLEDGE
==================================================

Use the information provided above as a starting point.

You may ALSO use your own existing knowledge about this movie
when you are confident that the information is correct.

Do not limit the answer to simply rewriting the supplied overview.

However, NEVER invent movie facts.

Do not fabricate:
- Characters
- Plot events
- Actors
- Relationships
- Quotes
- Scenes
- Twists
- Locations
- Production facts

If you are uncertain about a specific fact, do not include it.

==================================================
QUICK
==================================================

If the requested length is "quick":

Give a concise and useful explanation of the movie.

Focus mainly on:

- What the movie is about
- The central premise
- The main conflict
- The important character or characters
- What makes the movie interesting
- The overall viewing experience

Keep it short and easy to understand.

Do not turn this into a deep film analysis.

==================================================
STANDARD
==================================================

If the requested length is "standard":

Give a proper movie review.

Discuss:

- Story and central conflict
- Main characters
- Character motivations
- Character development
- Important themes
- Emotional impact
- Strengths
- Weaknesses when appropriate
- Overall experience
- What makes the movie worth watching

Give useful analysis rather than simply retelling the plot.

==================================================
DETAILED
==================================================

If the requested length is "detailed":

Give a deep film analysis.

Go beyond simply explaining the story.

Analyze when relevant:

- Story structure
- Character development
- Character motivations
- Relationships
- Themes
- Symbolism
- Deeper meanings
- Psychological aspects
- Emotional impact
- Direction
- Cinematography
- Visual style
- Music and sound
- Atmosphere
- Pacing
- Screenplay
- Strengths
- Weaknesses
- Memorable aspects
- What makes the movie unique
- Why the movie works or does not work
- Deeper interpretation

The detailed version should feel like an analysis
from a knowledgeable film critic.

Do not simply make the Standard version longer.

==================================================
FRESHNESS REQUIREMENT
==================================================

Every generation must be independently written.

If this movie has already been summarized before:

DO NOT:
- Copy the previous explanation
- Reuse the same opening
- Reuse the same paragraph structure
- Repeat the same observations unnecessarily
- Simply change a few words

DO:
- Start from a fresh perspective
- Use different wording
- Highlight different aspects of the movie
- Choose different supporting observations
- Explain ideas in a new way
- Produce a genuinely new response

The response should feel like a new critic watching
and discussing the same movie from a slightly different perspective.

==================================================
SPOILER RULE
==================================================

${
  isSpoilerFree
    ? `
This is a SPOILER-FREE summary.

Do NOT reveal:

- Major plot twists
- The ending
- Major deaths
- Hidden identities
- Major reveals
- Important surprises
- Any information that would significantly damage
  the first-time viewing experience.

You can discuss the premise, characters, themes,
filmmaking, and general emotional impact without
revealing important plot developments.
`
    : `
Spoilers are allowed.

You may discuss:

- Major plot developments
- Important twists
- Character outcomes
- The ending
- Important reveals

Use spoilers when they help explain the movie.
`
}

==================================================
WRITING RULES
==================================================

- Write naturally.
- Be specific to this movie.
- Avoid generic filler.
- Do not repeatedly say the movie is "interesting",
  "captivating", or "a masterpiece" without explaining why.
- Do not repeat the same idea multiple times.
- Do not invent facts.
- Do not mention that you are an AI.
- Do not mention this prompt.
- Do not mention TMDB.
- Do not say "based on the information provided".
- Make the summary useful to someone deciding whether to watch the movie.

==================================================
APPROXIMATE LENGTH
==================================================

Quick:
100-150 words

Standard:
250-350 words

Detailed:
500-700 words

These are approximate guidelines.

Quality is more important than exact word count.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly this format:

{
  "title": "Movie title",
  "summary": "Complete movie analysis",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;

    try {

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',

        contents: prompt,

        config: {
          responseMimeType: 'application/json',

          // Higher temperature = more variation between generations.
          temperature: 1.0,
        },
      });

      const text = response.text || '';

      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      const parsed = JSON.parse(text);

      const summary: SummaryOutput = {
        id: `sum_${movie.id}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`,

        movieId: movie.id,

        length,

        isSpoilerFree,

        summary: parsed.summary || '',

        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints
          : [],

        createdAt: new Date().toISOString(),
      };

      /*
       * IMPORTANT:
       * We intentionally DO NOT save the generated summary
       * into the database.
       *
       * This prevents old summaries from being reused.
       */

      return summary;

    } catch (error) {

      console.error('Gemini summary generation failed:', error);

      // Fallback summary
      return {
        id: `sum_${movie.id}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`,

        movieId: movie.id,

        length,

        isSpoilerFree,

        summary: movie.overview ||
          'No summary is available for this movie.',

        keyPoints: [
          `Genre: ${movie.genres?.join(', ') || 'Unknown'}`,
          `Release date: ${movie.releaseDate || 'Unknown'}`,
          `Rating: ${movie.voteAverage ?? 'Unknown'}`,
        ],

        createdAt: new Date().toISOString(),
      };
    }
  },


  // ============================================================
  // AUDIO SUMMARY
  // ============================================================

  async generateAudioSummary(
    options: GenerateAudioOptions
  ): Promise<AudioOutput> {

    const {
      summaryId,
      movieId,
      movieTitle,
      summaryText,
      voiceName = 'Kore',
      forceRegenerate = false,
    } = options;

    /*
     * Audio caching is kept as it was.
     * Only movie-summary generation is always fresh.
     */

    if (!forceRegenerate) {

      const cached = await db.getAudioSummary(
        summaryId,
        voiceName
      );

      if (cached) {
        return cached;
      }
    }

    const ai = getGeminiClient();

    try {

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',

        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `
Read the following movie summary naturally,
like a professional narrator.

Movie:
${movieTitle}

Summary:
${summaryText}
`,
              },
            ],
          },
        ],

        config: {
          responseModalities: ['AUDIO'],

          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      });

      const audioPart =
        response.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData
        );

      if (!audioPart?.inlineData?.data) {
        throw new Error('Gemini did not return audio data');
      }

      const audio: AudioOutput = {
        id: `audio_${movieId}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`,

        summaryId,

        movieId,

        movieTitle,

        audioBase64: audioPart.inlineData.data,

        mimeType:
          audioPart.inlineData.mimeType || 'audio/wav',

        voiceName,

        createdAt: new Date().toISOString(),
      };

      await db.saveAudioSummary(audio);

      return audio;

    } catch (error) {

      console.error('Gemini audio generation failed:', error);

      throw new Error(
        'Failed to generate audio summary. Please try again.'
      );
    }
  },
};
