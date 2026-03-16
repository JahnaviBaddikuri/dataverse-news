// =============================================================
// backend/src/cache/memCache.js
//
// A tiny in-memory cache for hot endpoints like /trending and /breaking.
// Prevents hammering SQLite with the same query hundreds of times
// when many users hit the site simultaneously.
//
// HOW IT WORKS:
//   - Results are cached in a JavaScript Map (lives in Node.js RAM)
//   - Each entry has a TTL (time to live) in milliseconds
//   - After TTL expires, the next request gets fresh data from SQLite
//   - Cache is cleared on server restart (fine — SQLite is the real store)
//
// TTL GUIDELINES:
//   /trending    → 2 min  (high traffic, can afford slight staleness)
//   /breaking    → 1 min  (breaking news should be fresh)
//   /category/*  → 3 min  (less urgent)
//   /war-feed    → 2 min
//   /india       → 3 min
// =============================================================

const store = new Map()

/**
 * Get a cached value.
 * @param {string} key
 * @returns {any|null} Cached data or null if expired/missing
 */
function memGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data
}

/**
 * Store a value with a TTL.
 * @param {string} key
 * @param {any}    data
 * @param {number} ttlMs - Time to live in milliseconds
 */
function memSet(key, data, ttlMs) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

/**
 * Invalidate a cached entry (call when data changes).
 * @param {string} key
 */
function memDel(key) {
  store.delete(key)
}

/**
 * Clear ALL cache entries (e.g. after a manual refresh).
 */
function memClear() {
  store.clear()
}

/**
 * Get cache stats for the /api/status endpoint.
 */
function getCacheStats() {
  const now = Date.now()
  const entries = []
  for (const [key, entry] of store.entries()) {
    entries.push({
      key,
      alive: entry.expiresAt > now,
      expiresIn: Math.max(0, Math.round((entry.expiresAt - now) / 1000)) + 's',
    })
  }
  return entries
}

// ── TTL Constants ─────────────────────────────────────────────
const TTL = {
  TRENDING:  2 * 60 * 1000,   // 2 minutes
  BREAKING:  1 * 60 * 1000,   // 1 minute
  CATEGORY:  3 * 60 * 1000,   // 3 minutes
  WAR:       2 * 60 * 1000,   // 2 minutes
  INDIA:     3 * 60 * 1000,   // 3 minutes
  SEARCH:    5 * 60 * 1000,   // 5 minutes
}

module.exports = { memGet, memSet, memDel, memClear, getCacheStats, TTL }
