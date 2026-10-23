import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from './api.js';

test('summary requests preserve the selected mode, spoiler setting, and regeneration flag', async () => {
  const originalFetch = globalThis.fetch;
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let capturedBody: unknown;

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null },
  });
  globalThis.fetch = async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        summary: {
          id: 'summary-1',
          movieId: 42,
          movieTitle: 'Example Movie',
          length: 'storyline',
          isSpoilerFree: false,
          content: 'Fresh result.',
          keyThemes: [],
          recommendedFor: '',
          cinematicTone: '',
          createdAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    await api.generateSummary(42, 'storyline', false, true);
    assert.deepEqual(capturedBody, {
      movieId: 42,
      length: 'storyline',
      isSpoilerFree: false,
      forceRegenerate: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (storageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    } else {
      delete (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
    }
  }
});
