import assert from 'node:assert/strict';
import test from 'node:test';
import { isCurrentSummaryRequest } from './summaryRequest';

test('mobile summary responses apply only to the latest matching selection', () => {
  const response = {
    length: 'storyline' as const,
    isSpoilerFree: false,
  };

  assert.equal(
    isCurrentSummaryRequest(5, 5, 'storyline', false, response),
    true
  );
  assert.equal(
    isCurrentSummaryRequest(4, 5, 'storyline', false, response),
    false
  );
  assert.equal(
    isCurrentSummaryRequest(5, 5, 'quick', false, response),
    false
  );
  assert.equal(
    isCurrentSummaryRequest(5, 5, 'storyline', true, response),
    false
  );
});
