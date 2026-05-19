import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Star, Check } from 'lucide-react';
import { MOVIES } from '../constants';
import { motion } from 'motion/react';
import { MovieCard } from '../components/Cards';
import { withRouter, RouterProps } from '../lib/withRouter';
import { Movie, fetchMovieDetails, getSafeWatchlist, saveWatchlist, getSafeWatched, saveWatched } from '../lib/tmdb';
import { t } from '../lib/i18n';

interface MovieDetailsState {
  movie: Movie | null;
  loading: boolean;
  isInWatchlist: boolean;
  isInWatched: boolean;
}

class MovieDetails extends Component<{ router: RouterProps }, MovieDetailsState> {
  constructor(props: { router: RouterProps }) {
    super(props);
    this.state = {
      movie: null,
      loading: true,
      isInWatchlist: false,
      isInWatched: false
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    await this.loadMovieData();
  }

  async componentDidUpdate(prevProps: { router: RouterProps }) {
    if (prevProps.router.params.id !== this.props.router.params.id) {
      window.scrollTo(0, 0);
      await this.loadMovieData();
    }
  }

  loadMovieData = async () => {
    this.setState({ loading: true });
    const { id } = this.props.router.params;
    if (id) {
      const data = await fetchMovieDetails(id);
      
      const watchlist = getSafeWatchlist();
      const isInWatchlist = watchlist.some((m: Movie) => String(m.id) === String(data.id));

      const watched = getSafeWatched();
      const isInWatched = watched.some((m: Movie) => String(m.id) === String(data.id));

      this.setState({ movie: data, loading: false, isInWatchlist, isInWatched });
    }
  };

  toggleWatchlist = () => {
    const { movie, isInWatchlist } = this.state;
    if (!movie) return;

    let watchlist = getSafeWatchlist();

    if (isInWatchlist) {
      watchlist = watchlist.filter((m: Movie) => String(m.id) !== String(movie.id));
    } else {
      watchlist.push({
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
        genre: movie.genre,
        rating: movie.rating,
        year: movie.year,
        synopsis: movie.synopsis,
        backdrop: movie.backdrop
      });
    }

    saveWatchlist(watchlist);
    this.setState({ isInWatchlist: !isInWatchlist });
  };

  toggleWatched = () => {
    const { movie, isInWatched, isInWatchlist } = this.state;
    if (!movie) return;

    let watched = getSafeWatched();
    let watchlist = getSafeWatchlist();
    let newIsInWatchlist = isInWatchlist;

    if (isInWatched) {
      watched = watched.filter((m: Movie) => String(m.id) !== String(movie.id));
    } else {
      watched.push({
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
        genre: movie.genre,
        rating: movie.rating,
        year: movie.year,
        synopsis: movie.synopsis,
        backdrop: movie.backdrop
      });
      // Automatically remove from watchlist when marked as seen!
      if (isInWatchlist) {
        watchlist = watchlist.filter((m: Movie) => String(m.id) !== String(movie.id));
        newIsInWatchlist = false;
        saveWatchlist(watchlist);
      }
    }

    saveWatched(watched);
    this.setState({ isInWatched: !isInWatched, isInWatchlist: newIsInWatchlist });
  };

  render() {
    const { movie, loading } = this.state;

    if (loading || !movie) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-brand border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest animate-pulse">{t('home_loading')}</p>
          </div>
        </div>
      );
    }

    const defaultCast = [
      { name: 'John Doe', role: 'Mechanic', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyZ1PjCuf8wRAk4Ft4f68UneyiREj_wGPrb3e5sShWAX4jbU-b3jEA7Y5svuQekhyi2HNNLQhZjTLXqa2S2F6eWOBLzY76Az5KSlTjfSx99Ua5Bj10xDQQf6MPcvNl8wq3mRVT5Nay7KvP4WCF8-Q3fkwW45Sact3RoP_652RzURfaggjXieZQO3N4lhbYQx5LJoAD9xKoSbmWc599nR-VtxKpNwEYV--ig3oycGPxbMFW3cv09iz2ebmLuEn1PL4PFXrvoLaeTQ' },
      { name: 'Jane Smith', role: 'The Leader', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLBIy2P05tzhGmfq1uvP7d30XUcchfGg0hWP3zUY8Al1vN7MwRQTeP20dLWDGlZUkPq60bzGohakARmqMthpbg6yMy9ubT8LXCVpLJcMVaWu7VYwieCv8msb2L_MQcWMeOm-Nh6xnTBu0UVfJxgWAmEseqtPteKMlWMJ1-QmNLJAw02r3uiCgOnizW9jVIcOdzunHM_AV2s6d7sf4gM5KJGlnuRUo0ZHEi0fvsq_zdAbKiSXDh4an5kK_txIL-pSJd5b6GVuaOEg' },
      { name: 'Alan Turing', role: 'Director', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC43hpiXp2hYbTGSOW9NaWpGjSLhAFyhUeqzmwE5chZj-oWwlmL5nCHUIeTyKjVvBtE2wsT4hQZzYgrGdXs2PeTBFweh3BQibO7YpJFAgqk1fX3FfOuPUhfgJVfpCzX4DMXYGmC9GtrT4Zof2fnK_8QjFjbONSDswbTPvIZv9IGK1KqwuugYUNyyKzv4Esy2UxKt52Ua5lS7y1JWec5TbIWNpmau6uip0FZpaTc9xAk4uMJ1dACLag15HrT3TdWoMHZiFkZCPW2iw' },
    ];

    const cast = movie.cast && movie.cast.length > 0 ? movie.cast : defaultCast;
    const similarMovies = movie.similar && movie.similar.length > 0 ? movie.similar : MOVIES;

    return (
      <div className="pb-20">
        <header className="fixed top-0 left-0 w-full z-[60] flex items-center justify-between p-6 pointer-events-none">
          <Link to="/" className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white pointer-events-auto hover:bg-primary-brand transition-colors">
            <ArrowLeft size={20} />
          </Link>
        </header>

        <section className="relative h-[50vh] md:h-[45vh] lg:h-[40vh] flex items-end">
          <div className="absolute inset-0">
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>

          <div className="relative z-10 px-margin-mobile md:px-12 lg:px-20 pb-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-primary-brand font-black text-xs uppercase tracking-[0.3em] mb-4 block">Movie</span>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter mb-4">{movie.title.toUpperCase()}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-text-muted font-bold text-sm mb-8">
                <Link to={`/movie/${movie.id}/reviews`} className="flex items-center gap-1 text-white hover:text-primary-brand transition-colors">
                  <Star size={16} fill="currentColor" className="text-yellow-500" /> 
                  <span className="font-black text-xl">{movie.rating}</span>/10
                </Link>
                <span>{movie.year}</span>
                <span>{movie.duration}</span>
                <span className="px-2 py-0.5 border border-surface-high rounded-md">{movie.genre}</span>
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-4">
                <a 
                  href={movie.trailerUrl || 'https://www.youtube.com'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full md:w-auto md:min-w-[200px]"
                >
                  <button className="w-full bg-primary-brand text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    <Play size={20} fill="currentColor" /> {t('movie_watch_trailer_btn')}
                  </button>
                </a>
                <button 
                  onClick={this.toggleWatchlist}
                  className={`flex-1 md:flex-none md:min-w-[200px] py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    this.state.isInWatchlist 
                      ? 'bg-primary-brand text-white hover:bg-primary-brand/80 shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                      : 'bg-surface-high text-white hover:bg-white/10'
                  }`}
                >
                  {this.state.isInWatchlist ? <Check size={20} /> : <Plus size={20} />}
                  {this.state.isInWatchlist ? t('movie_remove_watchlist') : t('movie_add_watchlist')}
                </button>
                <button 
                  onClick={this.toggleWatched}
                  className={`flex-1 md:flex-none md:min-w-[200px] py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    this.state.isInWatched 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-surface-high text-white hover:bg-white/10'
                  }`}
                >
                  {this.state.isInWatched ? <Check size={20} /> : <Star size={20} />}
                  {this.state.isInWatched ? t('movie_mark_unwatched') : t('movie_mark_watched')}
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-16 space-y-12 px-margin-mobile md:px-12 lg:px-20">
          <div className="max-w-4xl">
            <p className="text-lg text-text-main/80 leading-relaxed font-medium">
              {movie.synopsis || "In a dystopian future where sound is strictly monitored by an authoritarian regime, a young mechanic discovers an ancient device that can broadcast forgotten frequencies. As she delves deeper into its origins, she unwittingly becomes the center of a silent revolution."}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-3xl font-black text-white italic tracking-tighter">{t('movie_cast')}</h2>
              <button className="text-primary-brand text-xs font-black uppercase tracking-widest hover:underline">{t('home_see_all')}</button>
            </div>
            <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4">
              {cast.map((person) => (
                <div key={person.name} className="flex flex-col items-center gap-3 shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-surface-high hover:border-primary-brand transition-colors pointer-events-auto cursor-pointer">
                    <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm text-text-main leading-tight">{person.name}</p>
                    <p className="text-[10px] text-text-muted font-black uppercase">{person.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">{t('movie_similar')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarMovies.map((m: Movie, idx: number) => (
                <MovieCard key={m.id + idx} movie={m} />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default withRouter(MovieDetails);
