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

    const prompt = `You are MovieMind AI, an expert film critic, cinematic storyteller, and movie analyst.

Your task is to create a UNIQUE, INFORMATIVE and SPECIFIC explanation of the movie.

The user wants a real explanation of THIS movie, not a generic movie description.

IMPORTANT RULES:

1. Do NOT simply copy or lightly rewrite the TMDB overview.

2. Use the supplied movie information as your factual source.

3. Write the explanation in your own words.

4. Make the content specific to the actual movie.

5. Avoid generic filler such as:
   "The movie takes viewers on an unforgettable journey."
   "This thrilling film keeps audiences engaged."
   "The story explores many themes."

   Only write statements that provide actual information.

6. Do NOT invent:
   - Characters
   - Events
   - Relationships
   - Locations
   - Plot twists
   - Deaths
   - Dialogues
   - Quotes
   - Scenes
   - Story details

7. Use the available:
   - Movie overview
   - Genres
   - Cast
   - Characters
   - Director
   - Keywords
   - Tagline
   - Release information
   - Rating

8. The response should feel like an intelligent human movie reviewer explaining the film to someone who has not watched it.

9. Every paragraph must add useful information.

10. Do not mention TMDB.

11. Do not mention that you are an AI.

12. Do not invent fake quotes.

13. Do not give your own numerical rating.

MOVIE INFORMATION

Title:
${movie.title}

Release Year:
${movie.releaseYear}

Release Date:
${movie.releaseDate || 'Unknown'}

Rating:
${movie.voteAverage ? `${movie.voteAverage}/10` : 'N/A'}

Tagline:
${movie.tagline || 'N/A'}

Genres:
${genreList || 'Unknown'}

Director:
${movie.director || 'Unknown'}

Main Cast:
${castList || 'Unknown'}

Keywords:
${keywordList || 'None available'}

Movie Overview:
${movie.overview}


SUMMARY LENGTH

${
  length === 'quick'
    ? `
QUICK SUMMARY

Write approximately 80-120 words.

Explain:

- What the movie is about
- The central character or situation
- The main conflict
- The important setup
- What makes this movie interesting

Keep it concise, but make every sentence informative.
`
    : length === 'standard'
    ? `
STANDARD SUMMARY

Write approximately 200-300 words.

Give a meaningful explanation of the movie.

Cover:

1. The premise and setting
2. The main characters and their roles
3. The central conflict
4. How the story begins and develops
5. Important character motivations
6. Major themes
7. What makes the movie distinctive
8. Why the story is interesting

Use 3-5 natural paragraphs.

Do not repeat the same information simply to increase word count.
`
    : `
DETAILED MOVIE EXPLANATION

Write approximately 450-650 words.

This should be substantially more detailed than the Standard version.

Explain the movie in depth.

Cover:

1. PREMISE & SETTING
Explain where the story begins and what situation the characters are facing.

2. MAIN CHARACTERS
Explain the important characters, their roles, motivations and relationships when supported by the supplied information.

3. CENTRAL CONFLICT
Explain the main problem or challenge driving the story.

4. STORY DEVELOPMENT
Explain how the narrative progresses and how the situation changes.

5. CHARACTER DEVELOPMENT
Explain how the characters change, grow, struggle or make important decisions.

6. IMPORTANT STORY DEVELOPMENTS
Discuss meaningful developments that are supported by the available movie information.

7. THEMES
Explain the important ideas and themes present in the movie.

8. CINEMATIC EXPERIENCE
Explain the emotional atmosphere, genre experience and overall tone.

9. DISTINCTIVE ELEMENTS
Explain what makes this movie different or memorable.

10. WHY WATCH IT
Explain what type of viewer would probably enjoy it.

Use multiple well-structured paragraphs and clear sections where useful.

Do NOT pad the response.

The detailed version must contain substantially more useful information than the Standard version.
`
}


SPOILER POLICY

${
  isSpoilerFree
    ? `
SPOILER-FREE MODE

Do NOT reveal:

- Major plot twists
- Secret identities
- Major character deaths
- The final outcome
- The ending
- Major surprise reveals

You MAY discuss:

- The premise
- Characters
- Motivations
- Central conflict
- Themes
- Atmosphere
- Early story development
- General narrative direction

Stop before revealing information that would significantly spoil the viewing experience.
`
    : `
FULL SPOILER MODE

The user wants the complete story.

Explain:

- Major plot developments
- Important turning points
- Character decisions
- Major twists
- The climax
- The ending
- Final resolution
- How the character arcs conclude

Give a complete narrative explanation rather than stopping at the premise.
`
}


WRITING STYLE

Write like an experienced movie critic explaining the movie clearly.

Use:

- Specific details
- Clear explanations
- Natural language
- Strong storytelling
- Useful analysis
- Character-focused explanation

Avoid:

- Generic filler
- Repetition
- Fake quotes
- Marketing language
- Excessive adjectives
- Empty statements

Most importantly:

MAKE THIS SUMMARY DIFFERENT FROM A BASIC DATABASE DESCRIPTION.

The reader should finish the summary with a much better understanding of the movie.


KEY THEMES

Select 3-5 meaningful themes that are genuinely supported by the movie information.


RECOMMENDED FOR

Write one useful sentence describing the type of viewer who would probably enjoy this movie.


CINEMATIC TONE

Give 2-4 descriptive words describing the movie's emotional and visual tone.


OUTPUT

Return ONLY valid JSON.

Use exactly this structure:

{
  "content": "Complete movie explanation here.",
  "keyThemes": [
    "Theme 1",
    "Theme 2",
    "Theme 3"
  ],
  "recommendedFor": "One sentence describing the ideal viewer.",
  "cinematicTone": "Atmospheric & Emotional"
}`;

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
