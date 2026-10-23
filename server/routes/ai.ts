import { randomUUID } from 'node:crypto';
import { Router, Request, Response } from 'express';
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

export type SummaryRouteDependencies = {
  tmdb: Pick<typeof tmdb, 'getMovieDetails'>;
  db: Pick<typeof db, 'getSummary' | 'saveSummary' | 'addHistory'>;
  aiService: Pick<typeof aiService, 'generateMovieSummary'>;
  logError?: (details: SummaryFailureDetails) => void;
};

type SummaryFailureDetails = {
  requestId: string;
  stage: string;
  errorName: string;
  errorMessage: string;
  upstreamStatus?: number;
};

function getRequestId(req: Request): string {
  const suppliedId = req.get('x-vercel-id') || req.get('x-request-id');
  return suppliedId && /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedId)
    ? suppliedId
    : randomUUID();
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(
      /(api[_ -]?key|authorization|password|token)(\s*[:=]\s*)[^\s,;]+/gi,
      '$1$2[REDACTED]'
    )
    .slice(0, 500);
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function getFailureStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const details = error as {
    upstreamStatusCode?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
  const status =
    details.upstreamStatusCode ?? details.status ?? details.statusCode;
  return typeof status === 'number' && Number.isInteger(status) &&
    status >= 100 && status <= 599
    ? status
    : undefined;
}

function logSummaryFailure(
  logger: NonNullable<SummaryRouteDependencies['logError']>,
  requestId: string,
  stage: string,
  error: unknown
): void {
  const cause =
    error instanceof GeminiGenerationError && error.cause
      ? error.cause
      : error;
  const upstreamStatus =
    error instanceof GeminiGenerationError
      ? error.upstreamStatusCode
      : getFailureStatus(cause);

  logger({
    requestId,
    stage,
    errorName: getErrorName(cause),
    errorMessage: safeErrorMessage(cause),
    ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
  });
}

export function createSummaryHandler(
  dependencies: SummaryRouteDependencies = { tmdb, db, aiService }
) {
  const logger =
    dependencies.logError ??
    ((details: SummaryFailureDetails) => {
      console.error('AI summary request failed', details);
    });

  return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const requestId = getRequestId(req);
    res.setHeader('x-request-id', requestId);
    let stage = 'request-validation';

    try {
      const summaryRequest = parseSummaryRequest(req.body);
      const { movieId, length, isSpoilerFree, forceRegenerate } = summaryRequest;

      stage = 'movie-lookup';
      const movie = await dependencies.tmdb.getMovieDetails(movieId);
      if (!movie) {
        res.status(404).json({ error: 'Movie could not be found to generate summary.' });
        return;
      }

      const summary = await getOrGenerateSummary({
        request: summaryRequest,
        readCache: () => {
          stage = 'cache-read';
          return dependencies.db.getSummary(movieId, length, isSpoilerFree);
        },
        generate: () => {
          stage = 'gemini-generation';
          return dependencies.aiService.generateMovieSummary({
            movie,
            length,
            isSpoilerFree,
            forceRegenerate,
          });
        },
        save: (generated) => {
          stage = 'cache-write';
          return dependencies.db.saveSummary({
            userId: req.user?.id,
            movieId: generated.movieId,
            movieTitle: generated.movieTitle,
            length: generated.length,
            isSpoilerFree: generated.isSpoilerFree,
            content: generated.content,
            keyThemes: generated.keyThemes,
            recommendedFor: generated.recommendedFor,
            cinematicTone: generated.cinematicTone,
          });
        },
        onCacheError: (operation, error) => {
          logSummaryFailure(logger, requestId, `cache-${operation}`, error);
        },
      });

      if (req.user) {
        stage = 'history-write';
        await dependencies.db.addHistory(
          req.user.id,
          'ai_summary',
          movie.id,
          movie.title,
          movie.posterPath,
          `Generated ${length} (${isSpoilerFree ? 'spoiler-free' : 'full'}) summary using Gemini AI`
        );
      }

      res.json({ summary });
    } catch (error) {
      if (error instanceof SummaryRequestValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      logSummaryFailure(logger, requestId, stage, error);
      if (error instanceof GeminiGenerationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      if (stage === 'history-write') {
        res.status(503).json({ error: 'Summary was generated, but user history is temporarily unavailable.' });
        return;
      }

      res.status(500).json({ error: 'Failed to generate AI movie summary. Please try again.' });
    }
  };
}

// Generate AI Movie Summary
aiRouter.post('/summary', optionalAuth, createSummaryHandler());

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
