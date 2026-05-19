import React, { Component } from 'react';
import { 
  Palette, 
  Sparkles, 
  Key, 
  Globe, 
  Database, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldAlert,
  Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getProfiles } from '../lib/tmdb';
import { t } from '../lib/i18n';

interface SettingsState {
  // Theme Color
  activeColor: string;
  // AI Personality
  activePersonality: string;
  // API Keys
  tmdbKey: string;
  geminiKey: string;
  showTmdbKey: boolean;
  showGeminiKey: boolean;
  // Language
  activeLang: string;
  // Stats
  watchlistCount: number;
  watchedCount: number;
  reviewsCount: number;
  storageUsage: string;
  // UI States
  saveLoading: boolean;
  saveSuccess: boolean;
  showResetModal: boolean;
  cacheCleared: boolean;
  resetPassword: string;
  resetError: boolean;
}

const ACCENT_COLORS = [
  { name: 'Rosso Cinema', value: '#e50914', label: 'Netflix Style' },
  { name: 'Oro Stella', value: '#E5A93B', label: 'IMDb Classic' },
  { name: 'Verde Neon', value: '#1DB954', label: 'Spotify Vibe' },
  { name: 'Blu Magico', value: '#0084FF', label: 'Disney Tech' },
  { name: 'Rosa Pop', value: '#FF4B91', label: 'Barbie Bold' }
];

const PERSONALITIES = [
  {
    id: 'standard',
    name: 'Cinefilo Standard 🍿',
    desc: 'Caloroso, appassionato ed entusiasta. Il compagno perfetto per scoprire film ed esplorare trame.'
  },
  {
    id: 'critic',
    name: 'Critico Cinico 🧐',
    desc: 'Sarcastico, pungente e difficilissimo da accontentare. Trova difetti in ogni sceneggiatura in modo divertente!'
  },
  {
    id: 'nerd',
    name: 'Super Nerd 🤓',
    desc: 'Ossessionato da pellicole, formati IMAX, lenti anamorfiche, scene post-credits e dettagli tecnici oscuri.'
  },
  {
    id: 'poet',
    name: 'Poeta Romantico 🎭',
    desc: 'Descrive il cinema con toni poetici, concentrandosi sulla luce, la musica, la malinconia e le forti emozioni.'
  }
];

const LANGUAGES = [
  { code: 'it-IT', name: 'Italiano (it-IT)' },
  { code: 'en-US', name: 'English (en-US)' },
  { code: 'es-ES', name: 'Español (es-ES)' }
];

export default class SettingsPage extends Component<{}, SettingsState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeColor: localStorage.getItem('flixrate_accent_color') || '#e50914',
      activePersonality: localStorage.getItem('flixrate_ai_personality') || 'standard',
      tmdbKey: localStorage.getItem('flixrate_user_tmdb_key') || '',
      geminiKey: localStorage.getItem('flixrate_user_gemini_key') || '',
      showTmdbKey: false,
      showGeminiKey: false,
      activeLang: localStorage.getItem('flixrate_region_lang') || 'it-IT',
      watchlistCount: 0,
      watchedCount: 0,
      reviewsCount: 0,
      storageUsage: '0 KB',
      saveLoading: false,
      saveSuccess: false,
      showResetModal: false,
      cacheCleared: false,
      resetPassword: '',
      resetError: false
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.calculateStorageStats();
  }

  calculateStorageStats = () => {
    if (typeof window === 'undefined') return;
    
    // Count items
    let watchlistSize = 0;
    let watchedSize = 0;
    let reviewsSize = 0;
    
    const profiles = getProfiles();
    profiles.forEach(p => {
      const watch = localStorage.getItem(`watchlist_${p.id}`);
      if (watch) {
        try {
          watchlistSize += JSON.parse(watch).length;
        } catch(e){}
      }
      const seen = localStorage.getItem(`watched_${p.id}`);
      if (seen) {
        try {
          watchedSize += JSON.parse(seen).length;
        } catch(e){}
      }
    });

    // Count global reviews keys
    let totalReviews = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flixrate_global_reviews_')) {
        const rev = localStorage.getItem(key);
        if (rev) {
          try {
            totalReviews += JSON.parse(rev).length;
          } catch(e){}
        }
      }
    }

    // Estimate storage usage
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        totalBytes += (key.length + (val ? val.length : 0)) * 2; // UTF-16
      }
    }

    const kb = (totalBytes / 1024).toFixed(1);

    this.setState({
      watchlistCount: watchlistSize,
      watchedCount: watchedSize,
      reviewsCount: totalReviews,
      storageUsage: `${kb} KB`
    });
  };

  handleColorChange = (color: string) => {
    this.setState({ activeColor: color });
    localStorage.setItem('flixrate_accent_color', color);
    
    // Dynamically change primary brand css variable instantly!
    document.documentElement.style.setProperty('--color-primary-brand', color);
  };

  handlePersonalityChange = (id: string) => {
    this.setState({ activePersonality: id });
    localStorage.setItem('flixrate_ai_personality', id);
  };

  handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    this.setState({ activeLang: lang });
    localStorage.setItem('flixrate_region_lang', lang);
    window.location.reload();
  };

  handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    this.setState({ saveLoading: true, saveSuccess: false });
    
    const { tmdbKey, geminiKey } = this.state;
    localStorage.setItem('flixrate_user_tmdb_key', tmdbKey.trim());
    localStorage.setItem('flixrate_user_gemini_key', geminiKey.trim());

    setTimeout(() => {
      this.setState({ saveLoading: false, saveSuccess: true });
      // Trigger a page reload to apply API keys everywhere!
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, 800);
  };

  clearCache = () => {
    this.setState({ cacheCleared: true });
    // Simulate cache flushing
    setTimeout(() => {
      this.setState({ cacheCleared: false });
      this.calculateStorageStats();
    }, 2000);
  };

  handleFullReset = () => {
    const { resetPassword } = this.state;
    if (resetPassword.trim() !== 'flixrate') {
      this.setState({ resetError: true });
      return;
    }
    localStorage.clear();
    this.setState({ showResetModal: false });
    window.location.href = '/';
  };

  render() {
    const { 
      activeColor, 
      activePersonality, 
      tmdbKey, 
      geminiKey, 
      showTmdbKey, 
      showGeminiKey,
      activeLang,
      watchlistCount,
      watchedCount,
      reviewsCount,
      storageUsage,
      saveLoading,
      saveSuccess,
      showResetModal,
      cacheCleared,
      resetPassword,
      resetError
    } = this.state;

    return (
      <div className="pb-32 pt-20 max-w-4xl mx-auto min-h-screen px-4 md:px-0">
        
        {/* Header di Sezione */}
        <div className="mb-10 text-left">
          <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{t('settings_title')}</h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{t('settings_subtitle')}</p>
        </div>

        <div className="space-y-12">
          
          {/* SEZIONE 1: ACCENT COLOR */}
          <section className="bg-surface/40 border border-surface-high/30 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-high/40 pb-4">
              <Palette className="text-primary-brand w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{t('settings_design')}</h2>
                <p className="text-text-muted text-xs">{t('settings_design_desc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => this.handleColorChange(color.value)}
                  className={`relative p-4 bg-surface rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-3 text-center group hover:scale-[1.03] active:scale-[0.98] ${
                    activeColor === color.value 
                      ? 'border-primary-brand shadow-[0_0_20px_rgba(229,9,20,0.15)] bg-surface-high/10' 
                      : 'border-surface-high/60 hover:border-text-muted'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center relative shadow-inner"
                    style={{ backgroundColor: color.value }}
                  >
                    {activeColor === color.value && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="bg-black/60 w-6 h-6 rounded-full flex items-center justify-center text-white"
                      >
                        <Check size={14} strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-text-main line-clamp-1">
                      {color.value === '#e50914' ? t('color_red') :
                       color.value === '#E5A93B' ? t('color_gold') :
                       color.value === '#1DB954' ? t('color_green') :
                       color.value === '#0084FF' ? t('color_blue') :
                       color.value === '#FF4B91' ? t('color_pink') : color.name}
                    </p>
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest group-hover:text-primary-brand transition-colors mt-0.5">{color.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* SEZIONE 2: AI PERSONALITIES */}
          <section className="bg-surface/40 border border-surface-high/30 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-high/40 pb-4">
              <Sparkles className="text-primary-brand w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{t('settings_ai_personality')}</h2>
                <p className="text-text-muted text-xs">{t('settings_ai_personality_desc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERSONALITIES.map(pers => (
                <button
                  key={pers.id}
                  onClick={() => this.handlePersonalityChange(pers.id)}
                  className={`p-5 text-left bg-surface rounded-2xl border transition-all cursor-pointer flex gap-4 hover:scale-[1.01] active:scale-[0.99] group ${
                    activePersonality === pers.id 
                      ? 'border-primary-brand shadow-[0_0_20px_rgba(229,9,20,0.1)] bg-surface-high/10' 
                      : 'border-surface-high/60 hover:border-text-muted'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-sm text-text-main group-hover:text-primary-brand transition-colors">
                        {pers.id === 'standard' ? t('pers_standard_name') :
                         pers.id === 'critic' ? t('pers_critic_name') :
                         pers.id === 'nerd' ? t('pers_nerd_name') :
                         pers.id === 'poet' ? t('pers_poet_name') : pers.name}
                      </p>
                      {activePersonality === pers.id && (
                        <span className="w-5 h-5 rounded-full bg-primary-brand flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed font-medium">
                      {pers.id === 'standard' ? t('pers_standard_desc') :
                       pers.id === 'critic' ? t('pers_critic_desc') :
                       pers.id === 'nerd' ? t('pers_nerd_desc') :
                       pers.id === 'poet' ? t('pers_poet_desc') : pers.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* SEZIONE 3: API KEYS OVERRIDE */}
          <section className="bg-surface/40 border border-surface-high/30 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-high/40 pb-4">
              <Key className="text-primary-brand w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{t('settings_api_keys')}</h2>
                <p className="text-text-muted text-xs">{t('settings_api_keys_desc')}</p>
              </div>
            </div>

            <form onSubmit={this.handleSaveKeys} className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-xs font-black text-text-muted uppercase tracking-wider">{t('settings_api_keys_tmdb')}</label>
                <div className="relative">
                  <input
                    type={showTmdbKey ? 'text' : 'password'}
                    placeholder={t('settings_api_keys_tmdb') + '...'}
                    value={tmdbKey}
                    onChange={e => this.setState({ tmdbKey: e.target.value })}
                    className="w-full bg-surface p-3.5 pr-12 rounded-xl border border-surface-high text-white placeholder:text-text-muted focus:outline-none focus:border-primary-brand transition-all text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => this.setState({ showTmdbKey: !showTmdbKey })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showTmdbKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-black text-text-muted uppercase tracking-wider">{t('settings_api_keys_gemini')}</label>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder={t('settings_api_keys_gemini') + '...'}
                    value={geminiKey}
                    onChange={e => this.setState({ geminiKey: e.target.value })}
                    className="w-full bg-surface p-3.5 pr-12 rounded-xl border border-surface-high text-white placeholder:text-text-muted focus:outline-none focus:border-primary-brand transition-all text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => this.setState({ showGeminiKey: !showGeminiKey })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider max-w-md">
                  {t('settings_api_keys_note')}
                </span>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-3.5 rounded-xl bg-primary-brand text-white font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {saveLoading ? <Loader className="animate-spin w-4 h-4" /> : t('settings_api_keys_save')}
                </button>
              </div>
            </form>
          </section>

          {/* SEZIONE 4: LINGUA E REGIONE */}
          <section className="bg-surface/40 border border-surface-high/30 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-high/40 pb-4">
              <Globe className="text-primary-brand w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{t('settings_lang')}</h2>
                <p className="text-text-muted text-xs">{t('settings_lang_desc')}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-bold text-text-main text-sm">{t('settings_lang_metadata')}</p>
                <p className="text-xs text-text-muted">{t('settings_lang_metadata_desc')}</p>
              </div>
              <select
                value={activeLang}
                onChange={this.handleLangChange}
                className="w-full sm:w-64 bg-surface p-3.5 rounded-xl border border-surface-high text-white focus:outline-none focus:border-primary-brand transition-all text-sm font-bold cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-surface">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* SEZIONE 5: DATABASE MANAGER */}
          <section className="bg-surface/40 border border-surface-high/30 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-surface-high/40 pb-4">
              <Database className="text-primary-brand w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{t('settings_db_manager')}</h2>
                <p className="text-text-muted text-xs">{t('settings_db_manager_desc')}</p>
              </div>
            </div>

            {/* Storage Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface p-4 rounded-2xl border border-surface-high/40 text-center space-y-1">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">{t('settings_db_watchlist')}</span>
                <p className="text-2xl font-black text-white">{watchlistCount}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl border border-surface-high/40 text-center space-y-1">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">{t('settings_db_watched')}</span>
                <p className="text-2xl font-black text-white">{watchedCount}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl border border-surface-high/40 text-center space-y-1">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">{t('settings_db_reviews')}</span>
                <p className="text-2xl font-black text-white">{reviewsCount}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl border border-surface-high/40 text-center space-y-1">
                <span className="text-[10px] text-text-muted font-black uppercase tracking-wider">{t('settings_db_memory')}</span>
                <p className="text-2xl font-black text-primary-brand">{storageUsage}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={this.clearCache}
                disabled={cacheCleared}
                className="flex-1 py-4 px-6 bg-surface-high/40 hover:bg-surface-high/70 border border-surface-high text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <RotateCcw size={16} className={cacheCleared ? 'animate-spin' : ''} />
                {cacheCleared ? t('settings_db_clear_cache_loading') : t('settings_db_clear_cache')}
              </button>
              <button
                onClick={() => this.setState({ showResetModal: true, resetPassword: '', resetError: false })}
                className="flex-1 py-4 px-6 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-500 hover:text-red-400 font-black text-sm uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 size={16} /> {t('settings_db_reset')}
              </button>
            </div>
          </section>

        </div>

        {/* TOAST SALVATAGGIO DI SUCCESSO */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 right-10 bg-emerald-600 text-white font-bold px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-2"
            >
              <Check size={18} strokeWidth={3} />
              {t('settings_save_success')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* DOUBLE CONFIRMATION RESET MODAL */}
        <AnimatePresence>
          {showResetModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-surface-high rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
              >
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 mx-auto">
                  <ShieldAlert size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">{t('settings_reset_modal_title')}</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-medium">
                    {t('settings_reset_modal_desc')}
                  </p>
                </div>

                {/* Password field protection */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">{t('settings_reset_pwd_label')}</label>
                    <input
                      type="password"
                      placeholder={t('settings_reset_pwd_placeholder')}
                      value={resetPassword}
                      onChange={e => this.setState({ resetPassword: e.target.value, resetError: false })}
                      className={`w-full bg-surface-high/20 p-3 rounded-xl border text-white placeholder:text-text-muted focus:outline-none focus:border-red-600 transition-all text-xs font-mono ${
                        resetError ? 'border-red-500 animate-pulse' : 'border-surface-high'
                      }`}
                    />
                    {resetError ? (
                      <p className="text-[10px] text-red-500 font-bold mt-1">{t('settings_reset_pwd_error')}</p>
                    ) : (
                      <p className="text-[10px] text-text-muted mt-1">{t('settings_reset_pwd_hint', { pwd: 'flixrate' })}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => this.setState({ showResetModal: false })}
                    className="flex-1 py-3.5 bg-surface-high/50 hover:bg-surface-high text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    {t('settings_reset_cancel')}
                  </button>
                  <button
                    onClick={this.handleFullReset}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-red-900/20"
                  >
                    {t('settings_reset_confirm')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}
