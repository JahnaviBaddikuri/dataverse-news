// =============================================================
// src/services/newsService.js
//
// ── MAJOR ARCHITECTURE CHANGE ─────────────────────────────────
//
// BEFORE: React called external APIs directly (quota burns on every page load)
// NOW:    React calls OUR OWN Express backend at http://localhost:3001
//         The backend serves articles from SQLite — zero live API calls.
//         Users NEVER touch an API. The backend scheduler does it silently.
//
// WHY THIS IS BETTER:
//   - Page loads: 500ms → < 50ms (SQLite vs live API)
//   - Quota: burns once per scheduler run, not per user
//   - Reliability: works even if an API is down (cached data)
//   - Offline resilience: backend keeps serving from DB
//
// FALLBACK:
//   If the backend is unavailable (not started yet), we fall back
//   to calling APIs directly so the site still works during dev.
//
// BACKEND URL:
//   In development:  http://localhost:3001
//   In production:   Set VITE_BACKEND_URL in root .env
// =============================================================

import axios from 'axios'

// Backend base URL — update VITE_BACKEND_URL in .env when deploying
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Direct API keys (used only as fallback if backend is offline)
const THENEWSAPI_KEY = import.meta.env.VITE_THENEWSAPI_KEY
const GNEWS_KEY      = import.meta.env.VITE_GNEWS_KEY
const CURRENTS_KEY   = import.meta.env.VITE_CURRENTS_KEY
const GUARDIAN_KEY   = import.meta.env.VITE_GUARDIAN_KEY

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'

// ── Shape converter: backend DB row → frontend article shape ────
// The backend uses snake_case; the frontend uses camelCase.
function dbRowToArticle(row) {
  if (!row) return null
  return {
    id:          row.id,
    title:       row.title        || 'No Title',
    description: row.description  || '',
    image:       row.image_url    || DEFAULT_IMAGE,
    url:         row.url          || '#',
    publishedAt: row.published_at || new Date().toISOString(),
    source:      row.source_name  || 'Unknown',
    author:      row.author       || null,
    category:    row.category     || 'general',
    apiSource:   row.api_source   || 'unknown',
    fullContent: row.content      || null,
    isBreaking:  row.is_breaking  === 1,
    isWarNews:   row.is_war_news  === 1,
    viewCount:   row.view_count   || 0,
    region:      row.region       || 'world',
  }
}

// =============================================================
// SECTION 1 — BACKEND API CALLS (primary)
// =============================================================

/**
 * Fetch news from our backend by category.
 * Backend serves from SQLite — fast and quota-free.
 */
async function fetchFromBackend(category = 'general', page = 1) {
  const endpoint = category === 'general'
    ? `${BACKEND_URL}/api/news?page=${page}`
    : `${BACKEND_URL}/api/news/category/${category}?page=${page}`

  const res = await axios.get(endpoint, { timeout: 8000 })
  const articles = (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
  if (!articles.length) throw new Error('Backend returned 0 articles')
  return articles
}

async function fetchTrendingFromBackend() {
  const res = await axios.get(`${BACKEND_URL}/api/news/trending`, { timeout: 8000 })
  return (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
}

async function fetchBreakingFromBackend() {
  const res = await axios.get(`${BACKEND_URL}/api/news/breaking`, { timeout: 8000 })
  return (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
}

async function fetchWarNewsFromBackend() {
  const res = await axios.get(`${BACKEND_URL}/api/news/war-feed`, { timeout: 8000 })
  return (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
}

async function fetchIndiaNewsFromBackend() {
  const res = await axios.get(`${BACKEND_URL}/api/news/india`, { timeout: 8000 })
  return (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
}

async function searchFromBackend(query) {
  const res = await axios.get(`${BACKEND_URL}/api/news/search`, {
    params: { q: query }, timeout: 8000,
  })
  return (res.data.articles || []).map(dbRowToArticle).filter(Boolean)
}

// =============================================================
// SECTION 2 — DIRECT API FALLBACKS (if backend is offline)
// Identical logic to the old newsService.js.
// =============================================================

function normaliseTheNewsAPI(a, cat = 'general') {
  return { id: btoa(a.url||'').slice(0,16), title: a.title||'', description: a.description||'', image: a.image_url||DEFAULT_IMAGE, url: a.url||'#', publishedAt: a.published_at||new Date().toISOString(), source: a.source||'Unknown', author: null, category: cat, apiSource: 'thenewsapi', fullContent: null, isBreaking: false, isWarNews: false }
}
function normaliseGNews(a, cat = 'general') {
  return { id: btoa(a.url||'').slice(0,16), title: a.title||'', description: a.description||'', image: a.image||DEFAULT_IMAGE, url: a.url||'#', publishedAt: a.publishedAt||new Date().toISOString(), source: a.source?.name||'Unknown', author: null, category: cat, apiSource: 'gnews', fullContent: null, isBreaking: false, isWarNews: false }
}
function normaliseCurrents(a, cat = 'general') {
  return { id: btoa(a.url||'').slice(0,16), title: a.title||'', description: a.description||'', image: (a.image&&a.image!=='None')?a.image:DEFAULT_IMAGE, url: a.url||'#', publishedAt: a.published||new Date().toISOString(), source: a.author||'Unknown', author: a.author||null, category: cat, apiSource: 'currents', fullContent: null, isBreaking: false, isWarNews: false }
}
function normaliseGuardian(a, cat = 'general') {
  const f=a.fields||{}
  return { id: btoa(a.webUrl||'').slice(0,16), title: a.webTitle||'', description: f.trailText||'', image: f.thumbnail||DEFAULT_IMAGE, url: a.webUrl||'#', publishedAt: a.webPublicationDate||new Date().toISOString(), source: 'The Guardian', author: f.byline||null, category: cat, apiSource: 'guardian', fullContent: f.body||null, isBreaking: false, isWarNews: false }
}

function dedup(articles) {
  const seen = new Set()
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,80)
    if (seen.has(key)) return false
    seen.add(key); return true
  })
}

async function fetchDirectFallback(category = 'general') {
  const [tna, gnews, currents, guardian] = await Promise.allSettled([
    THENEWSAPI_KEY ? axios.get('https://api.thenewsapi.com/v1/news/top', { params: { api_token: THENEWSAPI_KEY, categories: category==='world'?'general':category, language:'en', limit:10 }, timeout:8000 }) : Promise.reject('no key'),
    GNEWS_KEY      ? axios.get('https://gnews.io/api/v4/top-headlines',   { params: { token: GNEWS_KEY, topic: category==='general'?'breaking-news':category, lang:'en', max:10 }, timeout:8000 }) : Promise.reject('no key'),
    CURRENTS_KEY   ? axios.get('https://api.currentsapi.services/v1/latest-news', { params: { apiKey: CURRENTS_KEY, language:'en' }, timeout:8000 }) : Promise.reject('no key'),
    GUARDIAN_KEY   ? axios.get('https://content.guardianapis.com/search', { params: { 'api-key': GUARDIAN_KEY, 'show-fields':'body,thumbnail,byline,trailText', 'page-size':10, 'order-by':'newest' }, timeout:8000 }) : Promise.reject('no key'),
  ])
  const all = []
  if (tna.status==='fulfilled')      all.push(...(tna.value.data.data||[]).map(a=>normaliseTheNewsAPI(a,category)))
  if (guardian.status==='fulfilled') all.push(...(guardian.value.data.response?.results||[]).map(a=>normaliseGuardian(a,category)))
  if (gnews.status==='fulfilled')    all.push(...(gnews.value.data.articles||[]).map(a=>normaliseGNews(a,category)))
  if (currents.status==='fulfilled') all.push(...(currents.value.data.news||[]).map(a=>normaliseCurrents(a,category)))
  if (!all.length) throw new Error('All direct API calls failed. Start the backend or check your .env keys.')
  return dedup(all).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

// =============================================================
// SECTION 3 — PUBLIC EXPORTS (used by React components)
// =============================================================

/**
 * Try backend first, fall back to direct API calls.
 */
export async function fetchNews(category = 'general', page = 1) {
  try {
    return await fetchFromBackend(category, page)
  } catch (backendErr) {
    console.warn('[newsService] Backend unavailable, using direct APIs:', backendErr.message)
    return fetchDirectFallback(category)
  }
}

export async function searchNews(query) {
  try {
    return await searchFromBackend(query)
  } catch {
    return fetchDirectFallback('general')
  }
}

export async function fetchTrending() {
  try {
    return await fetchTrendingFromBackend()
  } catch {
    return fetchDirectFallback('general')
  }
}

export async function fetchBreaking() {
  try {
    return await fetchBreakingFromBackend()
  } catch {
    return fetchDirectFallback('general')
  }
}

export async function fetchWarNews() {
  try {
    return await fetchWarNewsFromBackend()
  } catch {
    // Fallback: search for war-related news directly
    try {
      const res = await axios.get('https://content.guardianapis.com/search', {
        params: { 'api-key': GUARDIAN_KEY, 'q': 'iran israel war attack', 'show-fields': 'body,thumbnail,byline,trailText', 'page-size': 20, 'order-by': 'newest' },
        timeout: 8000,
      })
      return (res.data.response?.results || []).map(a => normaliseGuardian(a, 'world'))
    } catch {
      return []
    }
  }
}

export async function fetchIndiaNews() {
  try {
    return await fetchIndiaNewsFromBackend()
  } catch {
    return []
  }
}

/**
 * Record that a user opened an article (powers the trending feed).
 * @param {string} articleId
 */
export async function recordView(articleId) {
  try {
    await axios.post(`${BACKEND_URL}/api/news/article/${articleId}/view`, {}, { timeout: 3000 })
  } catch { /* non-critical, fail silently */ }
}

/**
 * Try to fetch full Guardian content for a non-Guardian article.
 * Used by ArticleModal as a fallback.
 */
export async function fetchGuardianArticle(title) {
  if (!GUARDIAN_KEY) return null
  try {
    const res = await axios.get('https://content.guardianapis.com/search', {
      params: {
        'api-key':     GUARDIAN_KEY,
        'q':           title.split(' ').slice(0, 6).join(' '),
        'show-fields': 'body,thumbnail,byline,trailText',
        'page-size':   1,
        'order-by':    'relevance',
      },
      timeout: 6000,
    })
    const r = res.data.response?.results || []
    return r.length ? normaliseGuardian(r[0]) : null
  } catch {
    return null
  }
}

// Fetch category article counts (for Flash Feed category chooser)
export async function fetchCategoryStats() {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/news/categories/stats`, { timeout: 5000 })
    return res.data.categories || []
  } catch {
    return []
  }
}
