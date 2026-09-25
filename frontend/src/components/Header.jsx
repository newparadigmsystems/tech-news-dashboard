import React, { useEffect, useRef } from 'react';
import { Search, RefreshCw, Moon, Sun, Newspaper, Sparkles, X, Database } from 'lucide-react';

export default function Header({
  searchQuery,
  onSearchChange,
  isRefreshing,
  onRefresh,
  stats,
  darkMode,
  onToggleDarkMode
}) {
  const searchInputRef = useRef(null);

  // Keyboard shortcut ⌘K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCurating = stats?.is_curating;
  const isSyncing = isRefreshing || stats?.is_refreshing;
  const curationProgress = stats?.curation_progress;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Substack badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                TechRadar
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Substack Feed
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Curated tech research & intelligence
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search news, topics (e.g. cybersecurity, LLM, quantum, zero-day)..."
              className="w-full pl-10 pr-16 py-2 rounded-xl text-sm bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex absolute right-3 items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-200/60 dark:bg-dark-900/60 border border-gray-300/60 dark:border-gray-700/60 rounded">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Actions (Status Pill, Refresh, Backup, Theme) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live AI Curation Status Badge */}
          {isCurating && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-spin" />
              <span>
                AI Summarizing{curationProgress?.total > 0 ? ` (${curationProgress.current}/${curationProgress.total})` : '...'}
              </span>
            </div>
          )}

          {/* Live Feed Ingestion Status Badge */}
          {isSyncing && !isCurating && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              <span>Fetching Feeds...</span>
            </div>
          )}

          {/* Refresh Feeds Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing || isCurating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSyncing || isCurating
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 cursor-not-allowed'
                : 'bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700 border-gray-200 dark:border-gray-700'
            }`}
            title="Fetch latest feeds and generate AI takeaways"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isSyncing || isCurating) ? 'animate-spin text-indigo-500' : ''}`} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Syncing...' : isCurating ? 'Curating...' : 'Refresh'}
            </span>
          </button>

          {/* Database Backup Download Button */}
          <a
            href="/api/backup/download"
            download
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-gray-700 transition-colors"
            title="Download safe SQLite snapshot (.db) to your computer"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Backup DB</span>
          </a>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
