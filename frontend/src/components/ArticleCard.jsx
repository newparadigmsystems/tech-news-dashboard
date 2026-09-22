import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Calendar, Globe, Bookmark, Sparkles } from 'lucide-react';
import { formatRelativeTime, formatFullDate, getCategoryBadge } from '../utils/formatters';
import CategoryPlaceholder from './CategoryPlaceholder';

export default function ArticleCard({ article, onTagClick }) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const badge = getCategoryBadge(article.category);
  const fullDate = formatFullDate(article.published_at);
  const relativeDate = formatRelativeTime(article.published_at);

  const handleCopyCitation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = `[${article.title}](${article.link}) — *${article.publication}*`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasImage = article.image_url && !imageError;

  return (
    <article className="group relative bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row">
      {/* Featured Image or Category SVG Placeholder */}
      <div className="sm:w-60 sm:min-w-60 h-48 sm:h-auto shrink-0 relative bg-gray-100 dark:bg-dark-700 overflow-hidden">
        {hasImage ? (
          <img
            src={article.image_url}
            alt={article.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <CategoryPlaceholder category={article.category} publication={article.publication} />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Publication, Category, Date */}
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
            {/* Publication Badge */}
            <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {article.publication}
            </span>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            {/* Category Tag */}
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.bg}`}>
              {article.category_label || badge.label}
            </span>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            {/* Date with tooltip */}
            <span
              className="text-gray-500 dark:text-gray-400 flex items-center gap-1 cursor-default"
              title={fullDate}
            >
              <Calendar className="w-3 h-3 text-gray-400" />
              {relativeDate}
            </span>
          </div>

          {/* Title with link */}
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="focus:outline-none focus:underline"
            >
              {article.title}
            </a>
          </h2>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3">
              {article.excerpt}
            </p>
          )}

          {/* Cluster / Multi-outlet coverage indicator if present */}
          {article.cluster_id && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 mb-3">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span className="font-medium">Trending Story: Covered across multiple sources</span>
            </div>
          )}
        </div>

        {/* Footer Area: Tags & Action Buttons */}
        <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tags / Named Entities */}
          <div className="flex flex-wrap items-center gap-1.5">
            {article.tags && article.tags.slice(0, 3).map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick?.(tag)}
                className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-dark-600 transition-colors"
              >
                #{tag}
              </button>
            ))}
            {article.author && article.author !== article.publication && (
              <span className="text-gray-400 dark:text-gray-500 text-[11px] italic">
                by {article.author}
              </span>
            )}
          </div>

          {/* Actions: Copy Citation & Open Link */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyCitation}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 font-medium transition-colors"
              title="Copy markdown link for Substack draft"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Cite</span>
                </>
              )}
            </button>

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium shadow-xs transition-colors"
            >
              <span>Read</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
