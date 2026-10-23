import { SummaryLength } from '../types.js';

export function isCurrentSummaryRequest(
  requestId: number,
  activeRequestId: number,
  length: SummaryLength,
  isSpoilerFree: boolean,
  response: { length: SummaryLength; isSpoilerFree: boolean }
): boolean {
  return (
    requestId === activeRequestId &&
    response.length === length &&
    response.isSpoilerFree === isSpoilerFree
  );
}
