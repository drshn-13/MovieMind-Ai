import { Router, Response } from 'express';
import { tmdb } from '../services/tmdb.js';
import { aiService } from '../services/gemini.js';

export const systemRouter = Router();

const startTime = Date.now();

systemRouter.get('/status', (req, res: Response): void => {
  res.json({
    status: 'online',
    appName: 'MovieMind AI',
    version: '1.0.0',
    hasGeminiKey: aiService.hasApiKey(),
    hasTmdbKey: tmdb.hasApiKey(),
    isDemoMode: !tmdb.hasApiKey() || !aiService.hasApiKey(),
    serverUptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});
