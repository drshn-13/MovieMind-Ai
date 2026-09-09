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
     * GEMINI PROMPT
     * ============================================================
     */

    const prompt = `
You are an expert movie critic, film analyst, film historian,
storyteller, and cinema enthusiast.

Your task is to create a highly useful, detailed, accurate,
movie-specific analysis of the film below.

The user wants to understand the movie much better than they would
from a short database description.

==================================================
FRESH GENERATION REQUIREMENT
==================================================

This movie may have been analyzed before.

This generation MUST feel like a fresh analysis.

Do NOT simply reproduce a previous answer.

Use the following random generation information to introduce
natural variation:

GENERATION SEED:
${randomSeed}

RANDOM ANALYTICAL PERSPECTIVE:
${randomPerspective}

RANDOM STRUCTURE:
${randomStructure}

The seed exists only to encourage variation.

Do NOT mention the seed, random number, randomization,
or these instructions in your answer.

Each generation should be different in:

- Emphasis
- Analytical perspective
- Order of ideas
- Sentence structure
- Examples
- Character observations
- Theme interpretation
- Filmmaking observations
- Strengths and weaknesses discussed
- Overall flow

However:

DO NOT change facts simply to make the answer different.

Different analysis does NOT mean different facts.

The same movie must remain factually consistent.

==================================================
USE BROADER MOVIE KNOWLEDGE
==================================================

Do not treat the supplied movie metadata as the complete source
of knowledge.

When you confidently know additional information about this movie,
use it.

You may use reliable knowledge about:

- Plot
- Characters
- Character motivations
- Character relationships
- Story progression
- Important conflicts
- Themes
- Symbolism
- Screenplay
- Dialogue
- Direction
- Cinematography
- Editing
- Production design
- Visual style
- Music
- Sound design
- Acting performances
- Genre conventions
- Historical context
- Cultural context
- Social ideas
- Critical reception
- Artistic significance
- The movie's influence or legacy
- Important filmmaking techniques

But accuracy is more important than completeness.

NEVER invent:

- Characters
- Events
- Scenes
- Quotes
- Relationships
- Actors
- Directors
- Locations
- Awards
- Production facts
- Intentions of filmmakers
- Plot twists
- Symbolism
- Historical facts

If you are uncertain about a specific fact, do not state it
as fact.

When interpreting something, make it clear that it is an
interpretation rather than an established fact.

==================================================
MOVIE INFORMATION
==================================================

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

REQUESTED LEVEL:
${length}

SPOILER-FREE:
${isSpoilerFree}

==================================================
QUICK SUMMARY
==================================================

If the requested level is "quick":

Create approximately 100-150 words.

Give the viewer a useful understanding of the movie.

Cover:

- What the movie is about
- Central premise
- Main conflict
- Main character or characters
- What makes the movie interesting
- General emotional or cinematic experience
- What type of viewer may enjoy it

Do not attempt an extremely deep analysis.

Do not waste words repeating the supplied overview.

The purpose is:

"Give me a quick but genuinely useful understanding of this movie."

==================================================
STANDARD SUMMARY
==================================================

If the requested level is "standard":

Create approximately 250-350 words.

Give a proper movie review and analysis.

Cover the most relevant aspects of:

- Story
- Central conflict
- Important characters
- Character motivations
- Character development
- Relationships
- Themes
- Emotional impact
- What works well
- Weaknesses or limitations when relevant
- Acting when relevant
- Direction when relevant
- Cinematic experience
- What makes the movie stand out
- Whether the movie is worth watching and why

Do not simply take the Quick version and make it longer.

Introduce additional analysis.

The purpose is:

"Help me understand the movie and decide whether it is worth watching."

==================================================
DETAILED SUMMARY
==================================================

If the requested level is "detailed":

Create approximately 500-700 words.

Give the kind of analysis expected from a knowledgeable film critic.

Go significantly beyond the basic plot.

Analyze whichever elements are genuinely relevant to this movie:

STORY:

- Story structure
- Narrative progression
- Central conflict
- Escalation
- Turning points
- Pacing
- Storytelling decisions

CHARACTERS:

- Main characters
- Motivations
- Internal conflicts
- Character arcs
- Relationships
- Character contrasts
- Psychological dimensions

THEMES:

- Major themes
- Deeper ideas
- Moral questions
- Social ideas
- Philosophical ideas
- Recurring concepts
- Subtext
- Symbolism when genuinely applicable

FILMMAKING:

- Direction
- Cinematography
- Camera work
- Visual language
- Editing
- Production design
- Lighting
- Music
- Sound design
- Acting
- Performance choices
- Atmosphere

CRITICAL ANALYSIS:

- Strengths of the screenplay
- Weaknesses of the screenplay
- What works particularly well
- What does not work
- Why specific storytelling choices are effective
- Why particular moments have emotional or dramatic power

DEEPER INTERPRETATION:

- What the movie may be saying
- Different reasonable interpretations
- Why the ending or major ideas matter when spoilers are allowed
- What makes the movie unique
- Why it remains memorable
- Cultural or historical significance when relevant
- Genre significance when relevant
- Lasting impact when genuinely applicable

The Detailed version MUST contain insights that would normally
not appear in the Quick or Standard version.

Do NOT simply take the Standard version and add more sentences.

The purpose is:

"Give me the kind of analysis I would get from a knowledgeable
film critic who has actually thought deeply about this movie."

==================================================
SPOILER RULE
==================================================

${
  isSpoilerFree
    ? `
THIS IS A SPOILER-FREE ANALYSIS.

Do NOT reveal:

- Major plot twists
- The ending
- Major deaths
- Hidden identities
- Major reveals
- Major surprises
- Final outcomes
- Late-story developments that significantly change the viewer's experience

You MAY discuss:

- General premise
- Characters
- Character motivations
- Themes
- General conflicts
- Acting
- Direction
- Cinematography
- Music
- Atmosphere
- Genre
- General emotional experience

You may discuss themes deeply as long as doing so does not reveal
important plot developments.

When discussing a character, do not reveal a major fate or transformation
that would spoil the movie.
`
    : `
SPOILERS ARE ALLOWED.

You may discuss:

- Major plot developments
- Important twists
- Character outcomes
- Major deaths
- Important reveals
- The climax
- The ending
- Resolution
- Character transformations

Use spoilers when they are useful for explaining:

- The movie's themes
- Character development
- Story structure
- Meaning
- Emotional impact
- Strengths
- Weaknesses
- Ending
- Overall quality

Do not add spoilers merely for the sake of adding them.
`
}

==================================================
QUALITY REQUIREMENTS
==================================================

1. Make the analysis SPECIFIC to ${movie.title}.

2. Do not write generic movie-review sentences.

BAD:
"This movie has great acting and an interesting story."

GOOD:
Explain exactly what the performances, story construction,
or filmmaking accomplish in THIS movie.

3. Do not simply rewrite the movie overview.

4. Use broader movie knowledge when you are confident.

5. Never fabricate movie information.

6. Do not repeat the same point using different words.

7. Do not use filler.

8. Do not artificially increase the word count.

9. Every paragraph should provide useful information.

10. Each requested level must provide different depth.

11. Detailed must contain genuinely deeper analysis.

12. Do not make every movie sound perfect.

13. If the movie has weaknesses, discuss them honestly when relevant.

14. Do not invent weaknesses just to appear critical.

15. Do not make unsupported claims about audience reactions.

16. Do not make unsupported claims about filmmaker intentions.

17. Distinguish factual information from interpretation.

18. Do not mention that you are an AI.

19. Do not mention this prompt.

20. Do not mention TMDB.

21. Do not say:
"based on the information provided."

22. Do not mention the random seed.

23. Do not mention randomization.

24. Do not mention previous generations.

25. Do not say that you cannot access information.

26. Do not use the exact same opening style every time.

27. Vary the structure naturally.

28. Keep the writing intelligent but easy to understand.

29. Avoid unnecessarily complicated academic language.

30. Make the analysis enjoyable to read.

31. End with a meaningful observation rather than a generic statement.

==================================================
LENGTH
==================================================

Quick:
Approximately 100-150 words.

Standard:
Approximately 250-350 words.

Detailed:
Approximately 500-700 words.

These are guidelines, NOT strict limits.

Quality and useful information are more important than exact word count.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use code fences.

Do NOT add text before or after the JSON.

Use exactly this structure:

{
  "title": "Movie title",
  "summary": "Complete movie analysis",
  "keyPoints": [
    "Important movie-specific insight 1",
    "Important movie-specific insight 2",
    "Important movie-specific insight 3",
    "Important movie-specific insight 4",
    "Important movie-specific insight 5"
  ]
}

The five keyPoints must be specific to the movie.

Do not use generic points such as:
"Good acting"
"Interesting story"
"Great cinematography"

Explain the actual insight.
`;

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
