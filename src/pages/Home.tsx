import React, { Component } from 'react';
import { Play, ChevronRight, Star, Film, TrendingUp } from 'lucide-react';
import { MOVIES } from '../constants';
import { MovieCard } from '../components/Cards';
import { motion } from 'motion/react';
import { fetchPopularMovies, fetchNewReleases, fetchTrendingMovies, fetchMovieDetails, getSafeWatchlist } from '../lib/tmdb';
import { Link } from 'react-router-dom';
import { t } from '../lib/i18n';

interface HomeState {
  featuredMovie: any | null;
  newReleases: any[];
  trendingMovies: any[];
  watchlist: any[];
  loading: boolean;
}

export default class Home extends Component<{}, HomeState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      featuredMovie: null,
      newReleases: [],
      trendingMovies: [],
      watchlist: [],
      loading: true
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const [popular, newReleases, trending, watchlist] = await Promise.all([
        fetchPopularMovies(),
        fetchNewReleases(),
        fetchTrendingMovies(),
        getSafeWatchlist()
      ]);

      let featuredMovie = popular.length > 0 ? popular[0] : null;

      if (featuredMovie) {
        try {
          const detailed = await fetchMovieDetails(featuredMovie.id);
          featuredMovie = detailed;
        } catch (e) {
          console.error('Error fetching details for featured movie:', e);
        }
      }

      this.setState({
        featuredMovie: featuredMovie || MOVIES[0],
        newReleases: newReleases.length > 0 ? newReleases.slice(0, 10) : MOVIES.slice(0, 5),
        trendingMovies: trending.length > 0 ? trending : MOVIES,
        watchlist,
        loading: false
      });
    } catch (err) {
      console.error('Error loading home page contents:', err);
      this.setState({
        featuredMovie: MOVIES[0],
        newReleases: MOVIES.slice(0, 5),
        trendingMovies: MOVIES,
        watchlist: getSafeWatchlist(),
        loading: false
      });
    }
  }

  render() {
    const { featuredMovie, newReleases, trendingMovies, watchlist, loading } = this.state;

    if (loading) {
      return (
        <div className="min-h-screen flex flex-col gap-12 pb-20 pt-20">
          {/* Skeleton Hero */}
          <div className="h-[60vh] md:h-[75vh] w-full bg-surface animate-pulse rounded-3xl -mx-margin-mobile md:-mx-margin-desktop flex items-end p-8">
            <div className="space-y-4 w-full max-w-xl">
              <div className="h-6 bg-surface-high rounded w-1/4"></div>
              <div className="h-12 bg-surface-high rounded w-3/4"></div>
              <div className="h-4 bg-surface-high rounded w-1/2"></div>
              <div className="h-16 bg-surface-high rounded w-full"></div>
            </div>
          </div>
          {/* Skeleton Grids */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 bg-surface animate-pulse rounded w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="aspect-[2/3] bg-surface animate-pulse rounded-2xl border border-surface-high/30"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const featured = featuredMovie || MOVIES[0];
    const trending = trendingMovies.length > 0 ? trendingMovies : MOVIES;

    return (
      <div className="flex flex-col gap-16 pb-32">
        
        {/* Hero Banner Section */}
        <section className="relative h-[75vh] md:h-[85vh] flex items-end overflow-hidden -mx-margin-mobile md:-mx-margin-desktop rounded-b-[40px] md:rounded-b-[60px] shadow-2xl border-b border-surface-high/20">
          <motion.div 
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.75 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={featured?.backdrop || featured?.poster} 
              alt={featured?.title} 
              className="w-full h-full object-cover object-top" 
            />
            {/* Ambient vignette and gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/10 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent z-10" />
          </motion.div>

          <div className="relative z-20 px-margin-mobile md:px-20 pb-16 w-full max-w-5xl">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-6"
            >
              {/* Tag / Category */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-brand/10 border border-primary-brand/30 rounded-full text-primary-brand font-black text-[10px] uppercase tracking-widest">
                🏆 {t('home_featured')}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter uppercase break-words drop-shadow-md">
                {featured?.title}
              </h1>
              
              {/* Meta Tags */}
              <div className="flex flex-wrap items-center gap-4 text-text-muted font-bold text-xs md:text-sm">
                <span className="flex items-center gap-1 text-white bg-surface-high/60 backdrop-blur px-2.5 py-1 rounded-lg border border-surface-high">
                  <Star size={14} fill="#fbbf24" className="text-yellow-500" /> 
                  {featured?.rating}/10
                </span>
                <span className="px-2.5 py-1 bg-surface-high/60 backdrop-blur rounded-lg border border-surface-high">
                  {featured?.year}
                </span>
                <span className="px-2.5 py-1 bg-surface-high/60 backdrop-blur rounded-lg border border-surface-high">
                  {featured?.genre}
                </span>
                {featured?.duration && (
                  <span className="px-2.5 py-1 bg-surface-high/60 backdrop-blur rounded-lg border border-surface-high">
                    {featured?.duration}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <p className="text-text-main/90 max-w-2xl text-base md:text-lg leading-relaxed line-clamp-3 md:line-clamp-4 bg-background/20 backdrop-blur-[2px] p-2 rounded-xl">
                {featured?.synopsis}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to={`/movie/${featured?.id}`} className="flex-1 sm:flex-initial">
                  <button className="w-full bg-primary-brand text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(229,9,20,0.5)] cursor-pointer">
                    <Play size={20} fill="currentColor" /> {t('home_view_details')}
                  </button>
                </Link>
                {featured?.trailerUrl && featured?.trailerUrl !== 'https://www.youtube.com' && (
                  <a 
                    href={featured?.trailerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial"
                  >
                    <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:border-white/40">
                      {t('home_watch_trailer')}
                    </button>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Dynamic New Releases Slider */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-margin-mobile md:px-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2">
                <Film size={24} className="text-primary-brand" />
                {t('home_new_releases')}
              </h2>
              <p className="text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">{t('home_new_releases_subtitle')}</p>
            </div>
            <Link to="/new">
              <button className="flex items-center gap-1 text-primary-brand font-black text-xs uppercase tracking-widest hover:underline cursor-pointer group">
                {t('home_see_all')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-5 no-scrollbar px-margin-mobile md:px-0 snap-x snap-mandatory pb-4">
            {newReleases.map((movie) => (
              <div key={movie.id} className="min-w-[150px] md:min-w-[210px] snap-start hover:scale-105 transition-all duration-300">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Trending Now Grid with wide card */}
        <section className="space-y-6 px-margin-mobile md:px-0">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase flex items-center gap-2">
                <TrendingUp size={24} className="text-emerald-500 animate-pulse" />
                {t('home_trending')}
              </h2>
              <p className="text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">{t('home_trending_subtitle')}</p>
            </div>
            <Link to="/trending">
              <button className="flex items-center gap-1 text-primary-brand font-black text-xs uppercase tracking-widest hover:underline cursor-pointer group">
                {t('home_see_all')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {/* The first movie is shown in a wide card */}
            <div className="col-span-2 row-span-1 md:row-span-2">
              <MovieCard movie={{ ...trending[0], rank: 1 }} variant="wide" />
            </div>
            {/* Other movies in standard format */}
            {trending.slice(1, 6).map((movie, idx) => (
              <div key={movie.id} className="transition-all duration-300 hover:scale-105">
                 <MovieCard movie={{ ...movie, rank: idx + 2 }} />
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: My Watchlist (dynamic section) */}
        {watchlist.length > 0 && (
          <section className="space-y-6 px-margin-mobile md:px-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic uppercase">
                🍿 {t('home_watchlist')}
              </h2>
              <p className="text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">{t('home_watchlist_subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {watchlist.slice(0, 5).map((movie) => (
                <div key={movie.id} className="transition-all duration-300 hover:scale-105">
                   <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }
}
