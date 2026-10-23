import assert from 'node:assert/strict';
import test from 'node:test';
import { isCurrentSummaryRequest } from './summary-request.js';

test('a response only applies to the latest request and matching selected mode', () => {
  const response = { length: 'detailed' as const, isSpoilerFree: false };

  assert.equal(
    isCurrentSummaryRequest(3, 3, 'detailed', false, response),
    true
  );
  assert.equal(
    isCurrentSummaryRequest(2, 3, 'detailed', false, response),
    false
  );
  assert.equal(
    isCurrentSummaryRequest(3, 3, 'quick', false, response),
    false
  );
  assert.equal(
    isCurrentSummaryRequest(3, 3, 'detailed', true, response),
    false
  );
});
