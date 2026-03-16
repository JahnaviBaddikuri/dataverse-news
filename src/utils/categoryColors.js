// =============================================================
// src/utils/categoryColors.js
//
// Maps category IDs to their brand colors and styles.
// All colors defined here match the CSS variables in globals.css
// =============================================================

/**
 * Get the CSS color value for a category.
 * Returns the CSS variable reference as a string.
 *
 * @param {string} category - Category ID
 * @returns {string} CSS color value
 */
export const categoryColors = {
  general:       'var(--cat-general)',
  technology:    'var(--cat-technology)',
  business:      'var(--cat-business)',
  sports:        'var(--cat-sports)',
  health:        'var(--cat-health)',
  science:       'var(--cat-science)',
  entertainment: 'var(--cat-entertainment)',
  world:         'var(--cat-world)',
  search:        'var(--cat-general)',
}

/**
 * Get the label for a category ID.
 * @param {string} categoryId
 * @returns {string}
 */
export const categoryLabels = {
  general:       'Top Stories',
  technology:    'Technology',
  business:      'Business',
  sports:        'Sports',
  health:        'Health',
  science:       'Science',
  entertainment: 'Entertainment',
  world:         'World',
  search:        'Search Results',
}

/**
 * Determine if an article was published today.
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export function isToday(dateString) {
  if (!dateString) return false
  const articleDate = new Date(dateString)
  const today       = new Date()
  return (
    articleDate.getFullYear() === today.getFullYear() &&
    articleDate.getMonth()    === today.getMonth()    &&
    articleDate.getDate()     === today.getDate()
  )
}

/**
 * Get a trust level label for a source name.
 * In a real app you'd maintain a database of trusted sources.
 * This is a simple heuristic based on well-known outlet names.
 *
 * @param {string} sourceName
 * @returns {{ label: string, color: string }}
 */
export function getTrustLevel(sourceName = '') {
  const name = sourceName.toLowerCase()

  const highTrust = [
    'reuters', 'ap news', 'associated press', 'bbc', 'the guardian',
    'new york times', 'washington post', 'npr', 'the economist',
    'financial times', 'bloomberg', 'wall street journal', 'wsj',
    'abc news', 'cbs news', 'nbc news', 'pbs', 'al jazeera',
  ]

  const medTrust = [
    'cnn', 'msnbc', 'fox news', 'politico', 'axios', 'vox',
    'the atlantic', 'time', 'newsweek', 'usa today', 'huffpost',
    'techcrunch', 'wired', 'the verge', 'ars technica', 'engadget',
  ]

  if (highTrust.some(t => name.includes(t))) {
    return { label: 'Verified',       color: '#34d399' } // green
  }
  if (medTrust.some(t => name.includes(t))) {
    return { label: 'Established',    color: '#60a5fa' } // blue
  }
  return { label: 'News Source',    color: '#94a3b8' } // grey
}
