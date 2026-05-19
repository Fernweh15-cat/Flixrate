import React, { Component } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Search, User, Film, TrendingUp, List, Settings, Sparkles, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { getActiveProfile } from '../lib/tmdb';
import { t } from '../lib/i18n';

export class Sidebar extends Component {
  render() {
    const activeProfile = getActiveProfile();
    const navItems = [
      { icon: Home, label: t('nav_home'), path: '/' },
      { icon: Search, label: t('nav_search'), path: '/search' },
      { icon: Film, label: t('nav_new'), path: '/new' },
      { icon: TrendingUp, label: t('nav_trending'), path: '/trending' },
      { icon: Sparkles, label: t('nav_flixai'), path: '/flixai' },
      { icon: Users, label: t('nav_party'), path: '/party' },
      { icon: List, label: t('nav_watchlist'), path: '/profile' },
    ];

    return (
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-surface border-r border-surface-high flex-col py-8 z-50">
        <div className="px-8 mb-12">
          <Link to="/" className="block">
            <h1 className="text-3xl font-black text-primary-brand tracking-tighter italic">FLIXRATE</h1>
          </Link>
          
          <div className="mt-8 border-b border-surface-high pb-4">
            <Link to="/profile" className="flex items-center gap-4 group cursor-pointer">
              <img src={activeProfile.avatar} alt={activeProfile.name} className="w-10 h-10 rounded-full object-cover border border-primary-brand/30 group-hover:scale-105 transition-transform duration-300" />
              <div>
                <p className="font-semibold text-text-main line-clamp-1 group-hover:text-primary-brand transition-colors">{activeProfile.name}</p>
                <p className="text-xs text-primary-brand font-bold uppercase tracking-widest">Premium</p>
              </div>
            </Link>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-primary-brand text-white font-bold" 
                  : "text-text-muted hover:bg-surface-high hover:text-text-main"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110")} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mt-auto">
          <Link to="/settings" className="flex items-center gap-4 w-full px-4 py-3 text-text-muted hover:text-text-main transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t('nav_settings')}</span>
          </Link>
        </div>
      </aside>
    );
  }
}

export class BottomNav extends Component {
  render() {
    const navItems = [
      { icon: Home, label: t('nav_home'), path: '/' },
      { icon: Search, label: t('nav_search'), path: '/search' },
      { icon: Users, label: t('nav_party'), path: '/party' },
      { icon: Sparkles, label: t('nav_flixai'), path: '/flixai' },
      { icon: User, label: t('nav_watchlist'), path: '/profile' },
    ];

    return (
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-xl border-t border-surface-high flex justify-around items-center py-3 px-6 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-primary-brand scale-110" : "text-text-muted"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }
}

export class MobileHeader extends Component<{ title?: string }> {
  render() {
    const { title } = this.props;
    const activeProfile = getActiveProfile();
    return (
      <header className="md:hidden fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md flex justify-between items-center px-4 py-4 z-50 border-b border-surface-high/30">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="cursor-pointer">
            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-8 h-8 rounded-full object-cover border border-primary-brand/30 hover:scale-105 transition-transform" />
          </Link>
          <Link to="/">
            <h1 className="text-xl font-black text-primary-brand tracking-tighter italic">FLIXRATE</h1>
          </Link>
        </div>
        {title && <span className="absolute left-1/2 -translate-x-1/2 font-bold text-text-main">{title}</span>}
        <div className="flex items-center gap-4">
          <Link to="/search" className="cursor-pointer">
            <Search className="w-5 h-5 text-text-muted hover:text-white transition-colors" />
          </Link>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="w-5 h-5 text-text-muted hover:text-white transition-colors" />
          </Link>
        </div>
      </header>
    );
  }
}
