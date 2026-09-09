import { GoogleGenAI, Modality } from '@google/genai';
import { db } from '../db/database.js';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (
    !apiKey ||
    apiKey === 'MY_GEMINI_API_KEY' ||
    apiKey.trim().length === 0
  ) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function pcmToWavDataUri(
  pcmBase64: string,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');

  const byteRate =
    (sampleRate * numChannels * bitsPerSample) / 8;

  const blockAlign =
    (numChannels * bitsPerSample) / 8;

  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);

  return `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
}

export interface GenerateSummaryOptions {
  movie: {
    id: number;
    title: string;
    overview: string;
    releaseYear: number;
    releaseDate?: string;
    voteAverage?: number;
    genres: { name: string }[];
    director?: string;
    cast?: { name: string; character: string }[];
    keywords?: string[];
    tagline?: string;
  };

  length: 'quick' | 'standard' | 'detailed';

  isSpoilerFree: boolean;

  forceRegenerate?: boolean;
}

export interface SummaryOutput {
  id: string;
  movieId: number;
  movieTitle: string;
  length: 'quick' | 'standard' | 'detailed';
  isSpoilerFree: boolean;
  content: string;
  keyThemes: string[];
  recommendedFor: string;
  cinematicTone: string;
  createdAt: string;
}

export class AIService {
  hasApiKey(): boolean {
    return Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
  }

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
     * AI summary caching has intentionally been disabled.
     *
     * Every request generates a completely new summary from Gemini.
     *
     * This means:
     * Quick      -> new Gemini generation
     * Standard   -> new Gemini generation
     * Detailed   -> new Gemini generation
     *
     * We no longer read an existing summary from the database.
     */

    const ai = getGeminiClient();

    const genreList = movie.genres
      .map((g) => g.name)
      .join(', ');

    const castList = (movie.cast || [])
      .slice(0, 6)
      .map((c) => `${c.name} as ${c.character}`)
      .join(', ');

    const keywordList = (movie.keywords || [])
      .slice(0, 10)
      .join(', ');

    /*
     * Gemini unavailable fallback.
     *
     * We intentionally DO NOT save this fallback into the
     * summaries table because summaries are not cached anymore.
     */

    if (!ai) {
      const fallbackThemes =
        movie.keywords && movie.keywords.length > 0
          ? movie.keywords.slice(0, 4)
          : [
              'Identity',
              'Courage',
              'Moral Conflict',
              'Discovery',
            ];

      let fallbackText = '';

      if (length === 'quick') {
        fallbackText = `
MAIN EVENTS SUMMARY

${movie.title} (${movie.releaseYear}) is a ${genreList} film directed by ${
          movie.director || 'its filmmakers'
        }.

The story begins with ${movie.overview}

The central conflict develops around the characters ${
          castList || 'at the heart of the story'
        }, creating the main dramatic tension that drives the movie forward.

The film explores themes such as ${fallbackThemes.join(
          ', '
        )}.
        `.trim();
      } else if (length === 'detailed') {
        fallbackText = `
DETAILED MOVIE EXPLANATION

1. SETUP & PREMISE

${movie.title} (${movie.releaseYear}) is a ${genreList} film directed by ${
          movie.director || 'its filmmakers'
        }.

The story begins with:

${movie.overview}


2. CHARACTERS & CONFLICT

The main cast includes ${
          castList || 'the principal characters'
        }.

Their circumstances establish the central conflict of the story and create the emotional foundation for the events that follow.


3. THEMES & STORY

The movie explores ideas connected to ${fallbackThemes.join(
          ', '
        )}.

As the story develops, these themes become increasingly important to the characters and their decisions.


4. OVERALL EXPERIENCE

The film combines its ${genreList} elements with its character-driven story to create an experience intended for viewers interested in ${
          genreList || 'cinematic storytelling'
        }.

${isSpoilerFree
  ? 'This explanation intentionally avoids revealing major twists and the final outcome.'
  : 'For a full spoiler explanation, the complete plot and ending should be discussed using detailed movie information.'}
        `.trim();
      } else {
        fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${genreList} film directed by ${
          movie.director || 'its filmmakers'
        }.

${movie.overview}

The main cast includes ${
          castList || 'the principal characters'
        }, whose roles help establish the film's central conflict and emotional direction.

The movie explores themes of ${fallbackThemes.join(
          ', '
        )} while combining its story, characters and cinematic tone into its overall experience.

${
  isSpoilerFree
    ? 'This explanation keeps the major ending and late-story twists hidden.'
    : 'This version is intended to discuss the complete narrative, including major developments and the ending.'
}
        `.trim();
      }

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        movieId: movie.id,

        movieTitle: movie.title,

        length,

        isSpoilerFree,

        content: fallbackText,

        keyThemes: fallbackThemes,

        recommendedFor: `Fans of thoughtful ${genreList} films seeking detailed cinematic storytelling.`,

        cinematicTone:
          'Immersive & Thought-Provoking',

        createdAt: new Date().toISOString(),
      };
    }

    /*
     * Gemini prompt
     */

   const prompt = `
You are an expert movie critic, film analyst, and storyteller.

Your job is to create a useful, movie-specific analysis of the following film.

MOVIE INFORMATION:
Title: ${movie.title}
Overview: ${movie.overview}
Release Date: ${movie.releaseDate || 'Unknown'}
Genres: ${movie.genres?.join(', ') || 'Unknown'}
Rating: ${movie.voteAverage ?? 'Unknown'}

REQUESTED LEVEL: ${length}
SPOILER-FREE: ${isSpoilerFree}

IMPORTANT KNOWLEDGE RULE:
Use the movie information provided above, but ALSO use your own existing knowledge
about this movie when you are confident about it.

Do NOT restrict yourself to simply rewriting the TMDB overview.

However, NEVER invent characters, events, scenes, quotes, actors, relationships,
or other movie facts. If you are uncertain about a specific detail, leave it out.

==================================================
QUICK SUMMARY
==================================================

If the requested level is "quick":

Give a short but useful introduction to the movie.

Focus on:
- What the movie is about
- The central premise or conflict
- The main character or characters
- What makes the movie interesting
- The overall type of experience the viewer can expect

Do NOT try to perform a deep film analysis.

The purpose is:
"Give me a quick understanding of this movie."

==================================================
STANDARD SUMMARY
==================================================

If the requested level is "standard":

Give a proper movie review and analysis.

Cover:
- The story and central conflict
- Important characters and their motivations
- Character development
- Major themes and ideas
- What the movie does particularly well
- Weaknesses or limitations, if relevant
- Emotional impact
- Overall viewing experience
- What makes the movie stand out

Do not simply repeat the Quick summary with more words.

The purpose is:
"Help me understand the movie and decide whether it is worth watching."

==================================================
DETAILED SUMMARY
==================================================

If the requested level is "detailed":

Perform a deep film analysis.

Go beyond explaining what happens.

Analyze:
- Story structure and progression
- Character development and motivations
- Relationships between important characters
- Central conflicts
- Major themes
- Deeper ideas and messages
- Symbolism and recurring concepts when applicable
- Emotional and psychological aspects
- Direction and filmmaking choices
- Cinematography and visual style when relevant
- Music and sound when relevant
- Pacing and atmosphere
- Strengths of the screenplay
- Weaknesses or limitations
- Why certain scenes or moments are effective
- What makes this movie unique
- The deeper meaning or interpretation of the movie
- Why the movie has an emotional, cultural, or lasting impact when applicable

The Detailed version MUST contain insights that would not normally appear
in the Quick or Standard version.

Do NOT simply take the Standard summary and make it longer.

The purpose is:
"Give me the kind of analysis I would get from a knowledgeable film critic."

==================================================
SPOILER RULE
==================================================

${isSpoilerFree
  ? `
This is a SPOILER-FREE analysis.

Do NOT reveal:
- Major plot twists
- The ending
- Major deaths
- Hidden identities
- Important reveals
- Major surprises
- Any other information that would significantly reduce the viewing experience

You may discuss themes, characters, filmmaking, and the general premise
without revealing important story developments.
`
  : `
Spoilers are allowed.

You may discuss:
- Major plot developments
- Important twists
- Character outcomes
- The ending
- Important reveals

Use spoilers when they help explain the movie's meaning or quality.
`
}

==================================================
QUALITY REQUIREMENTS
==================================================

1. Make the analysis SPECIFIC to this movie.

2. Do not write generic statements such as:
   "This movie has great acting and an interesting story"
   unless you explain specifically WHY.

3. Do not repeat the same ideas unnecessarily.

4. Do not use filler just to increase the word count.

5. Each requested level must provide DIFFERENT INFORMATION and DEPTH.

6. The Detailed version should introduce deeper observations,
   not merely additional sentences.

7. Write naturally, like an intelligent human film critic.

8. Use your own movie knowledge when reliable.

9. Never fabricate movie facts.

10. If the supplied information and your knowledge do not provide
    enough confidence for a specific claim, do not make that claim.

11. Make the result enjoyable and easy to read.

12. Do not mention that you are an AI.

13. Do not mention TMDB or this prompt.

14. Do not say things like "based on the information provided."

==================================================
LENGTH GUIDELINE
==================================================

Quick:
Approximately 100-150 words.

Standard:
Approximately 250-350 words.

Detailed:
Approximately 500-700 words.

These are guidelines, NOT strict limits.

Quality and useful information are more important than hitting an exact
word count.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "title": "Movie title",
  "summary": "The complete analysis",
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

          temperature: 0.9,
        },
      });

      const responseText = response.text || '';

      let parsed: any;

      try {
        parsed = JSON.parse(responseText.trim());
      } catch {
        parsed = {
          content: responseText,

          keyThemes: [
            'Cinematic Storytelling',
            'Character Development',
            'Human Conflict',
          ],

          recommendedFor: `Fans of ${genreList || 'cinematic'} storytelling.`,

          cinematicTone:
            'Compelling & Atmospheric',
        };
      }

      /*
       * IMPORTANT:
       *
       * We DO NOT call db.saveSummary().
       *
       * This prevents the newly generated summary from becoming
       * a cached summary.
       */

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        movieId: movie.id,

        movieTitle: movie.title,

        length,

        isSpoilerFree,

        content:
          parsed.content ||
          responseText ||
          'Unable to generate movie summary.',

        keyThemes:
          Array.isArray(parsed.keyThemes)
            ? parsed.keyThemes
            : [
                'Cinematic Storytelling',
                'Character Development',
                'Human Conflict',
              ],

        recommendedFor:
          parsed.recommendedFor ||
          `Fans of ${genreList || 'cinematic'} stories.`,

        cinematicTone:
          parsed.cinematicTone ||
          'Cinematic & Immersive',

        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(
        'Gemini generateMovieSummary error:',
        err
      );

      /*
       * If Gemini fails, return a fallback result.
       * DO NOT save it to the database.
       */

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,

        movieId: movie.id,

        movieTitle: movie.title,

        length,

        isSpoilerFree,

        content: `
${movie.title} (${movie.releaseYear}) is a ${genreList || 'cinematic'} film directed by ${
          movie.director || 'its filmmakers'
        }.

${movie.overview}

The movie's story is centered around ${
          castList || 'its main characters'
        } and explores themes connected to ${
          keywordList || 'its central conflict and characters'
        }.

${
  isSpoilerFree
    ? 'This explanation avoids major twists and the final outcome.'
    : 'This version is intended to provide a complete explanation of the story.'
}
        `.trim(),

        keyThemes: [
          'Storytelling',
          'Character Development',
          'Cinema',
        ],

        recommendedFor:
          `Viewers interested in ${genreList || 'cinematic'} storytelling.`,

        cinematicTone:
          'Engaging & Dramatic',

        createdAt: new Date().toISOString(),
      };
    }
  }

  async generateAudioSummary(options: {
    summaryId: string;
    movieId: number;
    movieTitle: string;
    summaryText: string;
    voiceName?: string;
    forceRegenerate?: boolean;
  }): Promise<{
    id: string;
    summaryId: string;
    movieId: number;
    movieTitle: string;
    voiceName: string;
    audioUrl: string;
    durationSeconds: number;
    summaryText: string;
    createdAt: string;
  }> {
    const {
      summaryId,
      movieId,
      movieTitle,
      summaryText,
      voiceName = 'Kore',
      forceRegenerate = false,
    } = options;

    /*
     * Audio caching remains enabled.
     *
     * Only movie AI summaries are generated every time.
     */

    if (!forceRegenerate) {
      const cached = await db.getAudioSummary(
        summaryId,
        voiceName
      );

      if (cached) {
        return {
          ...cached,
          audioUrl: cached.audioBase64,
        };
      }
    }

    const ai = getGeminiClient();

    const wordCount =
      summaryText.split(/\s+/).length;

    const estimatedDuration = Math.max(
      10,
      Math.round(wordCount / 2.3)
    );

    if (ai) {
      try {
        const cleanScript = summaryText
          .replace(/[\n\r]+/g, ' ')
          .replace(/[#*_-]/g, '')
          .slice(0, 1200);

        const ttsPrompt = `Speak in a warm, cinematic, engaging documentary narrator tone: ${cleanScript}`;

        const response =
          await ai.models.generateContent({
            model: 'gemini-2.0-flash',

            contents: [
              {
                parts: [
                  {
                    text: ttsPrompt,
                  },
                ],
              },
            ],

            config: {
              responseModalities: [Modality.AUDIO],

              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: (
                      [
                        'Puck',
                        'Charon',
                        'Kore',
                        'Fenrir',
                        'Zephyr',
                      ].includes(voiceName)
                        ? voiceName
                        : 'Kore'
                    ) as any,
                  },
                },
              },
            },
          });

        const pcmBase64 =
          response.candidates?.[0]?.content?.parts?.[0]
            ?.inlineData?.data;

        if (pcmBase64) {
          const wavDataUri = pcmToWavDataUri(
            pcmBase64,
            24000,
            1,
            16
          );

          const saved =
            await db.saveAudioSummary({
              summaryId,
              movieId,
              movieTitle,
              voiceName,
              audioBase64: wavDataUri,
              durationSeconds: estimatedDuration,
              summaryText,
            });

          return {
            ...saved,
            audioUrl: saved.audioBase64,
          };
        }
      } catch (err) {
        console.warn(
          'Gemini TTS model call error, falling back to browser synthesis:',
          err
        );
      }
    }

    const saved =
      await db.saveAudioSummary({
        summaryId,
        movieId,
        movieTitle,
        voiceName,
        audioBase64: 'tts_browser_synth',
        durationSeconds: estimatedDuration,
        summaryText,
      });

    return {
      ...saved,
      audioUrl: 'tts_browser_synth',
    };
  }
}

export const aiService = new AIService();
