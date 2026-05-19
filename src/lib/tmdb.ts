import { MOVIES } from '../constants';

export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  genre: string;
  year: number;
  duration?: string;
  rating: number;
  synopsis?: string;
  trailerUrl?: string;
  cast?: Array<{
    name: string;
    role: string;
    avatar: string;
  }>;
  similar?: Movie[];
  rank?: number;
  isTrending?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export interface UserReview {
  id: string;
  movieId?: string;
  profileId: string;
  profileName?: string;
  profileAvatar?: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  date: string;
  likes: number;
  dislikes: number;
}

const getTMDBApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('flixrate_user_tmdb_key');
    if (userKey && userKey.trim() !== '') return userKey;
  }
  return import.meta.env.VITE_TMDB_API_KEY || '';
};

export const getRegionLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('flixrate_region_lang');
    if (saved) return saved;
  }
  return 'it-IT';
};

const TMDB_API_KEY = getTMDBApiKey();
const BASE_URL = 'https://api.themoviedb.org/3';

// Check if TMDB API is properly configured
const isConfigured = (): boolean => {
  return typeof TMDB_API_KEY === 'string' && 
         TMDB_API_KEY.trim() !== '' && 
         TMDB_API_KEY !== 'MY_TMDB_API_KEY';
};

// Map TMDB genre IDs to Italian labels
const mapGenreIds = (genreIds: number[]): string => {
  const genreMap: Record<number, string> = {
    28: 'Azione',
    12: 'Avventura',
    16: 'Animazione',
    35: 'Commedia',
    80: 'Crime',
    99: 'Documentario',
    18: 'Drammatico',
    10751: 'Famiglia',
    14: 'Fantasy',
    36: 'Storico',
    27: 'Horror',
    10402: 'Musica',
    9648: 'Mistero',
    10749: 'Romantico',
    878: 'Fantascienza',
    10770: 'Film TV',
    53: 'Thriller',
    10752: 'Guerra',
    37: 'Western'
  };
  
  if (!genreIds || genreIds.length === 0) return 'Cinema';
  return genreIds
    .map(id => genreMap[id] || 'Altro')
    .filter((value, index, self) => self.indexOf(value) === index && value !== 'Altro')
    .slice(0, 2)
    .join(', ') || 'Cinema';
};

// Map a single TMDB movie object to our Flixrate Movie interface
const mapTMDBMovie = (tmdbMovie: any): Movie => {
  const posterUrl = tmdbMovie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
    : tmdbMovie.backdrop_path
      ? `https://image.tmdb.org/t/p/w500${tmdbMovie.backdrop_path}`
      : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';

  const year = tmdbMovie.release_date 
    ? new Date(tmdbMovie.release_date).getFullYear() 
    : 2025;

  let genre = 'Cinema';
  if (tmdbMovie.genres && tmdbMovie.genres.length > 0) {
    genre = tmdbMovie.genres.map((g: any) => g.name).slice(0, 2).join(', ');
  } else if (tmdbMovie.genre_ids && tmdbMovie.genre_ids.length > 0) {
    genre = mapGenreIds(tmdbMovie.genre_ids);
  }

  return {
    id: String(tmdbMovie.id),
    title: tmdbMovie.title || tmdbMovie.name || 'Titolo Sconosciuto',
    rating: parseFloat((tmdbMovie.vote_average || 0).toFixed(1)),
    year: year,
    genre: genre,
    duration: tmdbMovie.runtime ? `${Math.floor(tmdbMovie.runtime / 60)}h ${tmdbMovie.runtime % 60}m` : undefined,
    poster: posterUrl,
    backdrop: tmdbMovie.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` 
      : posterUrl,
    synopsis: tmdbMovie.overview || 'Nessuna trama disponibile per questo film.',
    isTrending: false
  };
};

// Extensive mock database for fallback
const getFallbackTrailer = (id: string): string => {
  const trailers: Record<string, string> = {
    'eclipse-protocol': 'https://www.youtube.com/watch?v=n9DwoQ7HWvI',
    'shadow-strike': 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    'neon-drift': 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    'my-movie-1': 'https://www.youtube.com/watch?v=ol67qo3WhJk',
    'my-movie-2': 'https://www.youtube.com/watch?v=zSWdZAToXRw',
    'avatar': 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    'dark-knight': 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    'matrix': 'https://www.youtube.com/watch?v=m8e-FF8MsqU',
    'titanic': 'https://www.youtube.com/watch?v=CHekzSiZycY',
    'godfather': 'https://www.youtube.com/watch?v=sY1S34973zA',
    'spiderman-spiderverse': 'https://www.youtube.com/watch?v=g4HbzUK1cQ4'
  };
  return trailers[id] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
};

// Extensive mock database for fallback
const LOCAL_FALLBACK_MOVIES: Movie[] = [
  ...MOVIES.map(m => ({ ...m, trailerUrl: getFallbackTrailer(m.id) } as Movie)),
  {
    id: 'avatar',
    title: 'Avatar: La via dell\'acqua',
    rating: 7.8,
    year: 2022,
    genre: 'Fantascienza, Azione',
    poster: 'https://image.tmdb.org/t/p/w500/t6HI61X1WNYG07hOIuJkM3UN2oY.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/t6HI61X1WNYG07hOIuJkM3UN2oY.jpg',
    synopsis: 'Ambientato più di dieci anni dopo gli eventi del primo film, racconta la storia della famiglia Sully (Jake, Neytiri e i loro figli), delle battaglie che combattono per rimanere in vita e delle tragedie che affrontano.',
    duration: '3h 12m',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0'
  },
  {
    id: 'dark-knight',
    title: 'Il cavaliere oscuro',
    rating: 9.0,
    year: 2008,
    genre: 'Azione, Crime, Drammatico',
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tWGBbeCLUXmUJDzJUrS58F2p.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/qJ2tWGBbeCLUXmUJDzJUrS58F2p.jpg',
    synopsis: 'Batman alza la posta nella sua guerra contro il crimine con l\'aiuto del tenente Jim Gordon e del procuratore distrettuale Harvey Dent. Il trio si dimostra efficace, ma presto si trova in balia del caos scatenato da una mente criminale nota come Joker.',
    duration: '2h 32m',
    trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY'
  },
  {
    id: 'matrix',
    title: 'Matrix',
    rating: 8.7,
    year: 1999,
    genre: 'Fantascienza, Azione',
    poster: 'https://image.tmdb.org/t/p/w500/lh4aUD8jHG68db2367xnsZs4V8C.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/lh4aUD8jHG68db2367xnsZs4V8C.jpg',
    synopsis: 'Un programmatore di computer scopre che la realtà in cui vive è in realtà una simulazione creata dalle macchine per tenere sotto controllo gli esseri umani, e si unisce a un gruppo di ribelli guidati da Morpheus per liberarsi.',
    duration: '2h 16m',
    trailerUrl: 'https://www.youtube.com/watch?v=m8e-FF8MsqU'
  },
  {
    id: 'titanic',
    title: 'Titanic',
    rating: 7.9,
    year: 1997,
    genre: 'Drammatico, Romantico',
    poster: 'https://image.tmdb.org/t/p/w500/9ba88aD2r9B7X256p3gCrcL0FkE.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9ba88aD2r9B7X256p3gCrcL0FkE.jpg',
    synopsis: 'La tragica e romantica storia d\'amore tra Jack, un giovane artista squattrinato, e Rose, una ragazza dell\'alta società, a bordo del lussuoso transatlantico Titanic nel suo sfortunato viaggio inaugurale.',
    duration: '3h 14m',
    trailerUrl: 'https://www.youtube.com/watch?v=CHekzSiZycY'
  },
  {
    id: 'godfather',
    title: 'Il Padrino',
    rating: 9.2,
    year: 1972,
    genre: 'Crime, Drammatico',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj6UGV2V8CgwzAlsu7GPyjh.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/3bhkrj6UGV2V8CgwzAlsu7GPyjh.jpg',
    synopsis: 'La saga epica della famiglia Corleone, una delle più potenti dinastie mafiose di New York, guidata dal patriarca Don Vito Corleone, e la ascesa del figlio Michael come suo successore.',
    duration: '2h 55m',
    trailerUrl: 'https://www.youtube.com/watch?v=sY1S34973zA'
  },
  {
    id: 'spiderman-spiderverse',
    title: 'Spider-Man: Un nuovo universo',
    rating: 8.4,
    year: 2018,
    genre: 'Animazione, Azione, Fantasy',
    poster: 'https://image.tmdb.org/t/p/w500/iiJyh412vI2eKq4wX3kSrtn3LqZ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/iiJyh412vI2eKq4wX3kSrtn3LqZ.jpg',
    synopsis: 'Il giovane Miles Morales acquisisce superpoteri da ragno e deve unire le forze con Spider-Man provenienti da altri universi paralleli per combattere una minaccia interdimensionale.',
    duration: '1h 57m',
    trailerUrl: 'https://www.youtube.com/watch?v=g4HbzUK1cQ4'
  }
];

// Simple Cache layer for TMDB API lists to prevent parallel/consecutive page change spam
interface CacheEntry {
  data: any[];
  timestamp: number;
}
const apiCache: { [key: string]: CacheEntry } = {};
const CACHE_TTL = 3 * 60 * 1000; // 3 minuti di cache
const movieDetailsCache: { [key: string]: { data: Movie, timestamp: number } } = {};

// Fetch popular movies
export const fetchPopularMovies = async (): Promise<Movie[]> => {
  const cacheKey = 'popular_movies';
  const now = Date.now();
  if (apiCache[cacheKey] && (now - apiCache[cacheKey].timestamp < CACHE_TTL)) {
    return apiCache[cacheKey].data;
  }

  if (!isConfigured()) {
    console.log('TMDB API Key missing, returning local fallback movies.');
    return LOCAL_FALLBACK_MOVIES;
  }

  try {
    const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${getRegionLanguage()}&page=1`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    const mapped = data.results.map(mapTMDBMovie);
    apiCache[cacheKey] = { data: mapped, timestamp: now };
    return mapped;
  } catch (error) {
    console.error('Error fetching popular movies from TMDB, falling back:', error);
    return LOCAL_FALLBACK_MOVIES;
  }
};

// Search movies by query
export const searchMovies = async (query: string): Promise<Movie[]> => {
  if (!query || query.trim() === '') return [];

  if (!isConfigured()) {
    console.log('TMDB API Key missing, searching local fallback database.');
    const q = query.toLowerCase();
    return LOCAL_FALLBACK_MOVIES.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.genre.toLowerCase().includes(q) ||
      (m.synopsis && m.synopsis.toLowerCase().includes(q))
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=${getRegionLanguage()}&page=1&include_adult=false`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    return data.results.map(mapTMDBMovie);
  } catch (error) {
    console.error('Error searching movies on TMDB, falling back:', error);
    const q = query.toLowerCase();
    return LOCAL_FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q));
  }
};

// Fetch movie details
export const fetchMovieDetails = async (id: string | number): Promise<Movie> => {
  const cacheKey = `movie_details_${id}`;
  const now = Date.now();
  if (movieDetailsCache[cacheKey] && (now - movieDetailsCache[cacheKey].timestamp < CACHE_TTL)) {
    return movieDetailsCache[cacheKey].data;
  }

  const localMovie = LOCAL_FALLBACK_MOVIES.find(m => String(m.id) === String(id));
  const isNumericId = !isNaN(Number(id));

  if (!isConfigured() || !isNumericId) {
    if (localMovie) return localMovie;
    return LOCAL_FALLBACK_MOVIES[0];
  }

  try {
    const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=${getRegionLanguage()}&append_to_response=credits,similar,videos`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    
    const mapped = mapTMDBMovie(data);
    
    // Extract cast & crew if available
    let cast: Array<{ name: string; role: string; avatar: string }> = [];
    if (data.credits && data.credits.cast) {
      cast = data.credits.cast.slice(0, 8).map((actor: any) => ({
        name: actor.name,
        role: actor.character,
        avatar: actor.profile_path 
          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=185&auto=format&fit=crop'
      }));
    }

    // Extract similar movies
    let similar: Movie[] = [];
    if (data.similar && data.similar.results) {
      similar = data.similar.results.slice(0, 5).map(mapTMDBMovie);
    }

    // Extract trailer URL
    let trailerUrl = '';
    if (data.videos && data.videos.results) {
      const trailer = data.videos.results.find(
        (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
      ) || data.videos.results.find(
        (v: any) => v.site === 'YouTube'
      ) || data.videos.results[0];
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    const fullMovieDetails: Movie = {
      ...mapped,
      cast,
      similar,
      trailerUrl
    };

    movieDetailsCache[cacheKey] = { data: fullMovieDetails, timestamp: now };
    return fullMovieDetails;
  } catch (error) {
    console.error('Error fetching details from TMDB, returning local if exists:', error);
    if (localMovie) return localMovie;
    return LOCAL_FALLBACK_MOVIES[0];
  }
};

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'cinefilo-default',
    name: 'Cinefilo',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  }
];

export const getProfiles = (): UserProfile[] => {
  if (typeof window === 'undefined') return DEFAULT_PROFILES;
  const stored = localStorage.getItem('flixrate_profiles');
  if (!stored) {
    localStorage.setItem('flixrate_profiles', JSON.stringify(DEFAULT_PROFILES));
    return DEFAULT_PROFILES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_PROFILES;
  }
};

export const getActiveProfile = (): UserProfile => {
  const profiles = getProfiles();
  if (typeof window === 'undefined') return profiles[0];
  const activeId = localStorage.getItem('flixrate_active_profile');
  const active = profiles.find(p => p.id === activeId);
  if (active) return active;
  
  localStorage.setItem('flixrate_active_profile', profiles[0].id);
  return profiles[0];
};

export const setActiveProfile = (profileId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flixrate_active_profile', profileId);
};

export const createProfile = (name: string, avatar: string): UserProfile => {
  const profiles = getProfiles();
  const newProfile: UserProfile = {
    id: 'profile-' + Date.now(),
    name,
    avatar
  };
  profiles.push(newProfile);
  localStorage.setItem('flixrate_profiles', JSON.stringify(profiles));
  return newProfile;
};

export const deleteProfile = (profileId: string) => {
  let profiles = getProfiles();
  if (profiles.length <= 1) return;
  
  profiles = profiles.filter(p => p.id !== profileId);
  localStorage.setItem('flixrate_profiles', JSON.stringify(profiles));
  
  localStorage.removeItem(`watchlist_${profileId}`);
  localStorage.removeItem(`watched_${profileId}`);
  
  const activeProfile = getActiveProfile();
  if (activeProfile.id === profileId) {
    setActiveProfile(profiles[0].id);
  }
};

const migrateLegacyData = () => {
  if (typeof window === 'undefined') return;
  const legacyWatch = localStorage.getItem('watchlist');
  const legacyWatched = localStorage.getItem('watched');
  
  if (legacyWatch && !localStorage.getItem('watchlist_cinefilo-default')) {
    localStorage.setItem('watchlist_cinefilo-default', legacyWatch);
  }
  if (legacyWatched && !localStorage.getItem('watched_cinefilo-default')) {
    localStorage.setItem('watched_cinefilo-default', legacyWatched);
  }
};
migrateLegacyData();

// Helper to get verified, safe watchlist from localStorage (Profile-aware)
export const getSafeWatchlist = (): Movie[] => {
  if (typeof window === 'undefined') return [];
  const activeProfile = getActiveProfile();
  const stored = localStorage.getItem(`watchlist_${activeProfile.id}`);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((m: Movie) => m && typeof m === 'object' && m.id && m.title);
    }
  } catch (e) {
    console.error('Error parsing watchlist:', e);
  }
  return [];
};

// Helper to save to watchlist safely (Profile-aware)
export const saveWatchlist = (watchlist: Movie[]) => {
  if (typeof window === 'undefined') return;
  const activeProfile = getActiveProfile();
  localStorage.setItem(`watchlist_${activeProfile.id}`, JSON.stringify(watchlist));
};

// Helper to get verified, safe watched list from localStorage (Profile-aware)
export const getSafeWatched = (): Movie[] => {
  if (typeof window === 'undefined') return [];
  const activeProfile = getActiveProfile();
  const stored = localStorage.getItem(`watched_${activeProfile.id}`);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter((m: Movie) => m && typeof m === 'object' && m.id && m.title);
    }
  } catch (e) {
    console.error('Error parsing watched list:', e);
  }
  return [];
};

// Helper to save to watched list safely (Profile-aware)
export const saveWatched = (watched: Movie[]) => {
  if (typeof window === 'undefined') return;
  const activeProfile = getActiveProfile();
  localStorage.setItem(`watched_${activeProfile.id}`, JSON.stringify(watched));
};

// Fetch trending movies (day)
export const fetchTrendingMovies = async (): Promise<Movie[]> => {
  const cacheKey = 'trending_movies';
  const now = Date.now();
  if (apiCache[cacheKey] && (now - apiCache[cacheKey].timestamp < CACHE_TTL)) {
    return apiCache[cacheKey].data;
  }

  if (!isConfigured()) {
    console.log('TMDB API Key missing, returning local fallback movies.');
    return LOCAL_FALLBACK_MOVIES;
  }

  try {
    const response = await fetch(`${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=${getRegionLanguage()}&page=1`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    const mapped = data.results.map(mapTMDBMovie);
    apiCache[cacheKey] = { data: mapped, timestamp: now };
    return mapped;
  } catch (error) {
    console.error('Error fetching trending movies from TMDB, falling back:', error);
    return LOCAL_FALLBACK_MOVIES;
  }
};

// Fetch now playing movies (new releases)
export const fetchNewReleases = async (): Promise<Movie[]> => {
  const cacheKey = 'new_releases';
  const now = Date.now();
  if (apiCache[cacheKey] && (now - apiCache[cacheKey].timestamp < CACHE_TTL)) {
    return apiCache[cacheKey].data;
  }

  if (!isConfigured()) {
    console.log('TMDB API Key missing, returning local fallback movies.');
    return LOCAL_FALLBACK_MOVIES;
  }

  try {
    const response = await fetch(`${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=${getRegionLanguage()}&page=1`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    const mapped = data.results.map(mapTMDBMovie);
    apiCache[cacheKey] = { data: mapped, timestamp: now };
    return mapped;
  } catch (error) {
    console.error('Error fetching new releases from TMDB, falling back:', error);
    return LOCAL_FALLBACK_MOVIES;
  }
};

export const getSafeReviews = (movieId: string): UserReview[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`flixrate_global_reviews_${movieId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveReview = (movieId: string, rating: number, title: string, content: string): UserReview => {
  const activeProfile = getActiveProfile();
  const reviews = getSafeReviews(movieId);
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('it-IT', options);

  const newReview: UserReview = {
    id: 'review-' + Date.now(),
    movieId,
    profileId: activeProfile.id,
    profileName: activeProfile.name,
    profileAvatar: activeProfile.avatar,
    rating,
    title,
    content,
    date: formattedDate,
    likes: 0,
    dislikes: 0
  };

  reviews.unshift(newReview);
  localStorage.setItem(`flixrate_global_reviews_${movieId}`, JSON.stringify(reviews));
  return newReview;
};

export const deleteUserReview = (movieId: string, reviewId: string) => {
  const reviews = getSafeReviews(movieId);
  const filtered = reviews.filter(r => r.id !== reviewId);
  localStorage.setItem(`flixrate_global_reviews_${movieId}`, JSON.stringify(filtered));
};

export const updateUserReview = (movieId: string, reviewId: string, rating: number, title: string, content: string) => {
  const reviews = getSafeReviews(movieId);
  const idx = reviews.findIndex(r => r.id === reviewId);
  if (idx !== -1) {
    reviews[idx].rating = rating;
    reviews[idx].title = title;
    reviews[idx].content = content;
    localStorage.setItem(`flixrate_global_reviews_${movieId}`, JSON.stringify(reviews));
  }
};

export const voteUserReview = (movieId: string, reviewId: string, voteType: 'like' | 'dislike') => {
  const reviews = getSafeReviews(movieId);
  const idx = reviews.findIndex(r => r.id === reviewId);
  if (idx !== -1) {
    if (voteType === 'like') {
      reviews[idx].likes = (reviews[idx].likes || 0) + 1;
    } else {
      reviews[idx].dislikes = (reviews[idx].dislikes || 0) + 1;
    }
    localStorage.setItem(`flixrate_global_reviews_${movieId}`, JSON.stringify(reviews));
  }
};

// Fetch movies strictly filtered by TMDB official Genre IDs (discover endpoint)
export const fetchMoviesByGenre = async (genreName: string): Promise<Movie[]> => {
  const genreMapInverse: Record<string, number> = {
    'Azione': 28,
    'Avventura': 12,
    'Animazione': 16,
    'Commedia': 35,
    'Crime': 80,
    'Documentario': 99,
    'Drammatico': 18,
    'Famiglia': 10751,
    'Fantasy': 14,
    'Storico': 36,
    'Horror': 27,
    'Musica': 10402,
    'Mistero': 9648,
    'Romantico': 10749,
    'Fantascienza': 878,
    'Film TV': 10770,
    'Thriller': 53,
    'Guerra': 10752,
    'Western': 37
  };

  const genreId = genreMapInverse[genreName];
  if (!genreId) return [];

  const cacheKey = `genre_movies_${genreId}`;
  const now = Date.now();
  if (apiCache[cacheKey] && (now - apiCache[cacheKey].timestamp < CACHE_TTL)) {
    return apiCache[cacheKey].data;
  }

  if (!isConfigured()) {
    console.log('TMDB API Key missing, filtering local fallback movies.');
    return LOCAL_FALLBACK_MOVIES.filter(m => m.genre.toLowerCase().includes(genreName.toLowerCase()));
  }

  try {
    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=${getRegionLanguage()}&sort_by=popularity.desc&page=1`);
    if (!response.ok) throw new Error('API Request failed');
    const data = await response.json();
    const mapped = data.results.map(mapTMDBMovie);
    apiCache[cacheKey] = { data: mapped, timestamp: now };
    return mapped;
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreName}:`, error);
    return LOCAL_FALLBACK_MOVIES.filter(m => m.genre.toLowerCase().includes(genreName.toLowerCase()));
  }
};
