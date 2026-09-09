import { Router, Response } from 'express';
import { tmdb } from '../services/tmdb.js';
import { recommender } from '../services/recommender.js';
import { db } from '../db/database.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const moviesRouter = Router();

// Trending Movies
moviesRouter.get('/trending', async (req, res: Response): Promise<void> => {
  try {
    const movies = await tmdb.getTrending();
    res.json({ movies });
  } catch (err: any) {
    console.error('Error fetching trending movies:', err);
    res.status(500).json({ error: 'Failed to retrieve trending movies.' });
  }
});

// Popular Movies
moviesRouter.get('/popular', async (req, res: Response): Promise<void> => {
  try {
    const movies = await tmdb.getPopular();
    res.json({ movies });
  } catch (err: any) {
    console.error('Error fetching popular movies:', err);
    res.status(500).json({ error: 'Failed to retrieve popular movies.' });
  }
});

// Top Rated Movies
moviesRouter.get('/top-rated', async (req, res: Response): Promise<void> => {
  try {
    const movies = await tmdb.getTopRated();
    res.json({ movies });
  } catch (err: any) {
    console.error('Error fetching top rated movies:', err);
    res.status(500).json({ error: 'Failed to retrieve top rated movies.' });
  }
});

// Search Movies
moviesRouter.get('/search', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;

    if (!q.trim()) {
      res.json({ results: [], totalResults: 0, totalPages: 1 });
      return;
    }

    const data = await tmdb.searchMovies(q, page);

    // Track search history if authenticated
    if (req.user && page === 1) {
      await db.addHistory(
        req.user.id,
        'search',
        undefined,
        undefined,
        undefined,
        `Searched for "${q}" (${data.totalResults} results)`
      );
    }

    res.json(data);
  } catch (err: any) {
    console.error('Error searching movies:', err);
    res.status(500).json({ error: 'Failed to perform movie search.' });
  }
});

// Movie Details
moviesRouter.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid movie ID.' });
      return;
    }

    const movie = await tmdb.getMovieDetails(id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found.' });
      return;
    }

    // Track view in history if authenticated
    if (req.user) {
      await db.addHistory(
        req.user.id,
        'movie_view',
        movie.id,
        movie.title,
        movie.posterPath,
        `Viewed details for ${movie.title} (${movie.releaseYear})`
      );
    }

    // Check if user has favorited this movie
    let isFavorite = false;
    if (req.user) {
      isFavorite = await db.isFavorite(req.user.id, movie.id);
    }

    res.json({ movie, isFavorite });
  } catch (err: any) {
    console.error('Error fetching movie details:', err);
    res.status(500).json({ error: 'Failed to retrieve movie details.' });
  }
});

// Recommendations
moviesRouter.get('/:id/recommendations', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid movie ID.' });
      return;
    }

    const recommendations = await recommender.getRecommendationsForMovie(id, 10);

    // Track recommendation view if user is logged in
    if (req.user && recommendations.length > 0) {
      const sourceMovie = await tmdb.getMovieDetails(id);
      if (sourceMovie) {
        await db.addHistory(
          req.user.id,
          'recommendation_view',
          sourceMovie.id,
          sourceMovie.title,
          sourceMovie.posterPath,
          `Generated ${recommendations.length} content-based recommendations for ${sourceMovie.title}`
        );
      }
    }

    res.json({ recommendations });
  } catch (err: any) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});
