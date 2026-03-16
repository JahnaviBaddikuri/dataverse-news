// =============================================================
// src/utils/formatDate.js
//
// Date formatting helpers for displaying article timestamps.
// Uses the built-in Intl API (no library needed).
// =============================================================

/**
 * Format a date string as a relative time string.
 * Examples: "2 hours ago", "3 days ago", "just now"
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Human-readable relative time
 */
export function timeAgo(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now  = new Date()
  const diffMs = now - date

  // Negative diff means future date — just show "just now"
  if (diffMs < 0) return 'just now'

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours   = Math.floor(diffMinutes / 60)
  const diffDays    = Math.floor(diffHours / 24)
  const diffWeeks   = Math.floor(diffDays / 7)
  const diffMonths  = Math.floor(diffDays / 30)

  if (diffSeconds < 60)  return 'just now'
  if (diffMinutes < 60)  return `${diffMinutes}m ago`
  if (diffHours < 24)    return `${diffHours}h ago`
  if (diffDays < 7)      return `${diffDays}d ago`
  if (diffWeeks < 5)     return `${diffWeeks}w ago`
  if (diffMonths < 12)   return `${diffMonths}mo ago`

  // For very old dates, show the actual date
  return formatDate(dateString)
}

/**
 * Format a date as a readable date string.
 * Example: "March 6, 2026"
 *
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric',
  }).format(date)
}

/**
 * Format a date as short date + time.
 * Example: "Mar 6, 2026 · 3:45 PM"
 *
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatDateTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Estimate reading time for an article.
 * Average reading speed: 200 words per minute.
 *
 * @param {string} text - Article body or description
 * @returns {string} e.g. "3 min read"
 */
export function readingTime(text = '') {
  const words = text.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}
