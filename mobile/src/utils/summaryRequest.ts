import { AISummary, SummaryLength } from '../types';

export function isCurrentSummaryRequest(
  requestId: number,
  activeRequestId: number,
  length: SummaryLength,
  isSpoilerFree: boolean,
  response: Pick<AISummary, 'length' | 'isSpoilerFree'>
): boolean {
  return (
    requestId === activeRequestId &&
    response.length === length &&
    response.isSpoilerFree === isSpoilerFree
  );
}
