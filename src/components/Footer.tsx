import React from 'react';
import { Film, Sparkles, Headphones, Shield, Database, Github, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 text-xs mt-20 pb-28 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">MovieMind AI</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              An AI-powered cinema discovery platform integrating content-based recommendation algorithms, Gemini generative summaries, and natural text-to-speech narration.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gemini 3.7 Flash Engine Online</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-blue-400 transition-colors">
                  Trending Movies
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('search')} className="hover:text-blue-400 transition-colors">
                  Search Catalog
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('recommendations')} className="hover:text-blue-400 transition-colors">
                  AI Recommendation Lab
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-blue-400 transition-colors">
                  How the Algorithm Works
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider mb-3">AI Technologies</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Gemini 3.7 Flash</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini TTS & Speech Synthesis</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Content-Based Feature Vectors</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Spoiler-Free Logic Gate</span>
              </li>
            </ul>
          </div>

          {/* TMDB Attribution & Academic Notice */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider">Attribution</h4>
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-400 text-sm tracking-wider">TMDB</span>
                <span className="text-[10px] text-zinc-400">The Movie Database</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
            <p className="text-[11px] text-zinc-500">
              Built as a comprehensive AI & Web Engineering Capstone Project.
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <p>© {new Date().getFullYear()} MovieMind AI. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveTab('about')} className="hover:text-zinc-300">
              Architecture & Methodologies
            </button>
            <button onClick={() => setActiveTab('profile')} className="hover:text-zinc-300">
              API Status
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
