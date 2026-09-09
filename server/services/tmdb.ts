import { db } from '../db/database.js';

export interface TMDBMovieRaw {
  id: number;
  title: string;
  original_title?: string;
  tagline?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
  };
  keywords?: {
    keywords?: { id: number; name: string }[];
    results?: { id: number; name: string }[];
  };
  recommendations?: {
    results: any[];
  };
}

const TMDB_GENRES_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Rich curated movie dataset for demo / offline / instant fallback
export const CURATED_MOVIES: any[] = [
  {
    id: 157336,
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    releaseDate: '2014-11-05',
    releaseYear: 2014,
    voteAverage: 8.4,
    voteCount: 35120,
    runtime: 169,
    genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Sci-Fi' }],
    director: 'Christopher Nolan',
    cast: [
      { id: 10297, name: 'Matthew McConaughey', character: 'Joseph Cooper', profilePath: 'https://image.tmdb.org/t/p/w185/wDeL5dGv2UuC1qXgZfL92oK.jpg' },
      { id: 1813, name: 'Anne Hathaway', character: 'Dr. Amelia Brand', profilePath: 'https://image.tmdb.org/t/p/w185/tLelKoPNiyJCSEtQT81FGv4TL.jpg' },
      { id: 83002, name: 'Jessica Chastain', character: 'Murphy Cooper (Adult)', profilePath: 'https://image.tmdb.org/t/p/w185/vO16dM6tL4p4tWw9C2L6s.jpg' },
      { id: 3895, name: 'Michael Caine', character: 'Professor Brand', profilePath: 'https://image.tmdb.org/t/p/w185/bVvlZpL6p9R5.jpg' },
    ],
    keywords: ['wormhole', 'black hole', 'time dilation', 'space exploration', 'father daughter', 'relativity', 'astronaut', 'future'],
  },
  {
    id: 27205,
    title: 'Inception',
    tagline: 'Your mind is the scene of the crime.',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
    posterPath: 'https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2P1QiDKuh.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yUmCqP.jpg',
    releaseDate: '2010-07-15',
    releaseYear: 2010,
    voteAverage: 8.4,
    voteCount: 36240,
    runtime: 148,
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
    director: 'Christopher Nolan',
    cast: [
      { id: 6193, name: 'Leonardo DiCaprio', character: 'Dom Cobb', profilePath: 'https://image.tmdb.org/t/p/w185/wo2hJpn04vbtmh0B9utCFdsQhx5.jpg' },
      { id: 24045, name: 'Joseph Gordon-Levitt', character: 'Arthur', profilePath: 'https://image.tmdb.org/t/p/w185/4Dal8F1O0K1uY6Q1b.jpg' },
      { id: 27578, name: 'Elliot Page', character: 'Ariadne', profilePath: 'https://image.tmdb.org/t/p/w185/tp9w.jpg' },
      { id: 2524, name: 'Tom Hardy', character: 'Eames', profilePath: 'https://image.tmdb.org/t/p/w185/d87xih.jpg' },
    ],
    keywords: ['dream', 'subconscious', 'heist', 'mind-bending', 'architecture', 'espionage', 'reality', 'totem'],
  },
  {
    id: 693134,
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    posterPath: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0x2.jpg',
    releaseDate: '2024-02-27',
    releaseYear: 2024,
    voteAverage: 8.2,
    voteCount: 5410,
    runtime: 166,
    genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
    director: 'Denis Villeneuve',
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: 'https://image.tmdb.org/t/p/w185/BE2sdjpg.jpg' },
      { id: 505710, name: 'Zendaya', character: 'Chani', profilePath: 'https://image.tmdb.org/t/p/w185/4w3.jpg' },
      { id: 93318, name: 'Rebecca Ferguson', character: 'Lady Jessica', profilePath: 'https://image.tmdb.org/t/p/w185/w7f.jpg' },
      { id: 1373737, name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', profilePath: 'https://image.tmdb.org/t/p/w185/2gL8.jpg' },
    ],
    keywords: ['desert', 'messiah', 'spice', 'sandworm', 'prophecy', 'war', 'revenge', 'epic space'],
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    tagline: 'The world forever changes.',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II, examining the scientific breakthroughs, political backroom intrigue, and psychological toll of creating the ultimate weapon.',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/rLb2cw0iwO1eqjnn6t2r.jpg',
    releaseDate: '2023-07-19',
    releaseYear: 2023,
    voteAverage: 8.1,
    voteCount: 9100,
    runtime: 181,
    genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }],
    director: 'Christopher Nolan',
    cast: [
      { id: 2037, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profilePath: 'https://image.tmdb.org/t/p/w185/3.jpg' },
      { id: 505710, name: 'Emily Blunt', character: 'Katherine Oppenheimer', profilePath: 'https://image.tmdb.org/t/p/w185/4.jpg' },
      { id: 1892, name: 'Matt Damon', character: 'Leslie Groves', profilePath: 'https://image.tmdb.org/t/p/w185/5.jpg' },
      { id: 3223, name: 'Robert Downey Jr.', character: 'Lewis Strauss', profilePath: 'https://image.tmdb.org/t/p/w185/6.jpg' },
    ],
    keywords: ['atomic bomb', 'manhattan project', 'physics', 'quantum mechanics', 'politics', 'moral conflict', 'history'],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    tagline: 'Why So Serious?',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets. The partnership proves to be effective, but they soon find themselves prey to a reign of chaos unleashed by a rising criminal mastermind known to the terrified citizens of Gotham as the Joker.',
    posterPath: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    releaseDate: '2008-07-16',
    releaseYear: 2008,
    voteAverage: 8.5,
    voteCount: 32100,
    runtime: 152,
    genres: [{ id: 18, name: 'Drama' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }],
    director: 'Christopher Nolan',
    cast: [
      { id: 3894, name: 'Christian Bale', character: 'Bruce Wayne / Batman', profilePath: 'https://image.tmdb.org/t/p/w185/b7.jpg' },
      { id: 1810, name: 'Heath Ledger', character: 'Joker', profilePath: 'https://image.tmdb.org/t/p/w185/h8.jpg' },
      { id: 3895, name: 'Michael Caine', character: 'Alfred Pennyworth', profilePath: 'https://image.tmdb.org/t/p/w185/bVvlZpL6p9R5.jpg' },
      { id: 64, name: 'Gary Oldman', character: 'Jim Gordon', profilePath: 'https://image.tmdb.org/t/p/w185/g1.jpg' },
    ],
    keywords: ['superhero', 'anarchy', 'chaos', 'vigilante', 'gotham', 'joker', 'dual identity', 'crime thriller'],
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    tagline: 'There\'s still a page left.',
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\'s left of society into chaos. K\'s discovery leads him on a quest to find Rick Deckard, a former LAPD blade runner who has been missing for 30 years.',
    posterPath: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/sAtoMqDVhNDQBc3QioHQqV6Qx83.jpg',
    releaseDate: '2017-10-04',
    releaseYear: 2017,
    voteAverage: 8.0,
    voteCount: 13200,
    runtime: 164,
    genres: [{ id: 878, name: 'Sci-Fi' }, { id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
    director: 'Denis Villeneuve',
    cast: [
      { id: 30614, name: 'Ryan Gosling', character: 'Officer K', profilePath: 'https://image.tmdb.org/t/p/w185/gosling.jpg' },
      { id: 3, name: 'Harrison Ford', character: 'Rick Deckard', profilePath: 'https://image.tmdb.org/t/p/w185/ford.jpg' },
      { id: 1251347, name: 'Ana de Armas', character: 'Joi', profilePath: 'https://image.tmdb.org/t/p/w185/ana.jpg' },
      { id: 45417, name: 'Sylvia Hoeks', character: 'Luv', profilePath: 'https://image.tmdb.org/t/p/w185/sylvia.jpg' },
    ],
    keywords: ['cyberpunk', 'android', 'identity', 'future dystopia', 'neon', 'replicant', 'existential', 'detective'],
  },
  {
    id: 329865,
    title: 'Arrival',
    tagline: 'Why are they here?',
    overview: 'Taking place after alien crafts land around the world, an expert linguist is recruited by the military to determine whether they come in peace or are a threat.',
    posterPath: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/yIZ1xendyqKvY37DCWu551G0Us8.jpg',
    releaseDate: '2016-11-10',
    releaseYear: 2016,
    voteAverage: 7.6,
    voteCount: 17100,
    runtime: 116,
    genres: [{ id: 18, name: 'Drama' }, { id: 878, name: 'Sci-Fi' }, { id: 9648, name: 'Mystery' }],
    director: 'Denis Villeneuve',
    cast: [
      { id: 9273, name: 'Amy Adams', character: 'Louise Banks', profilePath: 'https://image.tmdb.org/t/p/w185/adams.jpg' },
      { id: 17604, name: 'Jeremy Renner', character: 'Ian Donnelly', profilePath: 'https://image.tmdb.org/t/p/w185/renner.jpg' },
      { id: 2975, name: 'Forest Whitaker', character: 'Colonel Weber', profilePath: 'https://image.tmdb.org/t/p/w185/whitaker.jpg' },
    ],
    keywords: ['alien first contact', 'linguistics', 'non-linear time', 'communication', 'spaceship', 'heptapod', 'philosophical'],
  },
  {
    id: 286217,
    title: 'The Martian',
    tagline: 'Bring Him Home',
    overview: 'During a manned mission to Mars, Astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew. But Watney has survived and finds himself stranded and alone on the hostile planet. With only meager supplies, he must draw upon his ingenuity, wit and spirit to subsist and find a way to signal to Earth that he is alive.',
    posterPath: 'https://image.tmdb.org/t/p/w500/5BHuvQ6p9kL09nkd8mQJqP5f60i.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/syTbK5g2k8jKqK6r9.jpg',
    releaseDate: '2015-09-30',
    releaseYear: 2015,
    voteAverage: 8.0,
    voteCount: 19800,
    runtime: 144,
    genres: [{ id: 18, name: 'Drama' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Sci-Fi' }],
    director: 'Ridley Scott',
    cast: [
      { id: 1892, name: 'Matt Damon', character: 'Mark Watney', profilePath: 'https://image.tmdb.org/t/p/w185/damon.jpg' },
      { id: 83002, name: 'Jessica Chastain', character: 'Melissa Lewis', profilePath: 'https://image.tmdb.org/t/p/w185/chastain.jpg' },
      { id: 10205, name: 'Kristen Wiig', character: 'Annie Montrose', profilePath: 'https://image.tmdb.org/t/p/w185/wiig.jpg' },
    ],
    keywords: ['mars', 'survival', 'botany', 'astronaut', 'nasa', 'space rescue', 'science', 'isolation'],
  },
  {
    id: 496243,
    title: 'Parasite',
    tagline: 'Act like you own the place.',
    overview: 'All unemployed, Ki-taek\'s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdBA8a0YTC6Ni.jpg',
    releaseDate: '2019-05-30',
    releaseYear: 2019,
    voteAverage: 8.5,
    voteCount: 17800,
    runtime: 132,
    genres: [{ id: 35, name: 'Comedy' }, { id: 53, name: 'Thriller' }, { id: 18, name: 'Drama' }],
    director: 'Bong Joon-ho',
    cast: [
      { id: 20738, name: 'Song Kang-ho', character: 'Kim Ki-taek', profilePath: 'https://image.tmdb.org/t/p/w185/song.jpg' },
      { id: 1099616, name: 'Lee Sun-kyun', character: 'Park Dong-ik', profilePath: 'https://image.tmdb.org/t/p/w185/lee.jpg' },
      { id: 1047644, name: 'Cho Yeo-jeong', character: 'Choi Yeon-gyo', profilePath: 'https://image.tmdb.org/t/p/w185/cho.jpg' },
    ],
    keywords: ['social satire', 'class divide', 'wealth disparity', 'deception', 'architecture', 'black comedy', 'south korea'],
  },
  {
    id: 550,
    title: 'Fight Club',
    tagline: 'Mischief. Mayhem. Soap.',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.',
    posterPath: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    releaseDate: '1999-10-15',
    releaseYear: 1999,
    voteAverage: 8.4,
    voteCount: 29000,
    runtime: 139,
    genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
    director: 'David Fincher',
    cast: [
      { id: 819, name: 'Edward Norton', character: 'The Narrator', profilePath: 'https://image.tmdb.org/t/p/w185/norton.jpg' },
      { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profilePath: 'https://image.tmdb.org/t/p/w185/pitt.jpg' },
      { id: 1283, name: 'Helena Bonham Carter', character: 'Marla Singer', profilePath: 'https://image.tmdb.org/t/p/w185/bonham.jpg' },
    ],
    keywords: ['insomnia', 'alter ego', 'anti-consumerism', 'underground club', 'psychological thriller', 'plot twist', 'cult classic'],
  },
  {
    id: 603,
    title: 'The Matrix',
    tagline: 'Welcome to the Real World.',
    overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
    posterPath: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/fNG7i7rqMErkcqhohV2a6JW1uTM.jpg',
    releaseDate: '1999-03-30',
    releaseYear: 1999,
    voteAverage: 8.2,
    voteCount: 25400,
    runtime: 136,
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }],
    director: 'Lana Wachowski, Lilly Wachowski',
    cast: [
      { id: 6384, name: 'Keanu Reeves', character: 'Neo / Thomas Anderson', profilePath: 'https://image.tmdb.org/t/p/w185/reeves.jpg' },
      { id: 2975, name: 'Laurence Fishburne', character: 'Morpheus', profilePath: 'https://image.tmdb.org/t/p/w185/fishburne.jpg' },
      { id: 530, name: 'Carrie-Anne Moss', character: 'Trinity', profilePath: 'https://image.tmdb.org/t/p/w185/moss.jpg' },
      { id: 1331, name: 'Hugo Weaving', character: 'Agent Smith', profilePath: 'https://image.tmdb.org/t/p/w185/weaving.jpg' },
    ],
    keywords: ['cyberpunk', 'simulated reality', 'virtual world', 'martial arts', 'chosen one', 'artificial intelligence', 'bullet time'],
  },
  {
    id: 244786,
    title: 'Whiplash',
    tagline: 'The road to greatness can take you to the edge.',
    overview: 'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.',
    posterPath: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/vNXdH9bIqE4z11gKq58j0sY6.jpg',
    releaseDate: '2014-10-10',
    releaseYear: 2014,
    voteAverage: 8.4,
    voteCount: 14900,
    runtime: 107,
    genres: [{ id: 18, name: 'Drama' }, { id: 10402, name: 'Music' }],
    director: 'Damien Chazelle',
    cast: [
      { id: 21911, name: 'Miles Teller', character: 'Andrew Neiman', profilePath: 'https://image.tmdb.org/t/p/w185/teller.jpg' },
      { id: 18973, name: 'J.K. Simmons', character: 'Terence Fletcher', profilePath: 'https://image.tmdb.org/t/p/w185/simmons.jpg' },
      { id: 138092, name: 'Paul Reiser', character: 'Jim Neiman', profilePath: 'https://image.tmdb.org/t/p/w185/reiser.jpg' },
    ],
    keywords: ['jazz', 'drummer', 'perfectionism', 'mentor student', 'obsession', 'music conservatory', 'intense drama'],
  },
  {
    id: 278,
    title: 'The Shawshank Redemption',
    tagline: 'Fear can hold you prisoner. Hope can set you free.',
    overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden. During his long stretch in prison, Dufresne comes to be admired by the other inmates -- including an older prisoner named Red -- for his integrity and unshakeable sense of hope.',
    posterPath: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    releaseDate: '1994-09-23',
    releaseYear: 1994,
    voteAverage: 8.7,
    voteCount: 27000,
    runtime: 142,
    genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
    director: 'Frank Darabont',
    cast: [
      { id: 504, name: 'Tim Robbins', character: 'Andy Dufresne', profilePath: 'https://image.tmdb.org/t/p/w185/robbins.jpg' },
      { id: 192, name: 'Morgan Freeman', character: 'Ellis Boyd "Red" Redding', profilePath: 'https://image.tmdb.org/t/p/w185/freeman.jpg' },
      { id: 4029, name: 'Bob Gunton', character: 'Warden Norton', profilePath: 'https://image.tmdb.org/t/p/w185/gunton.jpg' },
    ],
    keywords: ['prison', 'wrongful imprisonment', 'escape', 'friendship', 'hope', 'redemption', 'classic masterpiece'],
  },
  {
    id: 129,
    title: 'Spirited Away',
    tagline: 'Tunnel to the mysterious world.',
    overview: 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.',
    posterPath: 'https://image.tmdb.org/t/p/w500/393r8D26BhEcx70T0gGstbCGf8J.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7w6MaCpiElq2qR.jpg',
    releaseDate: '2001-07-20',
    releaseYear: 2001,
    voteAverage: 8.5,
    voteCount: 16500,
    runtime: 125,
    genres: [{ id: 16, name: 'Animation' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' }],
    director: 'Hayao Miyazaki',
    cast: [
      { id: 19588, name: 'Rumi Hiiragi', character: 'Chihiro Ogino (voice)', profilePath: 'https://image.tmdb.org/t/p/w185/hiiragi.jpg' },
      { id: 19589, name: 'Miyu Irino', character: 'Haku (voice)', profilePath: 'https://image.tmdb.org/t/p/w185/irino.jpg' },
      { id: 19590, name: 'Mari Natsuki', character: 'Yubaba / Zeniba (voice)', profilePath: 'https://image.tmdb.org/t/p/w185/natsuki.jpg' },
    ],
    keywords: ['studio ghibli', 'spirits', 'bathhouse', 'magic', 'coming of age', 'fantasy world', 'curse'],
  },
  {
    id: 157336,
    title: 'Gravity',
    tagline: 'Don\'t Let Go.',
    overview: 'Dr. Ryan Stone, a brilliant medical engineer on her first shuttle mission, and veteran astronaut Matt Kowalsky are on a spacewalk when disaster strikes. The shuttle is destroyed, leaving Stone and Kowalsky completely alone—tethered to nothing but each other and spiraling out into the blackness.',
    posterPath: 'https://image.tmdb.org/t/p/w500/4Q0OcWp8uO3Q3k3yLh.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/9r1.jpg',
    releaseDate: '2013-10-03',
    releaseYear: 2013,
    voteAverage: 7.4,
    voteCount: 15300,
    runtime: 91,
    genres: [{ id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }, { id: 18, name: 'Drama' }],
    director: 'Alfonso Cuarón',
    cast: [
      { id: 18277, name: 'Sandra Bullock', character: 'Dr. Ryan Stone', profilePath: 'https://image.tmdb.org/t/p/w185/bullock.jpg' },
      { id: 1461, name: 'George Clooney', character: 'Matt Kowalsky', profilePath: 'https://image.tmdb.org/t/p/w185/clooney.jpg' },
      { id: 59844, name: 'Ed Harris', character: 'Mission Control (voice)', profilePath: 'https://image.tmdb.org/t/p/w185/harris.jpg' },
    ],
    keywords: ['space debris', 'survival', 'astronaut', 'space station', 'earth orbit', 'tension', 'cinematography'],
  },
  {
    id: 98,
    title: 'Gladiator',
    tagline: 'A Hero Will Rise.',
    overview: 'In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into turmoil. Maximus Decimus Meridius, one of the Roman army\'s most capable generals, is betrayed and his family murdered by an ambitious prince. Captured and turned into a gladiator, Maximus arrives in Rome seeking vengeance.',
    posterPath: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
    releaseDate: '2000-05-01',
    releaseYear: 2000,
    voteAverage: 8.2,
    voteCount: 18100,
    runtime: 155,
    genres: [{ id: 28, name: 'Action' }, { id: 18, name: 'Drama' }, { id: 12, name: 'Adventure' }],
    director: 'Ridley Scott',
    cast: [
      { id: 934, name: 'Russell Crowe', character: 'Maximus Decimus Meridius', profilePath: 'https://image.tmdb.org/t/p/w185/crowe.jpg' },
      { id: 73421, name: 'Joaquin Phoenix', character: 'Commodus', profilePath: 'https://image.tmdb.org/t/p/w185/phoenix.jpg' },
      { id: 5309, name: 'Connie Nielsen', character: 'Lucilla', profilePath: 'https://image.tmdb.org/t/p/w185/nielsen.jpg' },
    ],
    keywords: ['ancient rome', 'colosseum', 'gladiator', 'revenge', 'empire', 'honor', 'sword and sandal'],
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    tagline: 'Just because you are a character doesn\'t mean you have character.',
    overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling, comedic crime caper. Their adventures unfurl in three stories that ingeniously trip back and forth in time.',
    posterPath: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    releaseDate: '1994-09-10',
    releaseYear: 1994,
    voteAverage: 8.5,
    voteCount: 27400,
    runtime: 154,
    genres: [{ id: 53, name: 'Thriller' }, { id: 80, name: 'Crime' }],
    director: 'Quentin Tarantino',
    cast: [
      { id: 8891, name: 'John Travolta', character: 'Vincent Vega', profilePath: 'https://image.tmdb.org/t/p/w185/travolta.jpg' },
      { id: 2231, name: 'Samuel L. Jackson', character: 'Jules Winnfield', profilePath: 'https://image.tmdb.org/t/p/w185/jackson.jpg' },
      { id: 139, name: 'Uma Thurman', character: 'Mia Wallace', profilePath: 'https://image.tmdb.org/t/p/w185/thurman.jpg' },
      { id: 62, name: 'Bruce Willis', character: 'Butch Coolidge', profilePath: 'https://image.tmdb.org/t/p/w185/willis.jpg' },
    ],
    keywords: ['non-linear', 'hitman', 'los angeles', 'dialogue-heavy', 'mobster', 'cult film', 'briefcase'],
  }
];

class TMDBService {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'MY_TMDB_API_KEY' && this.apiKey.trim().length > 5);
  }

  private formatMovie(raw: any): any {
    const year = raw.release_date ? parseInt(raw.release_date.split('-')[0], 10) : 0;
    
    // Extract genres
    let genres: { id: number; name: string }[] = [];
    if (Array.isArray(raw.genres) && raw.genres.length > 0) {
      genres = raw.genres;
    } else if (Array.isArray(raw.genre_ids)) {
      genres = raw.genre_ids.map((id: number) => ({
        id,
        name: TMDB_GENRES_MAP[id] || 'General',
      }));
    }

    // Extract director and cast
    let director: string | undefined = raw.director;
    let cast: any[] = raw.cast || [];
    let keywords: string[] = raw.keywords || [];

    if (raw.credits) {
      if (raw.credits.crew) {
        const dir = raw.credits.crew.find((c: any) => c.job === 'Director');
        if (dir) director = dir.name;
      }
      if (raw.credits.cast) {
        cast = raw.credits.cast.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `${this.imageBaseUrl}/w185${c.profile_path}` : null,
        }));
      }
    }

    if (raw.keywords) {
      const kwList = raw.keywords.keywords || raw.keywords.results || [];
      if (Array.isArray(kwList) && typeof kwList[0] === 'object') {
        keywords = kwList.map((k: any) => k.name);
      }
    }

    const posterPath = raw.poster_path
      ? (raw.poster_path.startsWith('http') ? raw.poster_path : `${this.imageBaseUrl}/w500${raw.poster_path}`)
      : (raw.posterPath || 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg');

    const backdropPath = raw.backdrop_path
      ? (raw.backdrop_path.startsWith('http') ? raw.backdrop_path : `${this.imageBaseUrl}/original${raw.backdrop_path}`)
      : (raw.backdropPath || 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg');

    return {
      id: raw.id,
      title: raw.title || raw.original_title || 'Untitled Movie',
      originalTitle: raw.original_title,
      tagline: raw.tagline || '',
      overview: raw.overview || 'No overview available for this title.',
      posterPath,
      backdropPath,
      releaseDate: raw.release_date || raw.releaseDate || '2024-01-01',
      releaseYear: year || raw.releaseYear || 2024,
      voteAverage: Number((raw.vote_average ?? raw.voteAverage ?? 7.5).toFixed(1)),
      voteCount: raw.vote_count ?? raw.voteCount ?? 1200,
      runtime: raw.runtime || 120,
      genres,
      director: director || 'Visionary Director',
      cast: cast.length > 0 ? cast : [
        { id: 1, name: 'Lead Actor', character: 'Protagonist', profilePath: null },
        { id: 2, name: 'Supporting Star', character: 'Co-lead', profilePath: null },
      ],
      keywords: keywords.length > 0 ? keywords : ['cinema', 'blockbuster', 'drama', 'journey'],
      budget: raw.budget,
      revenue: raw.revenue,
      status: raw.status || 'Released',
    };
  }

  private async fetchFromTMDB(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.hasApiKey()) {
      throw new Error('NO_API_KEY');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    // Support either query param API key or Read Access Token
    if (this.apiKey!.length > 40) {
      // V4 Bearer token
    } else {
      url.searchParams.set('api_key', this.apiKey!);
    }

    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.apiKey!.length > 40) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`TMDB API Error (${res.status}): ${errorText}`);
    }
    return res.json();
  }

  async getTrending(): Promise<any[]> {
    const cacheKey = 'trending_week';
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;

    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB('/trending/movie/week');
        const formatted = data.results.map((m: any) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('TMDB Trending fetch fallback:', err);
    }

    // Fallback
    return CURATED_MOVIES.slice(0, 10);
  }

  async getPopular(): Promise<any[]> {
    const cacheKey = 'popular_movies';
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;

    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB('/movie/popular');
        const formatted = data.results.map((m: any) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('TMDB Popular fetch fallback:', err);
    }

    return [...CURATED_MOVIES].reverse().slice(0, 10);
  }

  async getTopRated(): Promise<any[]> {
    const cacheKey = 'top_rated_movies';
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;

    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB('/movie/top_rated');
        const formatted = data.results.map((m: any) => this.formatMovie(m));
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('TMDB Top Rated fetch fallback:', err);
    }

    return [...CURATED_MOVIES].sort((a, b) => b.voteAverage - a.voteAverage).slice(0, 10);
  }

  async searchMovies(query: string, page: number = 1): Promise<{ results: any[]; totalResults: number; totalPages: number }> {
    const cleanQuery = (query || '').trim().toLowerCase();
    if (!cleanQuery) return { results: [], totalResults: 0, totalPages: 1 };

    try {
      if (this.hasApiKey()) {
        const data = await this.fetchFromTMDB('/search/movie', {
          query: cleanQuery,
          page: String(page),
          include_adult: 'false',
        });
        const results = data.results.map((m: any) => this.formatMovie(m));
        return {
          results,
          totalResults: data.total_results || results.length,
          totalPages: data.total_pages || 1,
        };
      }
    } catch (err) {
      console.warn('TMDB Search fetch fallback:', err);
    }

    // Local fuzzy search across curated movies
    const matched = CURATED_MOVIES.filter((m) => {
      const titleMatch = m.title.toLowerCase().includes(cleanQuery);
      const overviewMatch = m.overview.toLowerCase().includes(cleanQuery);
      const genreMatch = m.genres.some((g: any) => g.name.toLowerCase().includes(cleanQuery));
      const directorMatch = m.director?.toLowerCase().includes(cleanQuery);
      const castMatch = m.cast?.some((c: any) => c.name.toLowerCase().includes(cleanQuery));
      const keywordMatch = m.keywords?.some((k: string) => k.toLowerCase().includes(cleanQuery));
      return titleMatch || overviewMatch || genreMatch || directorMatch || castMatch || keywordMatch;
    });

    return {
      results: matched,
      totalResults: matched.length,
      totalPages: 1,
    };
  }

  async getMovieDetails(id: number): Promise<any | null> {
    const cacheKey = `movie_details_${id}`;
    const cached = await db.getCachedMovie(cacheKey);
    if (cached) return cached;

    try {
      if (this.hasApiKey()) {
        const raw = await this.fetchFromTMDB(`/movie/${id}`, {
          append_to_response: 'credits,keywords,recommendations,similar',
        });
        const formatted = this.formatMovie(raw);
        await db.setCachedMovie(cacheKey, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn(`TMDB details fetch fallback for id ${id}:`, err);
    }

    // Check curated
    const found = CURATED_MOVIES.find((m) => m.id === Number(id));
    if (found) return found;

    // If ID not found in curated, return first curated with modified ID or null
    return CURATED_MOVIES[0] || null;
  }
}

export const tmdb = new TMDBService();
