// backend/src/routes/news.js — v3
// FIXES:
//   - All routes now pass limit=50 (matches articleQueries PAGE_SIZE)
//   - /refresh: added newsdata to India seed, removed old knowivate category loop
//   - /categories/stats now before module.exports (was accidentally after)

const express = require('express')
const router  = express.Router()
const Q       = require('../db/articleQueries')
const { memGet, memSet, memDel, memClear, getCacheStats, TTL } = require('../cache/memCache')
const { getQuotaStatus } = require('../db/quotaManager')
const { fetchAndStore }  = require('../scheduler/fetchAndStore')

function cached(key, ttl, queryFn, res) {
  const hit = memGet(key)
  if (hit) { res.setHeader('X-Cache', 'HIT'); return res.json(hit) }
  const data = queryFn()
  memSet(key, data, ttl)
  res.setHeader('X-Cache', 'MISS')
  res.json(data)
}

// ── GET /api/news ───────────────────────────────────────────────
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1
  cached(`top:${page}`, TTL.CATEGORY, () => ({
    articles: Q.getTopStories(page, 50),
    page, type: 'top-stories',
  }), res)
})

// ── GET /api/news/category/:cat ─────────────────────────────────
router.get('/category/:cat', (req, res) => {
  const { cat } = req.params
  const page    = parseInt(req.query.page) || 1
  cached(`cat:${cat}:${page}`, TTL.CATEGORY, () => ({
    articles: Q.getByCategory(cat, page, 50),
    page, category: cat,
  }), res)
})

// ── GET /api/news/trending ──────────────────────────────────────
router.get('/trending', (req, res) => {
  cached('trending', TTL.TRENDING, () => ({
    articles: Q.getTrending(50),
    type: 'trending',
  }), res)
})

// ── GET /api/news/breaking ──────────────────────────────────────
router.get('/breaking', (req, res) => {
  cached('breaking', TTL.BREAKING, () => ({
    articles: Q.getBreaking(30),
    type: 'breaking',
  }), res)
})

// ── GET /api/news/india ─────────────────────────────────────────
router.get('/india', (req, res) => {
  const page = parseInt(req.query.page) || 1
  cached(`india:${page}`, TTL.INDIA, () => ({
    articles: Q.getIndianNews(page, 50),
    page, type: 'india',
  }), res)
})

// ── GET /api/news/war-feed ──────────────────────────────────────
router.get('/war-feed', (req, res) => {
  cached('war', TTL.WAR, () => ({
    articles: Q.getWarNews(60),
    type: 'war-feed',
  }), res)
})

// ── GET /api/news/search?q=keyword ─────────────────────────────
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' })
  cached(`search:${q.toLowerCase().slice(0,50)}`, TTL.SEARCH, () => ({
    articles: Q.searchArticles(q, 50),
    query: q, type: 'search',
  }), res)
})

// ── GET /api/news/categories/stats ─────────────────────────────
router.get('/categories/stats', (req, res) => {
  cached('cat-stats', TTL.CATEGORY, () => ({
    categories: Q.getCategoryStats(),
  }), res)
})

// ── GET /api/news/article/:id ───────────────────────────────────
router.get('/article/:id', (req, res) => {
  const article = Q.getArticleById(req.params.id)
  if (!article) return res.status(404).json({ error: 'Article not found' })
  res.json(article)
})

// ── POST /api/news/article/:id/view ────────────────────────────
router.post('/article/:id/view', (req, res) => {
  Q.incrementViewCount(req.params.id)
  memDel('trending')
  res.json({ ok: true })
})

// ── GET /api/status ─────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    db: Q.getStats(),
    quota: getQuotaStatus(),
    cache: getCacheStats(),
    uptime: Math.floor(process.uptime()) + 's',
  })
})

// ── POST /api/refresh ───────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const secret = req.headers['x-refresh-secret']
  if (secret !== process.env.REFRESH_SECRET && process.env.REFRESH_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  memClear()

  const fetchAll = async () => {
    await fetchAndStore('guardian',   ['general', 'technology', 'world'])
    await fetchAndStore('currents',   ['general', 'business', 'sports'])
    await fetchAndStore('thenewsapi', ['general', 'technology'])
    await fetchAndStore('gnews',      ['general'])
    await fetchAndStore('newsdata',   ['india'])   // ← NewsData for India
    await fetchAndStore('knowivate',  ['india'])   // ← Knowivate supplement
  }
  fetchAll().catch(err => console.error('[Refresh] Error:', err))
  res.json({ ok: true, message: 'Refresh started in background' })
})

module.exports = router
