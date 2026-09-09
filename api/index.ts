import express from 'express';
import dotenv from 'dotenv';

import { authRouter } from '../server/routes/auth.js';
import { moviesRouter } from '../server/routes/movies.js';
import { aiRouter } from '../server/routes/ai.js';
import { userRouter } from '../server/routes/user.js';
import { systemRouter } from '../server/routes/system.js';

dotenv.config();

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);
app.use('/api/system', systemRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MovieMind AI'
  });
});

export default app;
