// backend/src/scheduler/masterScheduler.js — v3
// CHANGES:
//   - Replaced Knowivate with NewsData.io (every 45 min, 200/day free)
//   - NewsData: 200/day ÷ 3 pages per run ÷ 32 runs/day = safe
//   - Added newsdata to LIMITS in quotaManager

const cron = require('node-cron')
const { fetchAndStore } = require('./fetchAndStore')
const { checkQuota } = require('../db/quotaManager')
const { getDB } = require('../db/connection')

const CATEGORIES = [
  'general', 'technology', 'business', 'world',
  'sports', 'health', 'science', 'entertainment',
]

function startScheduler() {
  console.log('[Scheduler] Starting all cron jobs...')

  // ── Guardian: every 15 min, rotate 3 categories ─────────────
  // 5000/day ÷ 3 cats × 96 runs = 288 calls. Very safe.
  cron.schedule('*/15 * * * *', async () => {
    if (!checkQuota('guardian')) return
    await fetchAndStore('guardian', rotateBatch(CATEGORIES, 3, 'guardian'))
  })

  // ── GNews: every 30 min, 2 categories ───────────────────────
  // 100/day → 2 × 48 = 96 calls/day.
  cron.schedule('5,35 * * * *', async () => {
    if (!checkQuota('gnews')) return
    await fetchAndStore('gnews', rotateBatch(CATEGORIES, 2, 'gnews'))
  })

  // ── TheNewsAPI: every 30 min, 2 categories ──────────────────
  // 250/day → 2 × 48 = 96 calls/day.
  cron.schedule('15,45 * * * *', async () => {
    if (!checkQuota('thenewsapi')) return
    await fetchAndStore('thenewsapi', rotateBatch(CATEGORIES, 2, 'thenewsapi'))
  })

  // ── Currents: every 45 min, 2 categories ────────────────────
  // 600/day → 2 × 32 = 64 calls/day.
  cron.schedule('0,45 * * * *', async () => {
    if (!checkQuota('currents')) return
    await fetchAndStore('currents', rotateBatch(CATEGORIES, 2, 'currents'))
  })

  // ── NewsData.io: every 45 min — India news (primary) ──────────
  // 200/day. Each run uses up to 3 pages = 3 calls.
  // 3 × 32 runs = 96 calls/day (well under 200 limit).
  cron.schedule('20 * * * *', async () => {
    if (!checkQuota('newsdata')) return
    await fetchAndStore('newsdata', ['india'])
  })

  // ── Knowivate: every 60 min — India news (supplement) ──────────
  // Free, no key. Supplements NewsData.io. Silently skipped if offline.
  cron.schedule('50 * * * *', async () => {
    await fetchAndStore('knowivate', ['india'])
  })

  // ── Daily cleanup at 3 AM ────────────────────────────────────
  cron.schedule('0 3 * * *', () => cleanOldArticles(7))

  console.log('[Scheduler] 5 jobs active:')
  console.log('[Scheduler]   Guardian: every 15min (5000/day limit)')
  console.log('[Scheduler]   GNews:    every 30min (100/day limit)')
  console.log('[Scheduler]   TheNewsAPI: every 30min (250/day limit)')
  console.log('[Scheduler]   Currents: every 45min (600/day limit)')
  console.log('[Scheduler]   NewsData: every 45min — India only (200/day limit)')
  console.log('[Scheduler]   Knowivate: every 60min — India supplement (no key)')
}

const rotateState = {}
function rotateBatch(categories, batchSize, key) {
  if (!rotateState[key]) rotateState[key] = 0
  const start = rotateState[key]
  rotateState[key] = (start + batchSize) % categories.length
  return Array.from({ length: batchSize }, (_, i) =>
    categories[(start + i) % categories.length]
  )
}

function cleanOldArticles(days) {
  try {
    getDB().prepare(
      `DELETE FROM articles WHERE fetched_at < datetime('now', '-' || ? || ' days')`
    ).run(days)
    console.log(`[Maintenance] Cleaned articles older than ${days} days`)
  } catch(e) {
    console.warn('[Maintenance] Cleanup error:', e.message)
  }
}

module.exports = { startScheduler, cleanOldArticles }
