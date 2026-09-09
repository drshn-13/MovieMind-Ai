import React, { useState } from 'react';
import { 
  Film, 
  Search, 
  Sparkles, 
  Heart, 
  History, 
  LayoutDashboard, 
  Info, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Headphones,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onSearchSubmit }) => {
  const { user, logout, openAuthModal, demoLogin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      setActiveTab('search');
      if (onSearchSubmit) {
        onSearchSubmit(navSearchQuery.trim());
      }
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home', icon: Film },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
    { id: 'favorites', label: 'Favorites', icon: Heart, requiresAuth: true },
    { id: 'history', label: 'History', icon: History, requiresAuth: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { id: 'about', label: 'How It Works', icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-950/50">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                MovieMind <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 font-mono font-semibold">AI</span>
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                placeholder="Quick search movies..."
                className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-4 py-1.5 rounded-full border border-zinc-800 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </form>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.requiresAuth && !user) {
                      openAuthModal('login');
                    } else {
                      setActiveTab(link.id);
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* User / Auth Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 transition-all text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-medium max-w-[100px] truncate">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3.5 py-2 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400">Signed in as</p>
                      <p className="text-xs font-semibold text-zinc-200 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                      <span>Analytics Dashboard</span>
                    </button>
                    <div className="border-t border-zinc-800 my-1"></div>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-sm text-rose-400 hover:bg-red-950/40 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => demoLogin()}
                  className="px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/50 rounded-lg transition-all"
                  title="Log in with pre-seeded demo user"
                >
                  ⚡ Demo Login
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-950/50 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center lg:hidden space-x-2">
            {!user && (
              <button
                onClick={() => demoLogin()}
                className="px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 rounded-md"
              >
                Demo
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950/95 border-b border-zinc-800 px-4 pt-2 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="pt-2 pb-1">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full bg-zinc-900 text-sm text-zinc-100 pl-9 pr-4 py-2 rounded-lg border border-zinc-800"
              />
            </div>
          </form>

          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.requiresAuth && !user) {
                      openAuthModal('login');
                    } else {
                      setActiveTab(link.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-zinc-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-sm text-center font-medium text-zinc-200 bg-zinc-900 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-sm text-center font-medium text-white bg-blue-600 rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
