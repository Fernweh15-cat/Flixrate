import React, { Component } from 'react';
import { Film } from 'lucide-react';
import { MovieCard } from '../components/Cards';
import { fetchNewReleases } from '../lib/tmdb';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';

interface NewReleasesState {
  movies: any[];
  loading: boolean;
  sortBy: 'default' | 'release' | 'alpha';
}

export default class NewReleases extends Component<{}, NewReleasesState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      movies: [],
      loading: true,
      sortBy: 'default'
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const results = await fetchNewReleases();
      this.setState({ movies: results, loading: false });
    } catch (e) {
      console.error('Error fetching new releases:', e);
      this.setState({ loading: false });
    }
  }

  getSortedMovies = () => {
    const { movies, sortBy } = this.state;
    const sorted = [...movies];
    if (sortBy === 'release') {
      return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    if (sortBy === 'alpha') {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  };

  render() {
    const { loading, sortBy } = this.state;
    const sortedMovies = this.getSortedMovies();

    return (
      <div className="pb-32 pt-20 max-w-6xl mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">{t('new_releases_title')}</h1>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{t('new_releases_subtitle')}</p>
          </div>
          
          {/* Sorting controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider mr-1">{t('sort_label')}</span>
            <button
              onClick={() => this.setState({ sortBy: 'default' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'default' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-surface border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('sort_popularity')}
            </button>
            <button
              onClick={() => this.setState({ sortBy: 'release' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'release' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-surface border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('sort_release')}
            </button>
            <button
              onClick={() => this.setState({ sortBy: 'alpha' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'alpha' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-surface border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('sort_alpha')}
            </button>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="flex-1 px-4 md:px-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, idx) => (
                <div key={idx} className="aspect-[2/3] bg-surface rounded-2xl animate-pulse border border-surface-high/30 flex flex-col justify-end p-4">
                  <div className="h-4 bg-surface-high rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-surface-high rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sortedMovies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {sortedMovies.map((movie) => (
                <motion.div 
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-3xl border border-surface-high/30 flex flex-col items-center gap-4">
              <span className="text-5xl">🍿</span>
              <h3 className="text-xl font-bold text-white">{t('new_releases_empty')}</h3>
              <p className="text-text-muted max-w-sm text-sm">{t('new_releases_empty_desc')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
