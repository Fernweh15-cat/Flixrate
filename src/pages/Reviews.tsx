import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Star } from 'lucide-react';
import { MOVIES } from '../constants';
import { RatingSummary } from '../components/Cards';
import { withRouter, RouterProps } from '../lib/withRouter';
import { 
  fetchMovieDetails, 
  getSafeReviews, 
  saveReview, 
  deleteUserReview, 
  updateUserReview, 
  voteUserReview, 
  getActiveProfile, 
  UserProfile, 
  UserReview,
  Movie
} from '../lib/tmdb';
import { motion } from 'motion/react';
import { t } from '../lib/i18n';
 
interface ReviewsState {
  movie: Movie | null;
  loading: boolean;
  userReviews: UserReview[];
  showForm: boolean;
  rating: number;
  title: string;
  content: string;
  activeProfile: UserProfile | null;
  // Edit review state
  editingReviewId: string | null;
  editingRating: number;
  editingTitle: string;
  editingContent: string;
}

class Reviews extends Component<{ router: RouterProps }, ReviewsState> {
  constructor(props: { router: RouterProps }) {
    super(props);
    this.state = {
      movie: null,
      loading: true,
      userReviews: [],
      showForm: false,
      rating: 5,
      title: '',
      content: '',
      activeProfile: null,
      editingReviewId: null,
      editingRating: 5,
      editingTitle: '',
      editingContent: ''
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    const { id } = this.props.router.params;
    if (!id) return;

    try {
      const movie = await fetchMovieDetails(id);
      const userReviews = getSafeReviews(id);
      const activeProfile = getActiveProfile();
      this.setState({
        movie,
        userReviews,
        activeProfile,
        loading: false
      });
    } catch (e) {
      console.error('Error fetching movie in reviews:', e);
      const fallbackMovie = MOVIES.find(m => m.id === id) || MOVIES[2];
      const userReviews = getSafeReviews(id);
      const activeProfile = getActiveProfile();
      this.setState({
        movie: fallbackMovie,
        userReviews,
        activeProfile,
        loading: false
      });
    }
  }

  handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const { id } = this.props.router.params;
    const { rating, title, content } = this.state;
    if (!id || !content.trim()) return;

    const newReview = saveReview(id, rating, title.trim() || 'Recensione Personale', content.trim());
    this.setState(prevState => ({
      userReviews: [newReview, ...prevState.userReviews],
      showForm: false,
      rating: 5,
      title: '',
      content: ''
    }));
  };

  handleVoteReview = (reviewId: string, voteType: 'like' | 'dislike') => {
    const { id } = this.props.router.params;
    if (!id) return;
    
    voteUserReview(id, reviewId, voteType);
    
    this.setState(prevState => ({
      userReviews: prevState.userReviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            likes: voteType === 'like' ? (r.likes || 0) + 1 : r.likes || 0,
            dislikes: voteType === 'dislike' ? (r.dislikes || 0) + 1 : r.dislikes || 0
          };
        }
        return r;
      })
    }));
  };

  handleDeleteReview = (reviewId: string) => {
    const { id } = this.props.router.params;
    if (!id) return;
    
    if (window.confirm(t('reviews_delete_confirm'))) {
      deleteUserReview(id, reviewId);
      this.setState(prevState => ({
        userReviews: prevState.userReviews.filter(r => r.id !== reviewId)
      }));
    }
  };

  startEditReview = (review: UserReview) => {
    this.setState({
      editingReviewId: review.id,
      editingRating: review.rating,
      editingTitle: review.title,
      editingContent: review.content
    });
  };

  handleUpdateReview = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    const { id } = this.props.router.params;
    const { editingRating, editingTitle, editingContent } = this.state;
    if (!id || !editingContent.trim()) return;

    updateUserReview(id, reviewId, editingRating, editingTitle.trim() || 'Recensione Modificata', editingContent.trim());
    
    this.setState(prevState => ({
      userReviews: prevState.userReviews.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            rating: editingRating,
            title: editingTitle.trim() || 'Recensione Modificata',
            content: editingContent.trim()
          };
        }
        return r;
      }),
      editingReviewId: null
    }));
  };

  render() {
    const { 
      movie, 
      loading, 
      userReviews, 
      showForm, 
      rating, 
      title, 
      content,
      activeProfile,
      editingReviewId,
      editingRating,
      editingTitle,
      editingContent
    } = this.state;

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

    // Map user reviews defensively to ReviewCard compatible format
    const allReviews = userReviews.map(r => ({
      id: r ? r.id : 'rev-' + Math.random(),
      profileId: r ? r.profileId : '',
      author: (r && r.profileName) ? r.profileName : t('reviews_anonymous'),
      avatar: (r && r.profileAvatar) ? r.profileAvatar : '',
      rating: r ? Number(r.rating || 5) : 5,
      title: (r && r.title) ? r.title : t('reviews_title'),
      content: (r && r.content) ? r.content : '',
      date: (r && r.date) ? r.date : t('reviews_date_recent'),
      likes: r ? (r.likes || 0) : 0,
      dislikes: r ? (r.dislikes || 0) : 0
    }));

    // Compute average rating out of 5
    const avgRating = allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
      : (movie.rating ? movie.rating / 2 : 5);

    return (
      <div className="pb-32 pt-20 px-4 md:px-0">
        <header className="fixed top-0 left-0 w-full z-[60] bg-background/80 backdrop-blur-xl border-b border-surface-high flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/movie/${movie.id}`} className="text-text-muted hover:text-primary-brand transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('reviews_title')}</h1>
          </div>
          <button 
            onClick={() => this.setState({ showForm: !showForm })}
            className="bg-primary-brand text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary-brand/20"
          >
            <Edit3 size={14} /> {t('movie_write_review')}
          </button>
        </header>

        <div className="max-w-4xl mx-auto space-y-12 mt-6">
          {/* Movie Info Box */}
          <div className="flex gap-6 items-center bg-surface p-6 rounded-3xl border border-surface-high shadow-md">
            <div className="w-20 aspect-[2/3] rounded-2xl overflow-hidden border border-surface-high shadow-2xl shrink-0">
              <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-primary-brand font-black text-[10px] uppercase tracking-widest bg-primary-brand/10 px-2 py-0.5 rounded border border-primary-brand/20">{t('reviews_title')}</span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none mt-2 mb-1">{movie.title.toUpperCase()}</h2>
              <p className="text-text-muted font-bold text-xs uppercase tracking-widest">{movie.genre} • {movie.year} • {movie.duration}</p>
            </div>
          </div>

          {/* Rating Summary Card */}
          <RatingSummary rating={Number(avgRating.toFixed(1))} totalReviews={allReviews.length} />

          {/* Review Submission Form */}
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface p-6 rounded-3xl border border-primary-brand/35 shadow-xl space-y-6"
            >
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                {t('reviews_write_header')}
              </h3>
              
              <form onSubmit={this.handleSubmitReview} className="space-y-6">
                {/* Star rating selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{t('reviews_star_label')}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => this.setState({ rating: star })}
                        className="text-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Star size={36} fill={rating >= star ? 'currentColor' : 'none'} className="stroke-yellow-500 stroke-2" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{t('reviews_title_input')}</label>
                  <input
                    type="text"
                    placeholder={t('reviews_placeholder_title')}
                    value={title}
                    onChange={(e) => this.setState({ title: e.target.value })}
                    className="w-full bg-background border border-surface-high p-3.5 rounded-xl text-white font-bold focus:outline-none focus:border-primary-brand text-sm transition-all"
                  />
                </div>

                {/* Content Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{t('reviews_content_input')}</label>
                  <textarea
                    rows={4}
                    placeholder={t('reviews_placeholder_content')}
                    value={content}
                    onChange={(e) => this.setState({ content: e.target.value })}
                    className="w-full bg-background border border-surface-high p-3.5 rounded-xl text-white font-medium focus:outline-none focus:border-primary-brand focus:ring-1 focus:ring-primary-brand/20 transition-all text-sm leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="w-full bg-primary-brand text-white py-3.5 rounded-xl font-black uppercase tracking-wider hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-primary-brand/20"
                >
                  {t('reviews_publish_btn')}
                </button>
              </form>
            </motion.div>
          )}

          {/* Feedback list */}
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-surface-high pb-4">
              <h3 className="text-xl font-bold text-white italic tracking-tight uppercase">{t('reviews_list_title', { count: allReviews.length })}</h3>
            </div>

            {allReviews.length > 0 ? (
              <div className="space-y-6">
                {allReviews.map((review) => {
                  const isOwnReview = review.profileId === activeProfile?.id;
                  const isEditing = editingReviewId === review.id;

                  if (isEditing) {
                    return (
                      <motion.div 
                        key={review.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-surface p-5 rounded-2xl border border-primary-brand/50 space-y-4 shadow-xl"
                      >
                        <h4 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">{t('reviews_edit_header')}</h4>
                        <form onSubmit={(e) => this.handleUpdateReview(e, review.id)} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">{t('reviews_star_rating')}</label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => this.setState({ editingRating: star })}
                                  className="text-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Star size={24} fill={editingRating >= star ? 'currentColor' : 'none'} className="stroke-yellow-500 stroke-2" />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">{t('reviews_new_title')}</label>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => this.setState({ editingTitle: e.target.value })}
                              className="w-full bg-background border border-surface-high p-2.5 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-primary-brand transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-wider">{t('reviews_new_content')}</label>
                            <textarea
                              rows={3}
                              value={editingContent}
                              onChange={(e) => this.setState({ editingContent: e.target.value })}
                              className="w-full bg-background border border-surface-high p-2.5 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-primary-brand transition-all leading-relaxed"
                              required
                            />
                          </div>

                          <div className="flex gap-3 justify-end text-xs pt-2">
                            <button
                              type="button"
                              onClick={() => this.setState({ editingReviewId: null })}
                              className="px-4 py-2 border border-surface-high text-white rounded-xl font-bold hover:bg-white/5 cursor-pointer transition-colors text-[10px] uppercase tracking-wider"
                            >
                              {t('reviews_edit_cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={!editingContent.trim()}
                              className="px-4 py-2 bg-primary-brand text-white rounded-xl font-black uppercase hover:scale-105 transition-all cursor-pointer text-[10px] tracking-wider"
                            >
                              {t('reviews_edit_save')}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    );
                  }

                  return (
                    <article 
                      key={review.id}
                      className="bg-surface p-5 rounded-2xl border border-surface-high hover:border-primary-brand/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-high overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                              {review.avatar ? (
                                <img src={review.avatar} alt={review.author || t('reviews_anonymous')} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl font-black text-white">{(review.author && review.author.length > 0) ? review.author[0] : 'U'}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-text-main leading-tight flex items-center gap-2">
                                {review.author || t('reviews_anonymous')}
                                {isOwnReview && (
                                  <span className="text-[8px] bg-primary-brand/20 text-primary-brand px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-primary-brand/35">
                                    {t('reviews_user_tag')}
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-primary-brand">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-text-muted" : "text-yellow-500"} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-text-muted font-bold">{review.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons (Edit/Delete) if own review */}
                          {isOwnReview && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => this.startEditReview(review)}
                                className="text-text-muted hover:text-white text-[10px] font-black uppercase tracking-wider bg-background px-2.5 py-1 rounded-lg border border-surface-high hover:border-text-muted cursor-pointer transition-colors"
                              >
                                {t('movie_edit_review')}
                              </button>
                              <button 
                                onClick={() => this.handleDeleteReview(review.id)}
                                className="text-text-muted hover:text-primary-brand text-[10px] font-black uppercase tracking-wider bg-background px-2.5 py-1 rounded-lg border border-surface-high hover:border-primary-brand/30 cursor-pointer transition-colors"
                              >
                                {t('movie_delete_review')}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <h5 className="font-bold text-lg text-text-main mb-2">{review.title}</h5>
                        <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{review.content}</p>
                      </div>
                      
                      {/* Upvote and Downvote Buttons */}
                      <div className="mt-6 flex items-center gap-6 border-t border-surface-high/50 pt-4">
                        <button 
                          onClick={() => this.handleVoteReview(review.id, 'like')}
                          className="flex items-center gap-2 text-text-muted hover:text-emerald-500 hover:scale-105 active:scale-95 transition-all text-xs font-bold bg-background/50 hover:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-surface-high cursor-pointer"
                        >
                          👍 <span className="font-black text-text-main">{review.likes}</span>
                        </button>
                        <button 
                          onClick={() => this.handleVoteReview(review.id, 'dislike')}
                          className="flex items-center gap-2 text-text-muted hover:text-primary-brand hover:scale-105 active:scale-95 transition-all text-xs font-bold bg-background/50 hover:bg-primary-brand/10 px-3 py-1.5 rounded-full border border-surface-high cursor-pointer"
                        >
                          👎 <span className="font-black text-text-main">{review.dislikes}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface rounded-3xl border border-surface-high border-dashed flex flex-col items-center gap-4 mx-4 md:mx-0">
                <span className="text-5xl">🍿</span>
                <h3 className="text-xl font-bold text-white">{t('movie_no_reviews')}</h3>
                <p className="text-text-muted max-w-sm text-sm">{t('reviews_be_first')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Button for Mobile Devices */}
        <button 
          onClick={() => this.setState({ showForm: !showForm })}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary-brand text-white rounded-full shadow-[0_10px_30px_rgba(229,9,20,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[70] cursor-pointer"
        >
          <Edit3 size={24} />
        </button>
      </div>
    );
  }
}

export default withRouter(Reviews);
