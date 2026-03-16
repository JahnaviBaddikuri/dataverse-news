// =============================================================
// backend/src/db/quotaManager.js
//
// Tracks daily API call counts per source.
// Before every scheduled fetch, checkQuota() is called.
// If the limit is reached, the fetch is skipped silently.
//
// WHY a 10% buffer?
//   APIs sometimes count retries, redirects, or preflight requests
//   against your quota. Keeping a 10% buffer prevents surprise
//   quota overruns at the end of the day.
// =============================================================

const { getDB } = require('./connection')

// Internal soft limits (10% below real limits as safety buffer)
const LIMITS = {
  thenewsapi: 220,   // Real limit: 250/day
  gnews:       90,   // Real limit: 100/day
  currents:   540,   // Real limit: 600/day
  guardian:  4500,   // Real limit: 5000/day
  knowivate:  999,   // No documented limit (fair use — we self-limit)
  newsdata:   180,   // Real limit: 200/day (10% buffer)
}

/**
 * Check if an API still has quota remaining today.
 * @param {string} apiSource - API identifier
 * @returns {boolean} true if we can still make calls
 */
function checkQuota(apiSource) {
  const db    = getDB()
  const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD

  const row = db.prepare(
    'SELECT calls_made FROM api_quota_tracker WHERE api_source = ? AND date = ?'
  ).get(apiSource, today)

  const used  = row?.calls_made ?? 0
  const limit = LIMITS[apiSource] ?? 50

  if (used >= limit) {
    console.warn(`[Quota] ${apiSource} has used ${used}/${limit} calls today — skipping`)
    return false
  }
  return true
}

/**
 * Increment the call count for an API (call after every successful fetch).
 * @param {string} apiSource
 */
function incrementQuota(apiSource) {
  const db    = getDB()
  const today = new Date().toISOString().split('T')[0]
  const limit = LIMITS[apiSource] ?? 50

  db.prepare(`
    INSERT INTO api_quota_tracker (api_source, date, calls_made, calls_limit)
    VALUES (?, ?, 1, ?)
    ON CONFLICT (api_source, date)
    DO UPDATE SET calls_made = calls_made + 1
  `).run(apiSource, today, limit)
}

/**
 * Get today's quota usage for all APIs (used by /api/status route).
 * @returns {Array} Usage rows
 */
function getQuotaStatus() {
  const db    = getDB()
  const today = new Date().toISOString().split('T')[0]
  return db.prepare(
    "SELECT api_source, calls_made, calls_limit FROM api_quota_tracker WHERE date = ?"
  ).all(today)
}

/**
 * Log a fetch attempt (success or failure).
 */
function logFetch(apiSource, endpoint, fetched, newCount, status, errorMsg = null) {
  const db = getDB()
  db.prepare(`
    INSERT INTO api_fetch_log (api_source, endpoint, articles_fetched, articles_new, fetched_at, status, error_msg)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(apiSource, endpoint, fetched, newCount, new Date().toISOString(), status, errorMsg)
}

module.exports = { checkQuota, incrementQuota, getQuotaStatus, logFetch }
