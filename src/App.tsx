import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar, BottomNav, MobileHeader } from './components/Navigation';
import Home from './pages/Home';
import Search from './pages/Search';
import MovieDetails from './pages/MovieDetails';
import Reviews from './pages/Reviews';
import Profile from './pages/Profile';
import FlixAI from './pages/FlixAI';
import NewReleases from './pages/NewReleases';
import Trending from './pages/Trending';
import SettingsPage from './pages/Settings';
import Party from './pages/Party';
import { AnimatePresence, motion } from 'motion/react';
 
class PageWrapper extends Component<{ children: React.ReactNode, pathname: string }> {
  render() {
    const { children, pathname } = this.props;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }
}

function PageWrapperWithLocation({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <PageWrapper pathname={location.pathname}>{children}</PageWrapper>;
}

class AppContent extends Component<{ pathname: string }> {
  render() {
    const { pathname } = this.props;
    const isDetails = pathname.includes('/movie/');

    return (
      <div className="min-h-screen bg-background selection:bg-primary-brand selection:text-white">
        <Sidebar />
        {!isDetails && <MobileHeader />}
        
        <main className="md:pl-64 px-margin-mobile md:px-margin-desktop pt-0 md:pt-0">
          <Routes>
            <Route path="/" element={<PageWrapperWithLocation><Home /></PageWrapperWithLocation>} />
            <Route path="/search" element={<PageWrapperWithLocation><Search /></PageWrapperWithLocation>} />
            <Route path="/movie/:id" element={<PageWrapperWithLocation><MovieDetails /></PageWrapperWithLocation>} />
            <Route path="/movie/:id/reviews" element={<PageWrapperWithLocation><Reviews /></PageWrapperWithLocation>} />
            <Route path="/profile" element={<PageWrapperWithLocation><Profile /></PageWrapperWithLocation>} />
            <Route path="/flixai" element={<PageWrapperWithLocation><FlixAI /></PageWrapperWithLocation>} />
            <Route path="/new" element={<PageWrapperWithLocation><NewReleases /></PageWrapperWithLocation>} />
            <Route path="/trending" element={<PageWrapperWithLocation><Trending /></PageWrapperWithLocation>} />
            <Route path="/settings" element={<PageWrapperWithLocation><SettingsPage /></PageWrapperWithLocation>} />
            <Route path="/party" element={<PageWrapperWithLocation><Party /></PageWrapperWithLocation>} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    );
  }
}

function AppContentWithLocation() {
  const location = useLocation();
  return <AppContent pathname={location.pathname} />;
}

export default class App extends Component {
  render() {
    return (
      <Router>
        <AppContentWithLocation />
      </Router>
    );
  }
}
