import { Router, Response } from 'express';
import { aiService, GeminiGenerationError } from '../services/gemini.js';
import { tmdb } from '../services/tmdb.js';
import { db } from '../db/database.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import {
  parseSummaryRequest,
  getOrGenerateSummary,
  SummaryRequestValidationError,
} from '../services/summary-request.js';

export const aiRouter = Router();

// Generate AI Movie Summary
aiRouter.post('/summary', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let summaryRequest;
    try {
      summaryRequest = parseSummaryRequest(req.body);
    } catch (err) {
      if (err instanceof SummaryRequestValidationError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }

    const { movieId, length, isSpoilerFree, forceRegenerate } = summaryRequest;
    const movie = await tmdb.getMovieDetails(movieId);
    if (!movie) {
      res.status(404).json({ error: 'Movie could not be found to generate summary.' });
      return;
    }

    const summary = await getOrGenerateSummary({
      request: summaryRequest,
      readCache: () => db.getSummary(movieId, length, isSpoilerFree),
      generate: () =>
        aiService.generateMovieSummary({
          movie,
          length,
          isSpoilerFree,
          forceRegenerate,
        }),
      save: (generated) =>
        db.saveSummary({
          userId: req.user?.id,
          movieId: generated.movieId,
          movieTitle: generated.movieTitle,
          length: generated.length,
          isSpoilerFree: generated.isSpoilerFree,
          content: generated.content,
          keyThemes: generated.keyThemes,
          recommendedFor: generated.recommendedFor,
          cinematicTone: generated.cinematicTone,
        }),
    });

    if (req.user) {
      await db.addHistory(
        req.user.id,
        'ai_summary',
        movie.id,
        movie.title,
        movie.posterPath,
        `Generated ${length} (${isSpoilerFree ? 'spoiler-free' : 'full'}) summary using Gemini AI`
      );
    }

    res.json({ summary });
  } catch (err: any) {
    console.error('Error generating AI summary:', err);
    if (err instanceof GeminiGenerationError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to generate AI movie summary. Please try again.' });
  }
});

// Generate AI Audio Narration from Summary
aiRouter.post('/audio', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { summaryId, movieId, movieTitle, summaryText, voiceName = 'Kore', forceRegenerate = false } = req.body;

    if (!summaryText || !movieId) {
      res.status(400).json({ error: 'movieId and summaryText are required to generate audio narration.' });
      return;
    }

    const movie = await tmdb.getMovieDetails(Number(movieId));
    const title = movieTitle || movie?.title || 'Movie Summary';

    const audio = await aiService.generateAudioSummary({
      summaryId: summaryId || `sum_${movieId}`,
      movieId: Number(movieId),
      movieTitle: title,
      summaryText,
      voiceName,
      forceRegenerate: Boolean(forceRegenerate),
    });

    if (req.user) {
      await db.addHistory(
        req.user.id,
        'audio_summary',
        Number(movieId),
        title,
        movie?.posterPath,
        `Generated AI audio speech narration (${voiceName} voice)`
      );
    }

    res.json({ audio });
  } catch (err: any) {
    console.error('Error generating AI audio:', err);
    res.status(500).json({ error: 'Failed to generate audio summary. Please try again.' });
  }
});
