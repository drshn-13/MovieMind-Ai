import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { tmdb } from '../services/tmdb.js';

export const userRouter = Router();

// Get all favorites for user
userRouter.get('/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const favorites = await db.getFavorites(req.user!.id);
    res.json({ favorites });
  } catch (err: any) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
});

// Add movie to favorites
userRouter.post('/favorites', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { movieId, movieTitle, moviePoster, movieYear, movieRating, movieGenres } = req.body;

    if (!movieId) {
      res.status(400).json({ error: 'movieId is required.' });
      return;
    }

    let title = movieTitle;
    let poster = moviePoster;
    let year = movieYear;
    let rating = movieRating;
    let genres = movieGenres || [];

    if (!title) {
      const details = await tmdb.getMovieDetails(Number(movieId));
      if (details) {
        title = details.title;
        poster = details.posterPath;
        year = details.releaseYear;
        rating = details.voteAverage;
        genres = details.genres.map((g: any) => g.name);
      }
    }

    const favorite = await db.addFavorite(
      req.user!.id,
      Number(movieId),
      title || 'Movie',
      poster || null,
      year || 2024,
      rating || 7.5,
      genres
    );

    res.status(201).json({ favorite, isFavorite: true });
  } catch (err: any) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add movie to favorites.' });
  }
});

// Remove movie from favorites
userRouter.delete('/favorites/:movieId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const movieId = parseInt(req.params.movieId, 10);
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'Invalid movie ID.' });
      return;
    }

    const removed = await db.removeFavorite(req.user!.id, movieId);
    res.json({ success: removed, isFavorite: false });
  } catch (err: any) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove movie from favorites.' });
  }
});

// Get user history
userRouter.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const history = await db.getHistory(req.user!.id);
    res.json({ history });
  } catch (err: any) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// Clear history
userRouter.delete('/history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await db.clearHistory(req.user!.id);
    res.json({ message: 'History successfully cleared.' });
  } catch (err: any) {
    console.error('Error clearing history:', err);
    res.status(500).json({ error: 'Failed to clear history.' });
  }
});

// Dashboard analytics & statistics
userRouter.get('/dashboard-stats', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await db.getDashboardStats(req.user!.id);
    res.json({ stats });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});
