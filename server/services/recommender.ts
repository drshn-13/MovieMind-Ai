import { tmdb, CURATED_MOVIES } from './tmdb.js';

interface MovieItem {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: number;
  voteAverage: number;
  voteCount: number;
  genres: { id: number; name: string }[];
  director?: string;
  cast?: { id: number; name: string; character: string }[];
  keywords?: string[];
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateJaccard(setA: Set<string | number>, setB: Set<string | number>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  setA.forEach((val) => {
    if (setB.has(val)) intersectionCount++;
  });
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function calculateCosineSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const freqA: Record<string, number> = {};
  const freqB: Record<string, number> = {};

  tokensA.forEach((t) => (freqA[t] = (freqA[t] || 0) + 1));
  tokensB.forEach((t) => (freqB[t] = (freqB[t] || 0) + 1));

  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  allWords.forEach((word) => {
    const a = freqA[word] || 0;
    const b = freqB[word] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RecommendationResult extends MovieItem {
  similarityScore: number;
  similarityReasons: string[];
  matchedFeatures: {
    genreMatch: number;
    themeMatch: number;
    crewMatch: number;
    semanticMatch: number;
  };
}

export class ContentRecommenderService {
  calculateSimilarity(target: MovieItem, candidate: MovieItem): {
    score: number;
    reasons: string[];
    features: { genreMatch: number; themeMatch: number; crewMatch: number; semanticMatch: number };
  } {
    if (target.id === candidate.id) {
      return {
        score: 100,
        reasons: ['Identical movie'],
        features: { genreMatch: 100, themeMatch: 100, crewMatch: 100, semanticMatch: 100 },
      };
    }

    const reasons: string[] = [];

    // 1. Genres
    const targetGenres = new Set(target.genres.map((g) => g.name.toLowerCase()));
    const candidateGenres = new Set(candidate.genres.map((g) => g.name.toLowerCase()));
    const genreJaccard = calculateJaccard(targetGenres, candidateGenres);
    const genreMatchPct = Math.round(genreJaccard * 100);

    const sharedGenres: string[] = [];
    targetGenres.forEach((g) => {
      if (candidateGenres.has(g)) sharedGenres.push(g as string);
    });
    if (sharedGenres.length > 0) {
      const formatted = sharedGenres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(' & ');
      reasons.push(`Shares genres: ${formatted}`);
    }

    // 2. Keywords / Themes
    const targetKeywords = new Set((target.keywords || []).map((k) => k.toLowerCase()));
    const candidateKeywords = new Set((candidate.keywords || []).map((k) => k.toLowerCase()));
    const keywordJaccard = calculateJaccard(targetKeywords, candidateKeywords);
    const themeMatchPct = Math.round(keywordJaccard * 100);

    const sharedKeywords: string[] = [];
    targetKeywords.forEach((k) => {
      if (candidateKeywords.has(k)) sharedKeywords.push(k as string);
    });
    if (sharedKeywords.length > 0) {
      reasons.push(`Thematic overlap: ${sharedKeywords.slice(0, 3).join(', ')}`);
    }

    // 3. Cast & Crew
    let crewScore = 0;
    if (target.director && candidate.director && target.director.toLowerCase() === candidate.director.toLowerCase()) {
      crewScore += 0.6;
      reasons.push(`Directed by ${target.director}`);
    }

    const targetCast = new Set((target.cast || []).map((c) => c.name.toLowerCase()));
    const candidateCast = new Set((candidate.cast || []).map((c) => c.name.toLowerCase()));
    const castJaccard = calculateJaccard(targetCast, candidateCast);
    crewScore += castJaccard * 0.4;
    const crewMatchPct = Math.round(Math.min(1, crewScore) * 100);

    const sharedActors: string[] = [];
    targetCast.forEach((actor) => {
      if (candidateCast.has(actor)) sharedActors.push(actor as string);
    });
    if (sharedActors.length > 0) {
      reasons.push(`Features ${sharedActors.slice(0, 2).map((a) => a.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(' & ')}`);
    }

    // 4. Semantic / Overview TF-IDF Cosine
    const targetTokens = tokenize(`${target.title} ${target.overview} ${(target.keywords || []).join(' ')}`);
    const candidateTokens = tokenize(`${candidate.title} ${candidate.overview} ${(candidate.keywords || []).join(' ')}`);
    const semanticCosine = calculateCosineSimilarity(targetTokens, candidateTokens);
    const semanticMatchPct = Math.round(semanticCosine * 100);

    if (semanticCosine > 0.35 && !reasons.some((r) => r.includes('Thematic'))) {
      reasons.push('High narrative and story atmosphere affinity');
    }

    // Weighted Formula
    // Base formula produces 0.0 - 1.0. We normalize into an intuitive 60% - 96% similarity score for related recommendations
    const rawWeighted = (
      genreJaccard * 0.35 +
      keywordJaccard * 0.25 +
      Math.min(1, crewScore) * 0.20 +
      semanticCosine * 0.20
    );

    // Apply scaling transformation so high relevance peaks between 80-95%
    let finalScore = Math.round(55 + rawWeighted * 42);
    if (sharedGenres.length >= 2) finalScore += 5;
    if (target.director && candidate.director && target.director === candidate.director) finalScore += 8;
    finalScore = Math.min(97, Math.max(50, finalScore));

    if (reasons.length === 0) {
      reasons.push(`Curated cinematic resonance with ${target.title}`);
    }

    return {
      score: finalScore,
      reasons,
      features: {
        genreMatch: genreMatchPct,
        themeMatch: themeMatchPct,
        crewMatch: crewMatchPct,
        semanticMatch: semanticMatchPct,
      },
    };
  }

  async getRecommendationsForMovie(movieId: number, limit: number = 8): Promise<RecommendationResult[]> {
    const targetMovie = await tmdb.getMovieDetails(movieId);
    if (!targetMovie) return [];

    // Pool of candidate movies
    const candidatePool: MovieItem[] = [];
    const seenIds = new Set<number>([movieId]);

    // 1. Check if TMDB has trending / popular
    try {
      const trending = await tmdb.getTrending();
      const popular = await tmdb.getPopular();
      const topRated = await tmdb.getTopRated();

      [...trending, ...popular, ...topRated, ...CURATED_MOVIES].forEach((m) => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          candidatePool.push(m);
        }
      });
    } catch {
      CURATED_MOVIES.forEach((m) => {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          candidatePool.push(m);
        }
      });
    }

    // Score all candidates
    const scoredList: RecommendationResult[] = [];
    for (const candidate of candidatePool) {
      const { score, reasons, features } = this.calculateSimilarity(targetMovie, candidate);
      scoredList.push({
        ...candidate,
        similarityScore: score,
        similarityReasons: reasons,
        matchedFeatures: features,
      });
    }

    // Sort descending by similarity score
    scoredList.sort((a, b) => b.similarityScore - a.similarityScore);

    return scoredList.slice(0, limit);
  }
}

export const recommender = new ContentRecommenderService();
