import assert from 'node:assert/strict';
import test from 'node:test';
import app from './index.js';

test('Vercel entry exports an Express handler that serves API requests', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: 'ok',
      app: 'MovieMind AI',
    });

    const summaryResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/ai/summary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-id': 'vercel-test-request',
        },
        body: JSON.stringify({ movieId: 'invalid' }),
      }
    );
    assert.equal(summaryResponse.status, 400);
    assert.equal(
      summaryResponse.headers.get('x-request-id'),
      'vercel-test-request'
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
