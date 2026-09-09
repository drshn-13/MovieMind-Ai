import { GoogleGenAI, Modality } from '@google/genai';
import { db } from '../db/database.js';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length === 0) {
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

function pcmToWavDataUri(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM
  header.writeUInt16LE(1, 20); // Linear quantization
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
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  }

  async generateMovieSummary(options: GenerateSummaryOptions): Promise<SummaryOutput> {
    const { movie, length, isSpoilerFree, forceRegenerate } = options;

    // Check database cache first if not explicitly forced to regenerate
    if (!forceRegenerate) {
      const cached = await db.getSummary(movie.id, length, isSpoilerFree);
      if (cached) {
        return cached;
      }
    }

    const ai = getGeminiClient();
    const genreList = movie.genres.map((g) => g.name).join(', ');
    const castList = (movie.cast || []).slice(0, 4).map((c) => `${c.name} as ${c.character}`).join(', ');
    const keywordList = (movie.keywords || []).slice(0, 6).join(', ');

    if (!ai) {
      // Offline fallback template generator
      const fallbackThemes = (movie.keywords && movie.keywords.length > 0)
        ? movie.keywords.slice(0, 4)
        : ['Identity', 'Courage', 'Moral Conflict', 'Discovery'];

      let fallbackText = '';
      if (length === 'quick') {
        fallbackText = `MAIN EVENTS SUMMARY:\n\n• Setup & Catalyst: In "${movie.title}" (${movie.releaseYear}), directed by ${movie.director || 'esteemed filmmakers'}, the story begins with ${movie.overview.slice(0, 160)}...\n\n• Main Conflict & Turning Point: As tensions escalate, the central characters (${castList || 'the ensemble'}) are thrust into a high-stakes struggle that tests their endurance, values, and loyalties.\n\n• Climax & Outcome: The story culminates in a dramatic confrontation where critical choices determine the characters' ultimate fate and resolve the core narrative journey.`;
      } else if (length === 'detailed') {
        fallbackText = `DETAILED FULL-STORY WALKTHROUGH:\n\n1. The Setup & Inciting Incident:\n"${movie.title}" (${movie.releaseYear}) introduces us to a distinctive ${genreList} world. The narrative kicks off as ${movie.overview}\n\n2. Rising Stakes & Major Turning Points:\nDirected by ${movie.director || 'visionary creators'}, the story gathers momentum through a sequence of pivotal developments. The dynamic between ${castList || 'the primary characters'} anchors the emotional and narrative stakes, driving the characters deeper into unavoidable conflict.\n\n3. The Climax & Complete Resolution:\nIn the final act, the conflict reaches its boiling point. ${isSpoilerFree ? 'The climax brings together every thematic thread into a poignant resolution without spoiling the final twist.' : 'Every storyline converges into a decisive climax, bringing the character arcs and narrative questions to a powerful, conclusive resolution.'}`;
      } else {
        fallbackText = `"${movie.title}" (${movie.releaseYear}) is an engaging ${genreList} film directed by ${movie.director || 'filmmakers'}.\n\nStory Overview & Main Events:\n${movie.overview}\n\nFeaturing standout performances by ${castList || 'the cast'}, the film weaves together themes of ${fallbackThemes.join(', ')}.\n\n${isSpoilerFree ? 'This summary highlights the core plot milestones and cinematic mood while keeping late-stage twists spoiler-free.' : 'A complete narrative breakdown covering the setup, rising complications, and climactic finale.'}`;
      }

      const saved = await db.saveSummary({
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: fallbackText,
        keyThemes: fallbackThemes,
        recommendedFor: `Fans of thoughtful ${genreList} films seeking high-production storytelling.`,
        cinematicTone: 'Immersive & Thought-Provoking',
      });
      return saved;
    }

    // Call Gemini API server-side
    const prompt = `You are MovieMind AI, an elite film critic and cinematic storytelling analyst.
Generate a structured, authentic movie summary based STRICTLY on the real movie information below:

Title: ${movie.title} (${movie.releaseYear})
Release Date: ${movie.releaseDate || 'Unknown'}
Rating: ${movie.voteAverage ? `${movie.voteAverage}/10` : 'N/A'}
Tagline: ${movie.tagline || 'N/A'}
Genres: ${genreList}
Director: ${movie.director || 'Unknown'}
Key Cast: ${castList || 'Ensemble'}
Overview: ${movie.overview}
Keywords/Themes: ${keywordList}

Configuration:
- Summary Length & Scope: ${length === 'detailed' 
  ? 'DETAILED FULL STORY: Tell the entire story from beginning to end in chronological depth. Walk through the complete plot including: 1. Setup & Inciting Incident, 2. Rising Action, Key Turning Points & Plot Twists, 3. The Climax, Final Showdown & Complete Resolution.' 
  : length === 'quick' 
  ? 'SHORT MAIN EVENTS: Provide a concise summary that clearly highlights the main, key events of the movie in chronological order (Setup -> Main Conflict / Turning Point -> Climax & Resolution).' 
  : 'STANDARD STORY SUMMARY: Provide an engaging 2-3 paragraph overview covering the main storyline, key character milestones, and narrative progression.'}
- Spoiler Policy: ${isSpoilerFree ? 'SPOILER-FREE: Explain the premise, setup, and key rising events while preserving major late-game twists and ending surprises.' : 'FULL STORY DETAILS & SPOILERS: Discuss the entire narrative trajectory, pivotal twists, and complete ending without withholding any story details.'}

CRITICAL RULES:
1. Do NOT hallucinate or invent fake storylines. Use actual film details.
2. Write with a vivid, cinematic, highly readable tone.
3. Respond in valid JSON with this exact structure:
{
  "content": "The generated summary text formatted nicely with paragraphs using \\n\\n where appropriate.",
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4"],
  "recommendedFor": "A 1-sentence description of the type of movie lover who will appreciate this film.",
  "cinematicTone": "A 2-3 word description of the visual & emotional tone, e.g. 'Mind-Bending & Atmospheric'"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      let parsed: any;
      try {
        parsed = JSON.parse(responseText.trim());
      } catch {
        parsed = {
          content: responseText,
          keyThemes: ['Cinematic Drama', 'Visual Scope', 'Character Journey'],
          recommendedFor: `Fans of ${genreList} cinema.`,
          cinematicTone: 'Compelling & Atmospheric',
        };
      }

      const saved = await db.saveSummary({
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: parsed.content || responseText,
        keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes : ['Cinematic Scope', 'Human Spirit'],
        recommendedFor: parsed.recommendedFor || `Fans of ${genreList} stories.`,
        cinematicTone: parsed.cinematicTone || 'Cinematic & Immersive',
      });

      return saved;
    } catch (err: any) {
      console.error('Gemini generateMovieSummary error:', err);
      // Fallback
      return await db.saveSummary({
        movieId: movie.id,
        movieTitle: movie.title,
        length,
        isSpoilerFree,
        content: `"${movie.title}" (${movie.releaseYear}) is a celebrated ${genreList} film directed by ${movie.director || 'filmmakers'}. ${movie.overview}`,
        keyThemes: ['Storytelling', 'Cinema'],
        recommendedFor: `Viewers interested in ${genreList}.`,
        cinematicTone: 'Engaging & Dramatic',
      });
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
    const { summaryId, movieId, movieTitle, summaryText, voiceName = 'Kore', forceRegenerate = false } = options;

    // Check cache if not forcing regeneration
    if (!forceRegenerate) {
      const cached = await db.getAudioSummary(summaryId, voiceName);
      if (cached) {
        return {
          ...cached,
          audioUrl: cached.audioBase64,
        };
      }
    }

    const ai = getGeminiClient();
    const wordCount = summaryText.split(/\s+/).length;
    // Average speech rate is ~140 words per minute (2.3 words/sec)
    const estimatedDuration = Math.max(10, Math.round(wordCount / 2.3));

    if (ai) {
      try {
        // Clean text for speech
        const cleanScript = summaryText
          .replace(/[\n\r]+/g, ' ')
          .replace(/[#*_-]/g, '')
          .slice(0, 1200); // Keep reasonable length for audio generation

        const ttsPrompt = `Speak in a warm, cinematic, engaging documentary narrator tone: ${cleanScript}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ parts: [{ text: ttsPrompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: (['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName) ? voiceName : 'Kore') as any,
                },
              },
            },
          },
        });

        const pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (pcmBase64) {
          const wavDataUri = pcmToWavDataUri(pcmBase64, 24000, 1, 16);
          const saved = await db.saveAudioSummary({
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
        console.warn('Gemini TTS model call error, falling back to modular client synthesis container:', err);
      }
    }

    // Modular fallback indicator: the frontend player seamlessly uses Web Speech API or synthesizes audio
    const saved = await db.saveAudioSummary({
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
