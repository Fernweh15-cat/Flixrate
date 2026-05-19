import React, { Component } from 'react';
import { Settings, LogOut, ChevronRight, Star, History } from 'lucide-react';
import { IMAGES } from '../constants';
import { MovieCard } from '../components/Cards';
import { motion } from 'motion/react';
import { 
  getSafeWatchlist, 
  getSafeWatched, 
  getProfiles, 
  getActiveProfile, 
  setActiveProfile, 
  createProfile, 
  deleteProfile,
  UserProfile 
} from '../lib/tmdb';
import { t } from '../lib/i18n';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop', // Default Blue
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop', // Premium Red
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', // Sunset Orange
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', // Violet Star
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=150&auto=format&fit=crop'  // Cinema Teal
];

interface ProfileState {
  watchlist: any[];
  watched: any[];
  sortBy: 'default' | 'release' | 'alpha';
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  showAddForm: boolean;
  newProfileName: string;
  selectedAvatar: string;
}

export default class Profile extends Component<{}, ProfileState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      watchlist: [],
      watched: [],
      sortBy: 'default',
      profiles: [],
      activeProfile: null,
      showAddForm: false,
      newProfileName: '',
      selectedAvatar: PRESET_AVATARS[0]
    };
  }

  componentDidMount() {
    const watchlist = getSafeWatchlist();
    const watched = getSafeWatched();
    const profiles = getProfiles();
    const activeProfile = getActiveProfile();
    this.setState({ 
      watchlist, 
      watched,
      profiles,
      activeProfile,
      selectedAvatar: PRESET_AVATARS[0]
    });
  }

  getSortedList = (list: any[]) => {
    const { sortBy } = this.state;
    const sorted = [...list];
    if (sortBy === 'release') {
      return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    if (sortBy === 'alpha') {
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted; // default order (added order)
  };

  handleSwitchProfile = (id: string) => {
    setActiveProfile(id);
    window.location.reload();
  };

  handleSaveProfile = () => {
    const { newProfileName, selectedAvatar } = this.state;
    if (!newProfileName.trim()) return;
    const newProfile = createProfile(newProfileName.trim(), selectedAvatar);
    setActiveProfile(newProfile.id);
    window.location.reload();
  };

  handleDeleteProfile = (id: string) => {
    if (window.confirm(t('profile_delete_confirm'))) {
      deleteProfile(id);
      window.location.reload();
    }
  };

  render() {
    const { 
      watchlist, 
      watched, 
      sortBy, 
      profiles, 
      activeProfile, 
      showAddForm, 
      newProfileName, 
      selectedAvatar 
    } = this.state;

    const stats = [
      { label: t('profile_watchlist_tab'), value: watchlist.length, icon: '🍿' },
      { label: t('profile_watched_tab'), value: watched.length, icon: '🎬' },
    ];

    const recentActivity = [
      { type: t('profile_watched_tab'), title: 'The Red Door', rating: 4.5, poster: IMAGES.SIMILAR_1 },
      { type: t('profile_watchlist_tab'), title: 'Void Geometric', genre: 'Sci-Fi', poster: IMAGES.DUNE_DRIFTER },
    ];

    const sortedWatchlist = this.getSortedList(watchlist);
    const sortedWatched = this.getSortedList(watched);

    return (
      <div className="pb-32 pt-20 max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-brand shadow-[0_0_40px_rgba(229,9,20,0.4)]">
              <img src={activeProfile?.avatar || IMAGES.USER_PORTRAIT} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary-brand text-white p-2 rounded-full border-4 border-background">
              <Star size={16} fill="white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">
            {activeProfile?.name || t('profile_default_user_name')}
          </h1>
          <p className="text-primary-brand font-black text-xs uppercase tracking-[0.4em]">{t('profile_premium_member')}</p>
        </header>

        {/* Profiles Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-4 md:px-0">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                {t('profile_user_profiles')}
              </h2>
              <p className="text-xs text-text-muted mt-1">{t('profile_manage_desc')}</p>
            </div>
            <button 
              onClick={() => this.setState({ showAddForm: !showAddForm })}
              className="bg-primary-brand text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              {showAddForm ? t('profile_new_profile_cancel') : t('profile_create_user')}
            </button>
          </div>

          {/* Add Profile Form */}
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface p-6 rounded-3xl border border-primary-brand/35 shadow-xl space-y-6 max-w-xl mx-auto"
            >
              <h3 className="text-lg font-black text-white uppercase tracking-wider text-center">{t('profile_new_profile_title')}</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('profile_new_profile_name')}</label>
                <input 
                  type="text"
                  placeholder={t('profile_new_profile_placeholder')}
                  value={newProfileName}
                  onChange={(e) => this.setState({ newProfileName: e.target.value })}
                  className="w-full bg-background border border-surface-high p-3.5 rounded-xl text-white font-bold focus:outline-none focus:border-primary-brand/60 focus:ring-1 focus:ring-primary-brand/20 transition-all text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{t('profile_new_profile_avatar')}</label>
                <div className="grid grid-cols-5 gap-3">
                  {PRESET_AVATARS.map((avatarUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => this.setState({ selectedAvatar: avatarUrl })}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all cursor-pointer hover:scale-105 ${selectedAvatar === avatarUrl ? 'border-primary-brand shadow-lg shadow-primary-brand/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={avatarUrl} alt={`Preset Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={this.handleSaveProfile}
                disabled={!newProfileName.trim()}
                className="w-full bg-primary-brand text-white py-3.5 rounded-xl font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-primary-brand/20"
              >
                {t('profile_new_profile_create')}
              </button>
            </motion.div>
          )}

          {/* Profiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 md:px-0">
            {profiles.map((p) => {
              const isActive = p.id === activeProfile?.id;
              return (
                <div 
                  key={p.id}
                  className={`relative bg-surface p-5 rounded-3xl border transition-all flex flex-col items-center justify-center text-center group ${isActive ? 'border-primary-brand shadow-lg shadow-primary-brand/10 bg-primary-brand/5' : 'border-surface-high hover:border-text-muted'}`}
                >
                  {/* Delete button (only show if profiles length > 1 and not active) */}
                  {profiles.length > 1 && !isActive && (
                    <button
                      onClick={() => this.handleDeleteProfile(p.id)}
                      className="absolute top-3 right-3 text-text-muted hover:text-primary-brand transition-colors cursor-pointer text-sm font-black p-1 bg-background/50 rounded-full w-6 h-6 flex items-center justify-center border border-white/5"
                      title={t('movie_delete_review')}
                    >
                      ×
                    </button>
                  )}

                  <div 
                    onClick={() => this.handleSwitchProfile(p.id)}
                    className="cursor-pointer space-y-4 w-full flex flex-col items-center"
                  >
                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'border-primary-brand shadow-md shadow-primary-brand/20' : 'border-transparent'}`}>
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base truncate max-w-full">{p.name}</h4>
                      {isActive ? (
                        <span className="inline-block mt-1 text-[9px] bg-primary-brand/20 text-primary-brand font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary-brand/35">
                          {t('profile_active')}
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[9px] text-text-muted font-bold uppercase tracking-widest">
                          {t('profile_select')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4 px-4 md:px-0">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface p-6 rounded-3xl border border-surface-high flex flex-col items-center justify-center text-center hover:bg-surface-high/50 transition-colors">
              <span className="text-4xl mb-4">{s.icon}</span>
              <span className="text-4xl font-black text-white tracking-tighter mb-1">{s.value}</span>
              <span className="text-xs text-text-muted font-bold uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Sorting controls Dashboard */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-6 rounded-3xl border border-surface-high shadow-lg mx-4 md:mx-0">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              {t('profile_list_management')}
            </h3>
            <p className="text-xs text-text-muted">{t('profile_list_management_desc')}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider mr-1">{t('sort_label')}</span>
            <button
              onClick={() => this.setState({ sortBy: 'default' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'default' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-background border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('profile_sort_date_added')}
            </button>
            <button
              onClick={() => this.setState({ sortBy: 'release' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'release' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-background border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('sort_release')}
            </button>
            <button
              onClick={() => this.setState({ sortBy: 'alpha' })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border cursor-pointer ${sortBy === 'alpha' ? 'bg-primary-brand border-primary-brand text-white shadow-lg shadow-primary-brand/20' : 'bg-background border-surface-high text-text-muted hover:text-white'}`}
            >
              {t('sort_alpha')}
            </button>
          </div>
        </section>

        {/* Watchlist Section */}
        <section className="space-y-6 px-4 md:px-0">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">{t('profile_watchlist_tab')}</h2>
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider bg-surface px-3 py-1 rounded-lg border border-surface-high">{t('profile_movie_count', { count: watchlist.length })}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedWatchlist.length > 0 ? (
              sortedWatchlist.map((m, idx) => (
                <MovieCard key={m.id + idx} movie={m} />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-surface rounded-3xl border border-surface-high border-dashed">
                <span className="text-4xl">🍿</span>
                <p className="text-text-muted font-bold">{t('profile_empty_watchlist')}</p>
                <p className="text-xs text-text-muted/60">{t('profile_empty_watchlist_desc')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Film Visti Section */}
        <section className="space-y-6 px-4 md:px-0">
          <div className="flex justify-between items-end">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">{t('profile_watched_tab')}</h2>
            <span className="text-text-muted text-xs font-bold uppercase tracking-wider bg-surface px-3 py-1 rounded-lg border border-surface-high">{t('profile_movie_count', { count: watched.length })}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedWatched.length > 0 ? (
              sortedWatched.map((m, idx) => (
                <MovieCard key={m.id + idx} movie={m} />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-surface rounded-3xl border border-surface-high border-dashed">
                <span className="text-4xl">🎬</span>
                <p className="text-text-muted font-bold">{t('profile_empty_watched')}</p>
                <p className="text-xs text-text-muted/60">{t('profile_empty_watched_desc')}</p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6 px-4 md:px-0">
          <h3 className="text-3xl font-black text-white italic tracking-tighter">{t('profile_recent_activity')}</h3>
          <div className="flex flex-col gap-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="bg-surface p-4 rounded-2xl border border-surface-high flex gap-4 items-center hover:bg-surface-high transition-colors cursor-pointer group">
                <img src={activity.poster} className="w-16 aspect-[2/3] object-cover rounded-md" />
                <div className="flex-1">
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{activity.type}</p>
                  <h4 className="text-xl font-bold text-white mb-2">{activity.title}</h4>
                  {activity.rating && (
                    <div className="flex text-primary-brand gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? "currentColor" : "none"} />)}
                    </div>
                  )}
                </div>
                <ChevronRight className="text-text-muted group-hover:text-primary-brand transition-colors" />
              </div>
            ))}
          </div>
        </section>

        <section className="md:hidden flex flex-col gap-4 px-4">
          <button className="bg-surface p-5 rounded-2xl border border-surface-high flex items-center justify-between font-bold text-white">
            <div className="flex items-center gap-3"><Settings size={20} /> {t('profile_account_settings')}</div>
            <ChevronRight size={18} />
          </button>
          <button className="bg-surface p-5 rounded-2xl border border-surface-high flex items-center justify-between font-bold text-white">
            <div className="flex items-center gap-3"><History size={20} /> {t('profile_watch_history')}</div>
            <ChevronRight size={18} />
          </button>
          <button className="w-full mt-4 py-4 rounded-2xl border border-primary-brand/50 text-primary-brand font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-primary-brand/10 transition-all">
            <LogOut size={20} /> {t('profile_logout')}
          </button>
        </section>
      </div>
    );
  }
}
