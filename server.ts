import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth.js';
import { moviesRouter } from './server/routes/movies.js';
import { aiRouter } from './server/routes/ai.js';
import { userRouter } from './server/routes/user.js';
import { systemRouter } from './server/routes/system.js';

dotenv.config();



async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for mobile app and external connections
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/movies', moviesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/user', userRouter);
  app.use('/api/system', systemRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'MovieMind AI' });
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 MovieMind AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MovieMind AI server:', err);
});
