import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ArticleCard from './components/ArticleCard';
import Pagination from './components/Pagination';
import { Newspaper, Loader2, RefreshCw, AlertCircle, ArrowUp } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default dark
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [publication, setPublication] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [excludeNoise, setExcludeNoise] = useState(true);

  // Data States
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [publicationsList, setPublicationsList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sync Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track scroll position for "Back to top"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute date range ISO strings from preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start_date: start.toISOString() };
    }
    if (datePreset === '24h') {
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { start_date: start.toISOString() };
    }
    if (datePreset === '48h') {
      const start = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      return { start_date: start.toISOString() };
    }
    if (datePreset === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start_date: start.toISOString() };
    }
    if (datePreset === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start_date: start.toISOString() };
    }
    if (datePreset === 'custom') {
      const res = {};
      if (customStartDate) res.start_date = new Date(customStartDate).toISOString();
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        res.end_date = end.toISOString();
      }
      return res;
    }
    return {};
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch Metadata (categories, publications, stats)
  const fetchMetadata = async () => {
    try {
      const [catsRes, pubsRes, statsRes] = await Promise.all([
        fetch(`/api/categories?exclude_noise=${excludeNoise}`),
        fetch(`/api/publications?exclude_noise=${excludeNoise}`),
        fetch('/api/stats')
      ]);
      if (catsRes.ok) {
        const cats = await catsRes.json();
        const counts = {};
        cats.forEach((c) => {
          counts[c.category] = c.count;
        });
        setCategoryCounts(counts);
      }
      if (pubsRes.ok) {
        const pubs = await pubsRes.json();
        setPublicationsList(pubs);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (e) {
      console.error('Error fetching metadata:', e);
    }
  };

  // Fetch Articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery.trim()) params.append('q', debouncedQuery.trim());
      if (category && category !== 'all') params.append('category', category);
      if (publication && publication !== 'all') params.append('publication', publication);
      
      const { start_date, end_date } = getDateRange();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      
      params.append('sort_by', sortBy);
      params.append('page', page);
      params.append('page_size', pageSize);
      params.append('exclude_noise', excludeNoise);

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalResults(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      console.error('Failed to load articles:', e);
      setError(e.message || 'Failed to load news articles');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, publication, getDateRange, sortBy, page, pageSize, excludeNoise]);

  // Initial Load
  useEffect(() => {
    fetchMetadata();
  }, [excludeNoise]);

  // Fetch articles on filter change
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Trigger Feed Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/refresh', { method: 'POST' });
      // Poll briefly then reload
      setTimeout(async () => {
        await Promise.all([fetchMetadata(), fetchArticles()]);
        setIsRefreshing(false);
      }, 4000);
    } catch (e) {
      console.error('Refresh error:', e);
      setIsRefreshing(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCategory('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setPublication('all');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(debouncedQuery.trim()) ||
    category !== 'all' ||
    datePreset !== 'all' ||
    publication !== 'all';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        stats={stats}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Filter & Control Bar */}
      <FilterBar
        category={category}
        onCategoryChange={(c) => {
          setCategory(c);
          setPage(1);
        }}
        datePreset={datePreset}
        onDatePresetChange={(p) => {
          setDatePreset(p);
          setPage(1);
        }}
        customStartDate={customStartDate}
        onCustomStartDateChange={(d) => {
          setCustomStartDate(d);
          setPage(1);
        }}
        customEndDate={customEndDate}
        onCustomEndDateChange={(d) => {
          setCustomEndDate(d);
          setPage(1);
        }}
        publication={publication}
        onPublicationChange={(p) => {
          setPublication(p);
          setPage(1);
        }}
        publicationsList={publicationsList}
        sortBy={sortBy}
        onSortByChange={(s) => {
          setSortBy(s);
          setPage(1);
        }}
        categoryCounts={categoryCounts}
        totalResults={totalResults}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        excludeNoise={excludeNoise}
        onToggleExcludeNoise={() => {
          setExcludeNoise(!excludeNoise);
          setPage(1);
        }}
        filteredNoiseCount={stats?.filtered_noise_count || 0}
      />

      {/* Main Feed Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={fetchArticles}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col sm:flex-row gap-4 animate-pulse"
              >
                <div className="sm:w-56 h-36 bg-gray-200 dark:bg-dark-700 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-4/5" />
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white dark:bg-dark-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Newspaper className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No articles match your criteria
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Try adjusting your search terms, clearing date ranges, or selecting "All Topics" to broaden your research.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Article Cards Stack */
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onTagClick={(tag) => {
                  setSearchQuery(tag);
                  setPage(1);
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalResults > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalResults}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              scrollToTop();
            }}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
      </main>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all z-20"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            TechRadar Research Dashboard • {stats?.total_articles || 0} indexed articles across {stats?.total_publications || 0} publications
          </span>
          <span>
            Designed for Substack Tech Writers
          </span>
        </div>
      </footer>
    </div>
  );
}
