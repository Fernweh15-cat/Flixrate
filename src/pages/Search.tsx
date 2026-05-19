import React, { Component } from 'react';
import { Film, MessageSquare, Search as SearchIcon, Send, Sparkles, Star } from 'lucide-react';
import { MovieCard } from '../components/Cards';
import { Movie, fetchPopularMovies, searchMovies, fetchMoviesByGenre } from '../lib/tmdb';
import { sendGeminiMessage, ChatMessage } from '../lib/gemini';
import { motion } from 'motion/react';
import { IMAGES } from '../constants';
import { t } from '../lib/i18n';

interface SearchState {
  tab: 'explore' | 'ai';
  query: string;
  movies: Movie[];
  loading: boolean;
  activeGenre: string;
  
  // AI Chat states
  chatInput: string;
  messages: ChatMessage[];
  aiLoading: boolean;
  recommendedMoviesMap: { [messageIndex: number]: Movie[] };
}

export default class Search extends Component<{}, SearchState> {
  private chatEndRef = React.createRef<HTMLDivElement>();
  private searchTimeout: number | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      tab: 'explore',
      query: '',
      movies: [],
      loading: true,
      activeGenre: '',
      
      // AI Chat
      chatInput: '',
      messages: [
        {
          role: 'model',
          text: t('ai_welcome')
        }
      ],
      aiLoading: false,
      recommendedMoviesMap: {}
    };
  }

  async componentDidMount() {
    await this.loadInitialMovies();
    this.scrollToBottom();
  }

  componentDidUpdate(_prevProps: {}, prevState: SearchState) {
    if (prevState.messages.length !== this.state.messages.length || this.state.aiLoading) {
      this.scrollToBottom();
    }
  }

  componentWillUnmount() {
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }
  }

  scrollToBottom = () => {
    this.chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  loadInitialMovies = async () => {
    this.setState({ loading: true });
    const popular = await fetchPopularMovies();
    this.setState({ movies: popular, loading: false });
  };

  handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    this.setState({ query, activeGenre: '', loading: true });

    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout);
    }

    if (query.trim() === '') {
      this.searchTimeout = window.setTimeout(async () => {
        await this.loadInitialMovies();
      }, 300);
      return;
    }

    this.searchTimeout = window.setTimeout(async () => {
      const results = await searchMovies(query);
      this.setState({ movies: results, loading: false });
    }, 300);
  };

  handleGenreClick = async (genre: string) => {
    if (this.state.activeGenre === genre) {
      // Toggle off
      this.setState({ activeGenre: '', query: '' });
      await this.loadInitialMovies();
      return;
    }

    this.setState({ activeGenre: genre, query: '', loading: true });
    // Trigger TMDB discover search with official genre filter
    const results = await fetchMoviesByGenre(genre);
    this.setState({ movies: results, loading: false });
  };

  clearSearch = async () => {
    this.setState({ query: '', activeGenre: '' });
    await this.loadInitialMovies();
  };

  // AI Chat Logic
  extractMovieTitles = (text: string): string[] => {
    const regex = /\[([^\]]+)\]/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const { chatInput, messages, aiLoading } = this.state;

    if (chatInput.trim() === '' || aiLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: chatInput };
    const updatedMessages = [...messages, userMessage];

    this.setState({
      messages: updatedMessages,
      chatInput: '',
      aiLoading: true
    });

    try {
      const responseText = await sendGeminiMessage(chatInput, messages);
      const aiMessage: ChatMessage = { role: 'model', text: responseText };
      const finalMessages = [...updatedMessages, aiMessage];
      const aiMessageIndex = finalMessages.length - 1;

      this.setState({
        messages: finalMessages,
        aiLoading: false
      });

      // Parse and search recommended movies in the background
      const titles = this.extractMovieTitles(responseText);
      if (titles.length > 0) {
        const fetchedMovies: any[] = [];
        for (const title of titles) {
          const searchResults = await searchMovies(title);
          if (searchResults.length > 0) {
            // Take the first best match
            fetchedMovies.push(searchResults[0]);
          }
        }
        
        if (fetchedMovies.length > 0) {
          this.setState(prevState => ({
            recommendedMoviesMap: {
              ...prevState.recommendedMoviesMap,
              [aiMessageIndex]: fetchedMovies
            }
          }));
        }
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      this.setState({
        messages: [
          ...updatedMessages,
          {
            role: 'model',
            text: t('ai_error')
          }
        ],
        aiLoading: false
      });
    }
  };

  render() {
    const { tab, query, movies, loading, activeGenre, chatInput, messages, aiLoading, recommendedMoviesMap } = this.state;
    const genres = [
      { key: 'Azione', label: t('genre_action') },
      { key: 'Avventura', label: t('genre_adventure') },
      { key: 'Fantascienza', label: t('genre_sci_fi') },
      { key: 'Fantasy', label: t('genre_fantasy') },
      { key: 'Thriller', label: t('genre_thriller') },
      { key: 'Horror', label: t('genre_horror') },
      { key: 'Commedia', label: t('genre_comedy') },
      { key: 'Drammatico', label: t('genre_drama') },
      { key: 'Romantico', label: t('genre_romance') },
      { key: 'Animazione', label: t('genre_animation') },
      { key: 'Mistero', label: t('genre_mystery') }
    ];

    return (
      <div className="pb-32 pt-20 max-w-6xl mx-auto flex flex-col min-h-screen">
        
        {/* Header di Sezione */}
        <div className="flex justify-between items-center mb-8 px-4 md:px-0">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{t('search_title')}</h1>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{t('search_subtitle')}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary-brand/10 border border-primary-brand/20 rounded-full text-primary-brand font-black text-[10px] uppercase tracking-widest">
            <Sparkles size={12} /> Hybrid Engine
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-high/30 p-1.5 rounded-3xl border border-surface-high/50 max-w-md mx-auto mb-8 w-full">
          <button 
            onClick={() => this.setState({ tab: 'explore' })}
            className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${tab === 'explore' ? 'bg-primary-brand text-white shadow-[0_0_20px_rgba(229,9,20,0.3)]' : 'text-text-muted hover:text-text-main'}`}
          >
            <Film size={16} /> {t('search_explore')}
          </button>
          <button 
            onClick={() => this.setState({ tab: 'ai' })}
            className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${tab === 'ai' ? 'bg-primary-brand text-white shadow-[0_0_20px_rgba(229,9,20,0.3)]' : 'text-text-muted hover:text-text-main'}`}
          >
            <MessageSquare size={16} /> {t('search_cineai')}
          </button>
        </div>

        {/* CONTENUTO TABS */}
        <div className="flex-1 flex flex-col">
          
          {/* TAB 1: ESPLORA */}
          {tab === 'explore' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-6 flex-1 flex flex-col"
            >
              {/* Barra di Ricerca Classica */}
              <div className="relative mb-4 px-4 md:px-0">
                <SearchIcon className="absolute left-8 md:left-5 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')} 
                  value={query}
                  onChange={this.handleSearchChange}
                  className="w-full bg-surface p-4 pl-14 pr-12 rounded-2xl border border-surface-high text-white font-bold placeholder:text-text-muted focus:outline-none focus:border-primary-brand/60 focus:ring-1 focus:ring-primary-brand/20 transition-all shadow-inner text-base"
                />
                {query && (
                  <button 
                    onClick={this.clearSearch}
                    className="absolute right-8 md:right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white font-bold text-xs bg-surface-high/50 hover:bg-surface-high px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {t('search_clear')}
                  </button>
                )}
              </div>

              {/* Filtri Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-4 md:px-0">
                {genres.map(g => (
                  <button
                    key={g.key}
                    onClick={() => this.handleGenreClick(g.key)}
                    className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest border transition-all shrink-0 cursor-pointer ${activeGenre === g.key ? 'bg-primary-brand border-primary-brand text-white shadow-lg' : 'bg-surface border-surface-high text-text-muted hover:text-white hover:border-text-muted'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Lista Risultati */}
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
                ) : movies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {movies.map((movie) => (
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
                    <span className="text-5xl">🕵️‍♂️</span>
                    <h3 className="text-xl font-bold text-white">{t('search_no_results')}</h3>
                    <p className="text-text-muted max-w-sm text-sm">{t('search_no_results_desc', { query: query || activeGenre })}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: CINE-AI */}
          {tab === 'ai' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex-1 flex flex-col bg-surface/50 border border-surface-high/30 rounded-3xl overflow-hidden h-[60vh] md:h-[65vh] shadow-2xl backdrop-blur-md mx-4 md:mx-0"
            >
              {/* Chat Header */}
              <div className="bg-surface border-b border-surface-high p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-brand/10 border border-primary-brand flex items-center justify-center text-primary-brand shadow-[0_0_15px_rgba(229,9,20,0.2)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight">Cine-AI Assistant</h3>
                  <p className="text-[10px] text-primary-brand font-black uppercase tracking-widest">
                    {aiLoading ? t('ai_writing') : t('ai_status')}
                  </p>
                </div>
              </div>

              {/* Chat scrollable area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const recMovies = recommendedMoviesMap[index];

                  return (
                    <div 
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-md leading-relaxed text-sm font-semibold border ${
                        isUser 
                          ? 'bg-surface-high border-surface-high/60 text-white rounded-tr-none' 
                          : 'bg-surface border-primary-brand/15 text-text-main rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                      }`}>
                        
                        {/* Message Text */}
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Extracted / Loaded Dynamic Movies */}
                        {!isUser && recMovies && recMovies.length > 0 && (
                          <div className="mt-4 border-t border-surface-high/40 pt-4 animate-fadeIn">
                            <p className="text-[10px] text-primary-brand font-black uppercase tracking-widest mb-3 flex items-center gap-1">
                              <Sparkles size={10} /> {t('ai_cards_found')}
                            </p>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 snap-x">
                              {recMovies.map((movie: any) => (
                                <div key={movie.id} className="min-w-[120px] max-w-[120px] snap-start hover:scale-105 transition-transform">
                                  <MovieCard movie={movie} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* AI Loading indicator */}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-primary-brand/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-brand animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-brand animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-brand animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs text-text-muted font-bold ml-1">{t('ai_searching')}</span>
                    </div>
                  </div>
                )}
                
                <div ref={this.chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={this.handleSendChat} className="bg-surface border-t border-surface-high p-4 flex gap-3">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => this.setState({ chatInput: e.target.value })}
                  placeholder={t('ai_input_placeholder')}
                  disabled={aiLoading}
                  className="flex-1 bg-background/50 border border-surface-high rounded-xl px-4 py-3 text-white font-semibold placeholder:text-text-muted focus:outline-none focus:border-primary-brand/50 disabled:opacity-50 text-sm"
                />
                <button 
                  type="submit"
                  disabled={chatInput.trim() === '' || aiLoading}
                  className="bg-primary-brand text-white p-3 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}

        </div>
      </div>
    );
  }
}
