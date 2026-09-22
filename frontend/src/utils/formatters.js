export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return dateString;
  }
}

export function formatFullDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (e) {
    return dateString;
  }
}

export function getCategoryBadge(category) {
  switch (category?.toLowerCase()) {
    case 'ai':
      return {
        bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
        dot: 'bg-purple-500',
        label: 'AI'
      };
    case 'cybersecurity':
      return {
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        dot: 'bg-rose-500',
        label: 'Cybersecurity'
      };
    case 'cloud':
      return {
        bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
        dot: 'bg-sky-500',
        label: 'Cloud'
      };
    case 'quantum':
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Quantum'
      };
    case 'emerging':
      return {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        dot: 'bg-amber-500',
        label: 'Emerging Tech'
      };
    case 'commentary':
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
        dot: 'bg-indigo-500',
        label: 'Commentary'
      };
    default:
      return {
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        dot: 'bg-slate-400',
        label: 'General Tech'
      };
  }
}
