import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createSummaryHandler, SummaryRouteDependencies } from './ai.js';
import { GeminiGenerationError } from '../services/gemini.js';

const movie = {
  id: 42,
  title: 'Example Movie',
  overview: 'A character faces a difficult choice.',
  releaseYear: 2020,
  genres: [{ name: 'Drama' }],
};

const summary = {
  id: 'summary-42',
  movieId: 42,
  movieTitle: 'Example Movie',
  length: 'standard' as const,
  isSpoilerFree: true,
  content: 'A generated summary.',
  keyThemes: ['Choice'],
  recommendedFor: 'Drama fans',
  cinematicTone: 'Reflective',
  createdAt: '2026-10-23T00:00:00.000Z',
};

async function createTestEndpoint(
  overrides: Partial<SummaryRouteDependencies> = {}
) {
  const logs: Array<{
    requestId: string;
    stage: string;
    errorName: string;
    errorMessage: string;
    upstreamStatus?: number;
  }> = [];
  const calls: Array<{
    length: string;
    isSpoilerFree: boolean;
    forceRegenerate?: boolean;
  }> = [];

  const dependencies: SummaryRouteDependencies = {
    tmdb: {
      getMovieDetails: async () => movie,
    },
    db: {
      getSummary: async () => undefined,
      saveSummary: async (value) => ({
        ...value,
        id: summary.id,
        createdAt: summary.createdAt,
      }),
      addHistory: async () => {
        throw new Error('History should not be written for anonymous requests.');
      },
    },
    aiService: {
      generateMovieSummary: async (options) => {
        calls.push({
          length: options.length,
          isSpoilerFree: options.isSpoilerFree,
          forceRegenerate: options.forceRegenerate,
        });
        return { ...summary, ...options, movieTitle: movie.title };
      },
    },
    logError: (details) => logs.push(details),
    ...overrides,
  };

  const app = express();
  app.use(express.json());
  app.post('/api/ai/summary', createSummaryHandler(dependencies));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  return {
    calls,
    logs,
    post: async (body: unknown, headers: Record<string, string> = {}) => {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      return {
        status: response.status,
        requestId: response.headers.get('x-request-id'),
        body: await response.json(),
      };
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      }),
  };
}

test('summary route accepts every mode and both spoiler settings', async () => {
  const endpoint = await createTestEndpoint();

  try {
    for (const length of ['quick', 'standard', 'detailed', 'storyline'] as const) {
      for (const isSpoilerFree of [true, false]) {
        const response = await endpoint.post({
          movieId: 42,
          length,
          isSpoilerFree,
        });
        assert.equal(response.status, 200);
        assert.equal(response.body.summary.length, length);
        assert.equal(response.body.summary.isSpoilerFree, isSpoilerFree);
      }
    }

    assert.deepEqual(
      endpoint.calls.map(({ length, isSpoilerFree }) => [length, isSpoilerFree]),
      ['quick', 'standard', 'detailed', 'storyline'].flatMap((length) =>
        [true, false].map((isSpoilerFree) => [length, isSpoilerFree])
      )
    );
  } finally {
    await endpoint.close();
  }
});

test('summary route serves cache hits and bypasses cache for forced regeneration', async () => {
  let cacheReads = 0;
  const endpoint = await createTestEndpoint({
    db: {
      getSummary: async () => {
        cacheReads += 1;
        return { ...summary, id: 'cached-summary' };
      },
      saveSummary: async (value) => ({
        ...value,
        id: summary.id,
        createdAt: summary.createdAt,
      }),
      addHistory: async () => {
        throw new Error('History should not be written for anonymous requests.');
      },
    },
  });

  try {
    const cached = await endpoint.post({ movieId: 42 });
    assert.equal(cached.status, 200);
    assert.equal(cached.body.summary.id, 'cached-summary');
    assert.equal(endpoint.calls.length, 0);

    const refreshed = await endpoint.post({
      movieId: 42,
      forceRegenerate: true,
    });
    assert.equal(refreshed.status, 200);
    assert.equal(endpoint.calls.length, 1);
    assert.equal(cacheReads, 1);
  } finally {
    await endpoint.close();
  }
});

test('summary route reports missing Gemini configuration with 503', async () => {
  const endpoint = await createTestEndpoint({
    aiService: {
      generateMovieSummary: async () => {
        throw new GeminiGenerationError('Gemini API key is not configured.', 503);
      },
    },
  });

  try {
    const response = await endpoint.post({ movieId: 42 });
    assert.equal(response.status, 503);
    assert.match(response.body.error, /API key is not configured/);
    assert.equal(endpoint.logs[0].stage, 'gemini-generation');
  } finally {
    await endpoint.close();
  }
});

test('summary route reports Gemini upstream status and sanitized diagnostics', async () => {
  const endpoint = await createTestEndpoint({
    aiService: {
      generateMovieSummary: async () => {
        const cause = Object.assign(
          new Error('Provider rejected api_key=AIza0123456789abcdefghijklmnopqrstuv'),
          { status: 401 }
        );
        throw new GeminiGenerationError(
          'AI provider rejected its configured credentials.',
          503,
          401,
          cause
        );
      },
    },
  });

  try {
    const response = await endpoint.post(
      { movieId: 42 },
      { 'x-vercel-id': 'vercel-req-123' }
    );
    assert.equal(response.status, 503);
    assert.equal(response.requestId, 'vercel-req-123');
    assert.deepEqual(endpoint.logs[0], {
      requestId: 'vercel-req-123',
      stage: 'gemini-generation',
      errorName: 'Error',
      errorMessage: 'Provider rejected api_key=[REDACTED]',
      upstreamStatus: 401,
    });
    assert.doesNotMatch(response.body.error, /AIza|api_key/);
  } finally {
    await endpoint.close();
  }
});

test('summary route logs database cache errors and continues generation', async () => {
  const endpoint = await createTestEndpoint({
    db: {
      getSummary: async () => {
        throw new Error('database unavailable');
      },
      saveSummary: async () => {
        throw new Error('database write unavailable');
      },
      addHistory: async () => {
        throw new Error('History should not be written for anonymous requests.');
      },
    },
  });

  try {
    const response = await endpoint.post({ movieId: 42 });
    assert.equal(response.status, 200);
    assert.equal(endpoint.calls.length, 1);
    assert.deepEqual(
      endpoint.logs.map(({ stage }) => stage),
      ['cache-read', 'cache-write']
    );
    assert.equal(endpoint.logs[0].requestId, response.requestId);
  } finally {
    await endpoint.close();
  }
});

test('summary route rejects invalid fields without calling generation', async () => {
  const endpoint = await createTestEndpoint();

  try {
    const response = await endpoint.post({
      movieId: '42',
      length: 'storyline',
      isSpoilerFree: false,
      forceRegenerate: false,
    });
    assert.equal(response.status, 400);
    assert.equal(endpoint.calls.length, 0);
    assert.equal(endpoint.logs.length, 0);
  } finally {
    await endpoint.close();
  }
});

test('summary route logs unexpected failures and returns a safe 500', async () => {
  const endpoint = await createTestEndpoint({
    tmdb: {
      getMovieDetails: async () => {
        throw new Error('unexpected internal failure');
      },
    },
  });

  try {
    const response = await endpoint.post(
      { movieId: 42 },
      { 'x-request-id': 'request-42' }
    );
    assert.equal(response.status, 500);
    assert.equal(response.requestId, 'request-42');
    assert.deepEqual(endpoint.logs[0], {
      requestId: 'request-42',
      stage: 'movie-lookup',
      errorName: 'Error',
      errorMessage: 'unexpected internal failure',
    });
    assert.doesNotMatch(response.body.error, /internal failure/);
  } finally {
    await endpoint.close();
  }
});
