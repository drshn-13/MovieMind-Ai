import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOrGenerateSummary,
  parseSummaryRequest,
  summaryCacheParameters,
  SummaryRequestValidationError,
} from './summary-request.js';
import { buildSummaryPrompt } from './summary-prompts.js';
import { AIService, GeminiGenerationError } from './gemini.js';

const movieInfo = 'TITLE: Example Movie\nOVERVIEW: A character faces a difficult choice.';

test('summary prompts select distinct quick, standard, detailed, and storyline instructions', () => {
  const quick = buildSummaryPrompt(movieInfo, 'quick', true);
  const standard = buildSummaryPrompt(movieInfo, 'standard', true);
  const detailed = buildSummaryPrompt(movieInfo, 'detailed', true);
  const storyline = buildSummaryPrompt(movieInfo, 'storyline', true);

  assert.match(quick, /premise, main character, and central conflict/);
  assert.match(standard, /story progression, important characters and their motivations/);
  assert.match(detailed, /character development and motivations, internal and external conflicts/);
  assert.match(storyline, /chronological plot explanation/);
  assert.match(storyline, /Keep the events in narrative order/);
  assert.notEqual(storyline, detailed);
});

test('the Gemini service sends the selected mode and spoiler policy to Gemini', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  const prompts: string[] = [];
  const service = new AIService(async (_ai, prompt) => {
    prompts.push(prompt);
    return {
      text: JSON.stringify({
        summary: 'Generated test summary.',
        keyPoints: [],
      }),
    };
  });

  try {
    for (const length of ['quick', 'standard', 'detailed', 'storyline'] as const) {
      const result = await service.generateMovieSummary({
        movie: {
          id: 42,
          title: 'Example Movie',
          overview: 'A character faces a difficult choice.',
          releaseYear: 2020,
          genres: [{ name: 'Drama' }],
        },
        length,
        isSpoilerFree: length !== 'storyline',
      });
      assert.equal(result.length, length);
      assert.equal(result.isSpoilerFree, length !== 'storyline');
    }

    assert.equal(prompts.length, 4);
    assert.match(prompts[0], /Requested mode: quick/);
    assert.match(prompts[1], /Requested mode: standard/);
    assert.match(prompts[2], /Requested mode: detailed/);
    assert.match(prompts[3], /Requested mode: storyline/);
    assert.match(prompts[0], /SPOILER-FREE/);
    assert.match(prompts[3], /SPOILERS ARE ENABLED/);
  } finally {
    if (previousKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousKey;
    }
  }
});

test('spoiler settings select different instructions for every mode', () => {
  for (const length of ['quick', 'standard', 'detailed', 'storyline'] as const) {
    const spoilerFree = buildSummaryPrompt(movieInfo, length, true);
    const spoilerEnabled = buildSummaryPrompt(movieInfo, length, false);

    assert.match(spoilerFree, /SPOILER-FREE/);
    assert.match(spoilerFree, /Do not disclose major twists, hidden identities, significant deaths, final outcomes, or the ending/);
    assert.match(spoilerEnabled, /SPOILERS ARE ENABLED/);
    assert.notEqual(spoilerFree, spoilerEnabled);
  }
});

test('request validation rejects invalid IDs, modes, and non-boolean flags', () => {
  const invalidBodies: unknown[] = [
    {},
    { movieId: '42' },
    { movieId: 0 },
    { movieId: 42, length: 'invalid' },
    { movieId: 42, isSpoilerFree: 'false' },
    { movieId: 42, forceRegenerate: 'false' },
  ];

  for (const body of invalidBodies) {
    assert.throws(
      () => parseSummaryRequest(body),
      SummaryRequestValidationError
    );
  }

  assert.deepEqual(parseSummaryRequest({ movieId: 42 }), {
    movieId: 42,
    length: 'standard',
    isSpoilerFree: true,
    forceRegenerate: false,
  });
});

test('cache parameters separate modes and spoiler settings', () => {
  const standardSafe = summaryCacheParameters(42, 'standard', true);
  const quickSafe = summaryCacheParameters(42, 'quick', true);
  const standardSpoilers = summaryCacheParameters(42, 'standard', false);
  const storylineSafe = summaryCacheParameters(42, 'storyline', true);

  assert.deepEqual(standardSafe, [42, 'v2:standard', true]);
  assert.notDeepEqual(standardSafe, quickSafe);
  assert.notDeepEqual(standardSafe, standardSpoilers);
  assert.notDeepEqual(standardSafe, storylineSafe);
  assert.notDeepEqual(standardSafe, [42, 'standard', true]);
});

test('forced regeneration bypasses the cache and saves the fresh result', async () => {
  let cacheReads = 0;
  let generations = 0;
  let savedSummary = '';

  const summary = await getOrGenerateSummary({
    request: {
      movieId: 42,
      length: 'quick',
      isSpoilerFree: false,
      forceRegenerate: true,
    },
    readCache: async () => {
      cacheReads += 1;
      return { content: 'cached summary' };
    },
    generate: async () => {
      generations += 1;
      return { content: 'fresh response' };
    },
    save: async (generated) => {
      savedSummary = generated.content;
    },
  });

  assert.equal(cacheReads, 0);
  assert.equal(generations, 1);
  assert.equal(summary.content, 'fresh response');
  assert.equal(savedSummary, 'fresh response');
});

test('normal requests return a matching cached summary without regenerating', async () => {
  let generations = 0;
  const cachedSummary = { content: 'cached summary' };

  const summary = await getOrGenerateSummary({
    request: {
      movieId: 42,
      length: 'standard',
      isSpoilerFree: true,
      forceRegenerate: false,
    },
    readCache: async () => cachedSummary,
    generate: async () => {
      generations += 1;
      return { content: 'unexpected generation' };
    },
    save: async () => undefined,
  });

  assert.equal(summary, cachedSummary);
  assert.equal(generations, 0);
});

test('Gemini API failures are reported as errors instead of successful fallback summaries', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'unit-test-key';
  const service = new AIService(async () => {
    throw new Error('simulated Gemini outage');
  });

  try {
    await assert.rejects(
      service.generateMovieSummary({
        movie: {
          id: 42,
          title: 'Example Movie',
          overview: 'A character faces a difficult choice.',
          releaseYear: 2020,
          genres: [{ name: 'Drama' }],
        },
        length: 'standard',
        isSpoilerFree: true,
      }),
      (error: unknown) =>
        error instanceof GeminiGenerationError &&
        error.message === 'Gemini could not generate the requested summary. Please try again.'
    );
  } finally {
    if (previousKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousKey;
    }
  }
});

test('missing Gemini configuration is reported instead of returning a fallback summary', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    await assert.rejects(
      new AIService().generateMovieSummary({
        movie: {
          id: 42,
          title: 'Example Movie',
          overview: 'A character faces a difficult choice.',
          releaseYear: 2020,
          genres: [],
        },
        length: 'storyline',
        isSpoilerFree: true,
      }),
      (error: unknown) =>
        error instanceof GeminiGenerationError &&
        error.statusCode === 503 &&
        error.message === 'Gemini API key is not configured.'
    );
  } finally {
    if (previousKey !== undefined) {
      process.env.GEMINI_API_KEY = previousKey;
    }
  }
});

test('a Gemini failure does not save a fallback to the summary cache', async () => {
  let saved = false;

  await assert.rejects(
    getOrGenerateSummary({
      request: {
        movieId: 42,
        length: 'detailed',
        isSpoilerFree: true,
        forceRegenerate: true,
      },
      readCache: async () => undefined,
      generate: async () => {
        throw new GeminiGenerationError('Gemini failed.');
      },
      save: async () => {
        saved = true;
      },
    }),
    GeminiGenerationError
  );

  assert.equal(saved, false);
});
