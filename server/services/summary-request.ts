export type SummaryLength = 'quick' | 'standard' | 'detailed' | 'storyline';

export interface SummaryRequest {
  movieId: number;
  length: SummaryLength;
  isSpoilerFree: boolean;
  forceRegenerate: boolean;
}

export class SummaryRequestValidationError extends Error {}

const SUMMARY_CACHE_VERSION = 'v2';

const isSummaryLength = (value: unknown): value is SummaryLength =>
  value === 'quick' ||
  value === 'standard' ||
  value === 'detailed' ||
  value === 'storyline';

export function parseSummaryRequest(body: unknown): SummaryRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SummaryRequestValidationError('Request body must be an object.');
  }

  const request = body as Record<string, unknown>;
  const length = request.length === undefined ? 'standard' : request.length;
  const isSpoilerFree =
    request.isSpoilerFree === undefined ? true : request.isSpoilerFree;
  const forceRegenerate =
    request.forceRegenerate === undefined ? false : request.forceRegenerate;

  if (
    typeof request.movieId !== 'number' ||
    !Number.isInteger(request.movieId) ||
    request.movieId <= 0
  ) {
    throw new SummaryRequestValidationError('movieId must be a positive integer.');
  }
  if (!isSummaryLength(length)) {
    throw new SummaryRequestValidationError(
      'length must be quick, standard, detailed, or storyline.'
    );
  }
  if (typeof isSpoilerFree !== 'boolean') {
    throw new SummaryRequestValidationError('isSpoilerFree must be a boolean.');
  }
  if (typeof forceRegenerate !== 'boolean') {
    throw new SummaryRequestValidationError('forceRegenerate must be a boolean.');
  }

  return {
    movieId: request.movieId,
    length,
    isSpoilerFree,
    forceRegenerate,
  };
}

export function summaryCacheParameters(
  movieId: number,
  length: SummaryLength,
  isSpoilerFree: boolean
): [number, string, boolean] {
  return [movieId, `${SUMMARY_CACHE_VERSION}:${length}`, isSpoilerFree];
}

export function shouldReadSummaryCache(forceRegenerate: boolean): boolean {
  return !forceRegenerate;
}

export async function getOrGenerateSummary<T>(options: {
  request: SummaryRequest;
  readCache: () => Promise<T | undefined>;
  generate: () => Promise<T>;
  save: (summary: T) => Promise<unknown>;
  onCacheError?: (operation: 'read' | 'write', error: unknown) => void;
}): Promise<T> {
  if (shouldReadSummaryCache(options.request.forceRegenerate)) {
    try {
      const cached = await options.readCache();
      if (cached !== undefined) return cached;
    } catch (error) {
      options.onCacheError?.('read', error);
    }
  }

  const generated = await options.generate();
  try {
    await options.save(generated);
  } catch (error) {
    options.onCacheError?.('write', error);
  }
  return generated;
}
