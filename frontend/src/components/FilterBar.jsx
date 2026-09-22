import React from 'react';
import { Filter, Calendar, Layers, ArrowUpDown, X, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'ai', label: 'AI' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'quantum', label: 'Quantum' },
  { id: 'emerging', label: 'Emerging Tech' },
  { id: 'commentary', label: 'Commentary' },
  { id: 'general', label: 'General Tech' }
];

const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '24h', label: 'Past 24h' },
  { id: '48h', label: 'Past 48h' },
  { id: '7d', label: 'Past 7d' },
  { id: '30d', label: 'Past 30d' },
  { id: 'custom', label: 'Custom' }
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'publication', label: 'Publication (A-Z)' },
  { id: 'title', label: 'Title (A-Z)' }
];

export default function FilterBar({
  category,
  onCategoryChange,
  datePreset,
  onDatePresetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  publication,
  onPublicationChange,
  publicationsList,
  sortBy,
  onSortByChange,
  categoryCounts,
  totalResults,
  onResetFilters,
  hasActiveFilters
}) {
  return (
    <div className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            const count = cat.id === 'all'
              ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
              : (categoryCounts[cat.id] || 0);

            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200/80 dark:bg-dark-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Controls: Date, Publication, Sort, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-gray-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Preset Selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-800 p-0.5 rounded-xl text-xs">
              <span className="pl-2 pr-1 text-gray-400 dark:text-gray-500 flex items-center">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onDatePresetChange(preset.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    datePreset === preset.id
                      ? 'bg-white dark:bg-dark-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker (shown when preset is 'custom') */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-dark-800 px-2 py-1 rounded-xl text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomStartDateChange(e.target.value)}
                  className="bg-transparent text-gray-700 dark:text-gray-200 text-xs focus:outline-none"
                  title="From date"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomEndDateChange(e.target.value)}
                  className="bg-transparent text-gray-700 dark:text-gray-200 text-xs focus:outline-none"
                  title="To date"
                />
              </div>
            )}

            {/* Publication Filter */}
            <div className="relative">
              <select
                value={publication}
                onChange={(e) => onPublicationChange(e.target.value)}
                className="appearance-none bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 text-xs font-medium pl-3 pr-8 py-1.5 rounded-xl border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                <option value="all">All Publications ({publicationsList.length})</option>
                {publicationsList.map((pub) => (
                  <option key={pub.publication} value={pub.publication}>
                    {pub.publication} ({pub.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none absolute right-2.5 top-2.5" />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Right side: Sorting & Results Count */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              <strong className="text-gray-900 dark:text-gray-100">{totalResults}</strong> articles
            </span>

            {/* Sort Selector */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="appearance-none bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 text-xs font-medium pl-7 pr-8 py-1.5 rounded-xl border border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none absolute right-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
