import React, { Component } from 'react';
import { t } from '../lib/i18n';
import { Star, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  movie: any;
  variant?: 'portrait' | 'wide';
}

export class MovieCard extends Component<MovieCardProps> {
  render() {
    const { movie, variant = 'portrait' } = this.props;
    if (variant === 'wide') {
      return (
        <Link to={`/movie/${movie.id}`} className="block relative aspect-square md:aspect-video rounded-xl overflow-hidden group shadow-[0_4px_30px_rgba(0,0,0,0.4)] border border-surface-high/30">
          <img src={movie.backdrop || movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6">
            <span className="text-primary-brand text-xs font-black uppercase tracking-widest mb-1">#{movie.rank || 1} {t('home_trending').toUpperCase()}</span>
            <h3 className="text-2xl md:text-3xl font-black text-white leading-none mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{movie.title.toUpperCase()}</h3>
            <div className="flex gap-3">
              {(() => {
                const lang = typeof window !== 'undefined' ? localStorage.getItem('flixrate_region_lang') || 'it-IT' : 'it-IT';
                const playLabel = lang === 'en-US' ? 'Play' : lang === 'es-ES' ? 'Reproducir' : 'Riproduci';
                return <button className="bg-primary-brand text-white px-6 py-2 rounded font-bold text-sm hover:scale-105 active:scale-95 transition-all">{playLabel}</button>;
              })()}
              <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded hover:bg-white/30 transition-all">+</button>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link to={`/movie/${movie.id}`} className="block group">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-transparent group-hover:border-primary-brand/50 transition-all shadow-xl">
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            {movie.rank && (
              <div className="absolute top-2 left-2 w-8 h-8 bg-surface-high/90 backdrop-blur rounded flex items-center justify-center font-bold text-primary-brand">
                {movie.rank}
              </div>
            )}
            <p className="font-bold text-sm text-white line-clamp-1">{movie.title}</p>
            <p className="text-[10px] text-primary-brand font-bold uppercase">{movie.genre}</p>
          </div>
        </div>
      </Link>
    );
  }
}

export class ReviewCard extends Component<{ review: any }> {
  render() {
    const { review } = this.props;
    return (
      <article className="bg-surface p-5 rounded-2xl border border-surface-high hover:border-primary-brand/30 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-high overflow-hidden flex items-center justify-center border border-white/10">
              {review.avatar ? (
                <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-white">{review.author[0]}</span>
              )}
            </div>
            <div>
              <h4 className="font-bold text-text-main leading-tight">{review.author}</h4>
              <div className="flex items-center gap-2">
                <div className="flex text-primary-brand">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={cn(i >= review.rating && "text-text-muted")} />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted font-bold">{review.date}</span>
              </div>
            </div>
          </div>
          <button className="text-text-muted hover:text-text-main"><MoreHorizontal size={20} /></button>
        </div>
        
        <h5 className="font-bold text-lg text-text-main mb-2">{review.title}</h5>
        <p className="text-sm text-text-muted leading-relaxed line-clamp-3 md:line-clamp-none">{review.content}</p>
        
        <div className="mt-6 flex items-center gap-6">
          <button className="flex items-center gap-2 text-text-muted hover:text-primary-brand transition-colors text-xs font-bold">
            <ThumbsUp size={16} /> {review.likes}
          </button>
          <button className="flex items-center gap-2 text-text-muted hover:text-primary-brand transition-colors text-xs font-bold">
            <ThumbsDown size={16} /> {review.dislikes}
          </button>
        </div>
      </article>
    );
  }
}

export class RatingSummary extends Component<{ rating: number, totalReviews: number }> {
  render() {
    const { rating, totalReviews } = this.props;
    const distributions = [
      { star: 5, percentage: 85 },
      { star: 4, percentage: 10 },
      { star: 3, percentage: 3 },
      { star: 2, percentage: 1 },
      { star: 1, percentage: 1 },
    ];

    return (
      <section className="bg-surface rounded-3xl p-8 flex flex-col md:flex-row items-center gap-12 border border-surface-high shadow-2xl">
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-baseline gap-1 text-primary-brand mb-2">
            <span className="text-6xl font-black tracking-tighter">{rating}</span>
            <span className="text-xl font-bold opacity-50">/5</span>
          </div>
          <div className="flex text-primary-brand mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
          </div>
          <p className="text-xs text-text-muted font-bold tracking-widest uppercase">{t('reviews_based_on', { count: totalReviews.toLocaleString() })}</p>
        </div>
        
        <div className="flex-1 w-full space-y-3">
          {distributions.map((d) => (
            <div key={d.star} className="flex items-center gap-4 group">
              <span className="w-4 text-right text-xs font-black text-text-muted group-hover:text-text-main transition-colors">{d.star}</span>
              <Star size={12} fill="currentColor" className="text-text-muted group-hover:text-primary-brand transition-colors" />
              <div className="flex-1 h-2 bg-surface-high rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${d.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary-brand rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
}
