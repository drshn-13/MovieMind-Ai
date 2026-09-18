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

  const wavBuffer = Buffer.concat([
    header,
    pcmBuffer,
  ]);

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

    genres: {
      name: string;
    }[];

    director?: string;

    cast?: {
      name: string;
      character: string;
    }[];

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
     * ============================================================
     * FRESH SUMMARY GENERATION
     * ============================================================
     *
     * Movie summaries are intentionally NOT cached.
     *
     * Every request generates a new Gemini response.
     *
     * Math.random() is used to create:
     *
     * 1. A unique generation seed
     * 2. A random analytical perspective
     * 3. A random structural approach
     *
     * This makes repeated generations of the same movie different.
     */

    const randomSeed = Math.floor(
      Math.random() * 1000000000
    );

    const randomPerspectiveNumber =
      Math.floor(Math.random() * 15);

    const randomStructureNumber =
      Math.floor(Math.random() * 8);

    const analysisPerspectives = [
      `
Focus strongly on the main characters, their psychology,
motivations, fears, desires, decisions, and character development.
`,

      `
Focus strongly on the story structure, central conflict,
story progression, turning points, escalation, and narrative design.
`,

      `
Focus strongly on the movie's themes, deeper ideas,
messages, symbolism, philosophy, and interpretation.
`,

      `
Focus strongly on relationships between important characters,
including emotional dynamics, trust, loyalty, conflict, and change.
`,

      `
Focus strongly on filmmaking: direction, cinematography,
visual language, editing, sound, music, production design,
atmosphere, and how these elements support the story.
`,

      `
Focus strongly on the screenplay, dialogue, pacing,
storytelling choices, dramatic construction, and character writing.
`,

      `
Focus strongly on the emotional and psychological experience
of watching the movie and explain why it affects the audience.
`,

      `
Focus strongly on what makes this movie distinctive compared
with other movies in the same genre and explain why it stands out.
`,

      `
Focus strongly on the strongest and weakest aspects of the movie.
Explain specifically why particular creative choices work or fail.
`,

      `
Take the perspective of a professional film critic.
Balance story, characters, themes, filmmaking, emotional impact,
strengths, weaknesses, and artistic significance.
`,

      `
Focus on deeper observations that a casual viewer might miss,
including recurring ideas, visual motifs, character parallels,
subtext, symbolism, and narrative details.
`,

      `
Focus on the movie's cultural, historical, social, or genre
significance when such connections are genuinely relevant.
`,

      `
Focus on the movie's atmosphere and cinematic identity:
tone, mood, tension, visual style, sound, pacing,
and emotional rhythm.
`,

      `
Focus strongly on character arcs and how the central conflicts
transform, challenge, or expose the characters.
`,

      `
Focus strongly on the movie's deeper meaning and interpretation.
Explain what the filmmakers communicate through the story,
characters, conflicts, themes, and filmmaking choices.
`,
    ];

    const randomPerspective =
      analysisPerspectives[randomPerspectiveNumber];

    const structureInstructions = [
      `
Build the analysis naturally from premise to characters,
then conflict, themes, filmmaking, and overall impact.
`,

      `
Begin with what makes the movie distinctive, then explain
how its story, characters, and filmmaking create that identity.
`,

      `
Begin with the central character or conflict and gradually
expand into themes, filmmaking, and deeper meaning.
`,

      `
Prioritize the emotional journey first, then explain the
story mechanics and filmmaking choices behind that experience.
`,

      `
Approach the movie as a critical review: discuss what works,
what does not, and why those choices matter.
`,

      `
Move from the surface-level story into increasingly deeper
interpretation and meaning.
`,

      `
Compare the movie's different elements internally:
story vs characters, themes vs filmmaking, strengths vs weaknesses.
`,

      `
Use the most natural structure for this specific movie.
Do not follow a fixed template if another structure produces
a more insightful analysis.
`,
    ];

    const randomStructure =
      structureInstructions[randomStructureNumber];

    /*
     * ============================================================
     * MOVIE INFORMATION
     * ============================================================
     */

    const genreList =
      movie.genres && movie.genres.length > 0
        ? movie.genres
            .map((g) => g.name)
            .join(', ')
        : 'Unknown';

    const castList =
      movie.cast && movie.cast.length > 0
        ? movie.cast
            .slice(0, 10)
            .map(
              (c) =>
                `${c.name} as ${c.character}`
            )
            .join(', ')
        : 'Unknown';

    const keywordList =
      movie.keywords && movie.keywords.length > 0
        ? movie.keywords
            .slice(0, 15)
            .join(', ')
        : 'Unknown';

    /*
     * ============================================================
     * GEMINI UNAVAILABLE FALLBACK
     * ============================================================
     */

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackThemes =
        movie.keywords &&
        movie.keywords.length > 0
          ? movie.keywords.slice(0, 5)
          : [
              'Identity',
              'Courage',
              'Moral Conflict',
              'Discovery',
              'Human Relationships',
            ];

      let fallbackText = '';

      if (length === 'quick') {
        fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${
          genreList || 'cinematic'
        } film directed by ${
          movie.director || 'its filmmakers'
        }.

${movie.overview}

The story centers around ${
          castList || 'its principal characters'
        } and develops its central conflict through their goals, decisions, and circumstances.

The movie explores ideas connected to ${
          fallbackThemes.join(', ')
        } and offers a viewing experience shaped by its story, characters, and overall cinematic style.

${
  isSpoilerFree
    ? 'This explanation avoids major twists, reveals, and the ending.'
    : 'This version is intended to discuss the complete narrative.'
}
        `.trim();
      } else if (length === 'detailed') {
        fallbackText = `
DETAILED MOVIE ANALYSIS

${movie.title} (${movie.releaseYear}) is a ${
          genreList || 'cinematic'
        } film directed by ${
          movie.director || 'its filmmakers'
        }.

PREMISE AND STORY

${movie.overview}

The central story develops through ${
          castList || 'the principal characters'
        }, whose circumstances establish the movie's main dramatic and emotional conflicts.

CHARACTERS

The characters provide the foundation for the movie's emotional experience. Their goals, choices, relationships, and reactions to the central conflict shape how the story develops.

THEMES

The movie connects with themes such as ${
          fallbackThemes.join(', ')
        }. These ideas help define the meaning and emotional direction of the story.

CINEMATIC EXPERIENCE

The combination of its ${genreList || 'genre'} elements, characters, story, atmosphere, and filmmaking creates the movie's distinctive identity.

${
  isSpoilerFree
    ? 'This analysis intentionally avoids major twists, deaths, reveals, and the ending.'
    : 'This version allows discussion of major narrative developments and the ending.'
}
        `.trim();
      } else {
        fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${
          genreList || 'cinematic'
        } film directed by ${
          movie.director || 'its filmmakers'
        }.

${movie.overview}

The main characters include ${
          castList || 'the principal characters'
        }. Their circumstances establish the movie's central conflict and emotional direction.

The film explores themes including ${
          fallbackThemes.join(', ')
        } while combining its story, characters, atmosphere, and cinematic style into its overall experience.

${
  isSpoilerFree
    ? 'This explanation keeps major twists and the ending hidden.'
    : 'This version can discuss major developments and the ending.'
}
        `.trim();
      }

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,

        movieId: movie.id,

        movieTitle: movie.title,

        length,

        isSpoilerFree,

        content: fallbackText,

        keyThemes: fallbackThemes,

        recommendedFor:
          `Fans of ${genreList || 'cinematic'} films looking for a deeper understanding of the story and themes.`,

        cinematicTone:
          'Immersive & Thought-Provoking',

        createdAt:
          new Date().toISOString(),
      };
    }

    /*
     * ============================================================
     * GEMINI PROMPT GENERATORS
     * ============================================================
     */

    const movieInfoStr = `
TITLE:
${movie.title}

OVERVIEW:
${movie.overview}

RELEASE DATE:
${movie.releaseDate || 'Unknown'}

RELEASE YEAR:
${movie.releaseYear || 'Unknown'}

GENRES:
${genreList}

RATING:
${movie.voteAverage ?? 'Unknown'}

DIRECTOR:
${movie.director || 'Unknown'}

CAST:
${castList}

KEYWORDS:
${keywordList}

TAGLINE:
${movie.tagline || 'Unknown'}
`;

    const randomDataStr = `
GENERATION SEED:
${randomSeed}

RANDOM ANALYTICAL PERSPECTIVE:
${randomPerspective}

RANDOM STRUCTURE:
${randomStructure}
`;

    const getQuickSummaryPrompt = (movieInfo: string, isSpoilerFree: boolean, randomData: string): string => {
      return `
You are an expert movie critic and storyteller.
Your task is to create a QUICK movie overview.

Help the user understand what this movie is about very quickly.

Explain what the movie is about in a concise but meaningful way.
Focus on the basic movie premise, main story setup, main character, main conflict, what makes the movie interesting, and the overall type/genre.
Give the user enough information to decide whether they want to learn more about the movie.

Do not provide deep thematic analysis.
Do not provide an extensive character analysis.
Do not provide a full plot breakdown.

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Do not write generic movie-review sentences.
3. Target approximately 100–150 words.
4. The response should feel like a useful explanation of the movie, NOT a generic 2–3 sentence description.
5. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "Quick explanation of what the movie is about.",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };

    const getStandardSummaryPrompt = (movieInfo: string, isSpoilerFree: boolean, randomData: string): string => {
      return `
You are an expert movie critic and film analyst.
Your task is to create a STANDARD movie summary.

Give the user a solid understanding of the movie beyond just its premise.

Cover the following elements:
1. Story premise
2. Main characters
3. Character roles
4. Central conflict
5. Story progression
6. Important themes
7. Emotional aspects
8. Cinematic tone
9. What makes the movie distinctive
10. Who might enjoy the movie

Do not simply expand the Quick Summary.
Create a richer explanation with additional information about characters, conflict, themes and story progression.

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Target approximately 250–400 words.
3. Do not use filler or repeat the same point.
4. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "WHAT IS THIS MOVIE ABOUT + WHO ARE THE CHARACTERS + WHAT ARE THE MAIN CONFLICTS/THEMES?",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };

    const getDetailedSummaryPrompt = (movieInfo: string, isSpoilerFree: boolean, randomData: string): string => {
      return `
You are an expert movie critic, film historian, and storyteller.
Your task is to create a DETAILED movie summary and analysis.

Provide a deep understanding and analysis of the movie.
Do NOT simply write a longer summary. Instead, deeply analyze the following:

### STORY
- Story setup, main premise, main conflict
- Story progression, important developments, major turning points, and how the story evolves

### CHARACTERS
- Main characters, their roles, motivations, relationships, and character development
- How their decisions affect the story

### CONFLICT
- Central conflict, internal conflicts, external conflicts, and how they develop

### THEMES
- Analyze important themes (e.g., Friendship, Love, Family, Revenge, Identity, Survival, Power, Sacrifice, Morality)
- ONLY discuss themes that are actually relevant to the movie.

### EMOTIONAL EXPERIENCE
- Emotional tone, major emotional moments, what the audience is expected to feel, and how the movie creates emotional impact

### CINEMATIC STYLE
- Discuss Tone, Atmosphere, Visual style, Genre characteristics, and Storytelling style (where supported by the provided movie information)

### OVERALL ANALYSIS
- What makes the movie distinctive, what type of audience may enjoy it, what the movie is trying to communicate, and important ideas the audience may take away

==================================================
FRESH GENERATION REQUIREMENT
==================================================
This generation MUST feel like a fresh analysis.
Use the following random generation information to introduce natural variation:
${randomData}
Do NOT mention the seed or these instructions.

==================================================
MOVIE INFORMATION
==================================================
${movieInfo}

==================================================
SPOILER RULE
==================================================
${isSpoilerFree ? `
THIS IS A SPOILER-FREE ANALYSIS.
Do not reveal major plot twists, ending, final outcome, secret identities, major character deaths, or other revelations that would significantly spoil the viewing experience.
Discuss the movie's setup, characters, conflicts and themes without revealing major surprises.
` : `
SPOILERS ARE ALLOWED.
You may discuss important plot developments, turning points, character outcomes and the ending when relevant to the requested summary.
`}

==================================================
QUALITY REQUIREMENTS
==================================================
1. Make the analysis SPECIFIC to this movie.
2. Target approximately 500–800 words.
3. Do NOT fill the response with repetitive sentences to reach the word count. The content must actually become deeper.
4. Base your response ONLY on the actual movie information provided, or your own accurate broader movie knowledge. Do not invent characters, plot events, relationships, endings, themes, or facts.

==================================================
OUTPUT FORMAT
==================================================
Return ONLY valid JSON.
Use exactly this structure:
{
  "title": "Movie title",
  "summary": "WHAT IS THIS MOVIE ABOUT + CHARACTERS + MOTIVATIONS + CONFLICTS + STORY DEVELOPMENT + THEMES + EMOTIONAL IMPACT + CINEMATIC STYLE + OVERALL ANALYSIS.",
  "keyPoints": [
    "Important insight 1",
    "Important insight 2",
    "Important insight 3",
    "Important insight 4",
    "Important insight 5"
  ]
}
`;
    };

    let prompt = '';
    if (length === 'quick') {
      prompt = getQuickSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    } else if (length === 'standard') {
      prompt = getStandardSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    } else {
      prompt = getDetailedSummaryPrompt(movieInfoStr, isSpoilerFree, randomDataStr);
    };

    /*
     * ============================================================
     * GEMINI REQUEST
     * ============================================================
     */

    try {
      const response =
        await ai.models.generateContent({
          model: 'gemini-2.0-flash',

          contents: prompt,

          config: {
            responseMimeType:
              'application/json',

            /*
             * Higher temperature encourages different wording,
             * perspectives, and observations between generations.
             */
            temperature: 1.0,
          },
        });

      const responseText =
        response.text || '';

      let parsed: any;

      try {
        parsed = JSON.parse(
          responseText.trim()
        );
      } catch {
        /*
         * Gemini sometimes returns JSON wrapped in
         * Markdown despite the JSON response configuration.
         */

        const cleanedText =
          responseText
            .replace(
              /^```json\s*/i,
              ''
            )
            .replace(
              /^```\s*/i,
              ''
            )
            .replace(
              /\s*```$/i,
              ''
            )
            .trim();

        try {
          parsed = JSON.parse(
            cleanedText
          );
        } catch {
          parsed = {
            summary: responseText,

            keyPoints: [
              'Movie-specific cinematic analysis',
              'Character and story analysis',
              'Themes and deeper meaning',
              'Filmmaking and emotional impact',
              'Overall critical perspective',
            ],
          };
        }
      }

      /*
       * Support the exact JSON structure requested by the prompt.
       */

      const generatedSummary =
        parsed.summary ||
        parsed.content ||
        responseText ||
        'Unable to generate movie summary.';

      const generatedKeyPoints =
        Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints
          : Array.isArray(parsed.keyThemes)
            ? parsed.keyThemes
            : [
                'Movie-specific story analysis',
                'Character development and motivations',
                'Themes and deeper meaning',
                'Filmmaking and cinematic experience',
                'Overall critical perspective',
              ];

      /*
       * IMPORTANT:
       *
       * DO NOT call db.saveSummary().
       *
       * Movie summaries are intentionally not cached.
       *
       * Therefore every request can generate a fresh summary.
       */

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,

        movieId:
          movie.id,

        movieTitle:
          movie.title,

        length,

        isSpoilerFree,

        content:
          generatedSummary,

        keyThemes:
          generatedKeyPoints
            .slice(0, 5),

        recommendedFor:
          parsed.recommendedFor ||
          `Viewers interested in ${genreList || 'cinematic'} storytelling and deeper movie analysis.`,

        cinematicTone:
          parsed.cinematicTone ||
          'Cinematic & Thought-Provoking',

        createdAt:
          new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(
        'Gemini generateMovieSummary error:',
        err
      );

      /*
       * ==========================================================
       * GEMINI ERROR FALLBACK
       * ==========================================================
       *
       * Do NOT save this fallback to the database.
       */

      const fallbackThemes =
        movie.keywords &&
        movie.keywords.length > 0
          ? movie.keywords.slice(0, 5)
          : [
              'Storytelling',
              'Character Development',
              'Conflict',
              'Themes',
              'Cinema',
            ];

      const fallbackText = `
${movie.title} (${movie.releaseYear}) is a ${
        genreList || 'cinematic'
      } film directed by ${
        movie.director || 'its filmmakers'
      }.

${movie.overview}

The movie's central story is shaped by ${
        castList || 'its main characters'
      }, whose goals, decisions, relationships, and conflicts establish the emotional direction of the narrative.

The film explores ideas connected to ${
        keywordList || fallbackThemes.join(', ')
      }.

${
  isSpoilerFree
    ? 'This explanation intentionally avoids major twists, important reveals, and the ending.'
    : 'This version is intended to discuss the broader narrative and its major developments.'
}

The overall experience is defined by the combination of its ${
        genreList || 'genre'
      } elements, storytelling, characters, atmosphere, and filmmaking choices.
      `.trim();

      return {
        id: `sum_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`,

        movieId:
          movie.id,

        movieTitle:
          movie.title,

        length,

        isSpoilerFree,

        content:
          fallbackText,

        keyThemes:
          fallbackThemes,

        recommendedFor:
          `Viewers interested in ${genreList || 'cinematic'} storytelling.`,

        cinematicTone:
          'Engaging & Dramatic',

        createdAt:
          new Date().toISOString(),
      };
    }
  }

  /*
   * ==============================================================
   * AUDIO SUMMARY
   * ==============================================================
   *
   * Audio caching remains enabled.
   *
   * Only movie text summaries are regenerated every time.
   */

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
     */

    if (!forceRegenerate) {
      const cached =
        await db.getAudioSummary(
          summaryId,
          voiceName
        );

      if (cached) {
        return {
          ...cached,
          audioUrl:
            cached.audioBase64,
        };
      }
    }

    const ai =
      getGeminiClient();

    const wordCount =
      summaryText.split(/\s+/).length;

    const estimatedDuration =
      Math.max(
        10,
        Math.round(
          wordCount / 2.3
        )
      );

    if (ai) {
      try {
        const cleanScript =
          summaryText
            .replace(
              /[\n\r]+/g,
              ' '
            )
            .replace(
              /[#*_-]/g,
              ''
            )
            .slice(0, 1200);

        const ttsPrompt = `
Speak in a warm, cinematic, engaging documentary narrator tone:

${cleanScript}
`;

        const response =
          await ai.models.generateContent({
            model:
              'gemini-2.0-flash',

            contents: [
              {
                parts: [
                  {
                    text:
                      ttsPrompt,
                  },
                ],
              },
            ],

            config: {
              responseModalities: [
                Modality.AUDIO,
              ],

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
                      ].includes(
                        voiceName
                      )
                        ? voiceName
                        : 'Kore'
                    ) as any,
                  },
                },
              },
            },
          });

        const pcmBase64 =
          response
            .candidates?.[0]
            ?.content
            ?.parts?.[0]
            ?.inlineData
            ?.data;

        if (pcmBase64) {
          const wavDataUri =
            pcmToWavDataUri(
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
              audioBase64:
                wavDataUri,
              durationSeconds:
                estimatedDuration,
              summaryText,
            });

          return {
            ...saved,
            audioUrl:
              saved.audioBase64,
          };
        }
      } catch (err) {
        console.warn(
          'Gemini TTS model call error, falling back to browser synthesis:',
          err
        );
      }
    }

    /*
     * Browser synthesis fallback.
     */

    const saved =
      await db.saveAudioSummary({
        summaryId,
        movieId,
        movieTitle,
        voiceName,
        audioBase64:
          'tts_browser_synth',
        durationSeconds:
          estimatedDuration,
        summaryText,
      });

    return {
      ...saved,
      audioUrl:
        'tts_browser_synth',
    };
  }
}

export const aiService =
  new AIService();
