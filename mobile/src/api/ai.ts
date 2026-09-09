import { request } from './client';
import { AISummary, AudioSummary } from '../types';

export const aiApi = {
  async generateSummary(data: {
    movieId: number;
    length: 'quick' | 'standard' | 'detailed';
    isSpoilerFree: boolean;
    forceRegenerate?: boolean;
  }): Promise<{ summary: AISummary }> {
    return request<{ summary: AISummary }>('/api/ai/summary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateAudio(data: {
    summaryId: string;
    movieId: number;
    summaryText: string;
    voiceName?: string;
  }): Promise<{ audio: AudioSummary }> {
    return request<{ audio: AudioSummary }>('/api/ai/audio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
