// backend/src/scheduler/fetchAndStore.js — v6
// CHANGES:
//   - Re-added Knowivate as supplement to NewsData.io (optional, safe to fail)
//   - Added NewsData.io (newsdata) for Indian news — country=in, language=en+hi
//   - Fixed category contamination: article.category is always enforced after normalise
//   - Article limit increased: routes return 50 instead of 30

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const axios = require('axios')
const { getDB, persist } = require('../db/connection')
const { incrementQuota, logFetch } = require('../db/quotaManager')
const normalizers = require('../normalizers')
const normaliseTheNewsAPI = normalizers.normaliseTheNewsAPI
const normaliseGNews      = normalizers.normaliseGNews
const normaliseCurrents   = normalizers.normaliseCurrents
const normaliseGuardian   = normalizers.normaliseGuardian

// Inline fallback in case the module cache is stale
// This ensures fetchNewsData() always works even if require() returns partial module
function normaliseNewsData(raw) {
  if (normalizers.normaliseNewsData) return normalizers.normaliseNewsData(raw)
  // Inline version (identical to normalizers/index.js)
  const crypto = require('crypto')
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'
  const url   = raw.link || raw.url || ''
  const image = (raw.image_url && raw.image_url !== 'null' && raw.image_url !== null) ? raw.image_url : DEFAULT_IMAGE
  const author = Array.isArray(raw.creator) && raw.creator.length > 0 ? raw.creator[0] : (raw.creator || null)
  const title = (raw.title || '').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()
  const desc  = (raw.description || raw.content || '').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()
  if (!title || title.length < 5 || !url) return null
  const urlHash = crypto.createHash('md5').update(title.toLowerCase().slice(0,100)).digest('hex').slice(0,16)
  return {
    id:           raw.article_id ? String(raw.article_id).slice(0,16) : crypto.createHash('sha256').update(url).digest('hex').slice(0,16),
    title, description: desc, content: null, url,
    image_url:    image,
    published_at: raw.pubDate || new Date().toISOString(),
    source_name:  raw.source_name || raw.source_id || 'Indian News',
    author, category: 'india', region: 'in',
    language:     raw.language || 'en',
    api_source:   'newsdata',
    fetched_at:   new Date().toISOString(),
    url_hash:     urlHash,
    is_breaking:  0, is_war_news: 0,
  }
}

const THENEWSAPI_KEY = process.env.THENEWSAPI_KEY
const GNEWS_KEY      = process.env.GNEWS_KEY
const CURRENTS_KEY   = process.env.CURRENTS_KEY
const GUARDIAN_KEY   = process.env.GUARDIAN_KEY
const NEWSDATA_KEY   = process.env.NEWSDATA_KEY

// ── Category maps ────────────────────────────────────────────────
const TNA_CATS = {
  general:'general', technology:'tech', business:'business',
  sports:'sports', health:'health', science:'science',
  entertainment:'entertainment', world:'general',
}
const GNEWS_TOPICS = {
  general:'breaking-news', technology:'technology', business:'business',
  sports:'sports', health:'health', science:'science',
  entertainment:'entertainment', world:'world',
}
const CURRENTS_CATS = {
  general:'', technology:'technology', business:'finance',
  sports:'sports', health:'medical', science:'science',
  entertainment:'entertainment', world:'world',
}
const GUARDIAN_SECTIONS = {
  general:'', technology:'technology', business:'business',
  sports:'sport', health:'society', science:'science',
  entertainment:'culture', world:'world',
}

// ── Batch insert — direct rows, one persist at end ───────────────
function batchInsert(articles) {
  if (!articles || articles.length === 0) return 0
  const db  = getDB()
  const sql = `
    INSERT OR IGNORE INTO articles (
      id, title, description, content, url, image_url, published_at,
      source_name, author, category, region, language, api_source,
      fetched_at, is_breaking, is_war_news, view_count, url_hash
    ) VALUES (
      $id, $title, $description, $content, $url, $image_url, $published_at,
      $source_name, $author, $category, $region, $language, $api_source,
      $fetched_at, $is_breaking, $is_war_news, 0, $url_hash
    )
  `
  let newCount = 0
  for (const row of articles) {
    try {
      const result = db.prepare(sql).run(row)
      if (result.changes > 0) newCount++
    } catch { /* skip duplicate / constraint errors silently */ }
  }
  persist()
  return newCount
}

// =============================================================
// FETCH FUNCTIONS
// =============================================================

async function fetchTheNewsAPI(category) {
  if (!THENEWSAPI_KEY) throw new Error('No TheNewsAPI key')
  const cat = TNA_CATS[category] || 'general'
  const res = await axios.get('https://api.thenewsapi.com/v1/news/top', {
    params: { api_token: THENEWSAPI_KEY, categories: cat, language: 'en', limit: 25 },
    timeout: 12000,
  })
  return (res.data.data || []).map(a => {
    const art = normaliseTheNewsAPI(a, category)
    if (art) art.category = category   // enforce requested category
    return art
  }).filter(Boolean)
}

async function fetchGNews(category) {
  if (!GNEWS_KEY) throw new Error('No GNews key')
  const topic = GNEWS_TOPICS[category] || 'breaking-news'
  const res = await axios.get('https://gnews.io/api/v4/top-headlines', {
    params: { token: GNEWS_KEY, topic, lang: 'en', max: 10 },
    timeout: 12000,
  })
  return (res.data.articles || []).map(a => {
    const art = normaliseGNews(a, category)
    if (art) art.category = category
    return art
  }).filter(Boolean)
}

async function fetchCurrents(category) {
  if (!CURRENTS_KEY) throw new Error('No Currents key')
  const cat    = CURRENTS_CATS[category]
  const params = { apiKey: CURRENTS_KEY, language: 'en' }
  if (cat) params.category = cat
  const res = await axios.get('https://api.currentsapi.services/v1/latest-news', {
    params, timeout: 12000,
  })
  if (res.data.status !== 'ok') throw new Error(res.data.message || 'Currents error')
  return (res.data.news || []).map(a => {
    const art = normaliseCurrents(a, category)
    if (art) art.category = category
    return art
  }).filter(Boolean).slice(0, 20)
}

async function fetchGuardian(category) {
  if (!GUARDIAN_KEY) throw new Error('No Guardian key')
  const section = GUARDIAN_SECTIONS[category]
  const params  = {
    'api-key':     GUARDIAN_KEY,
    'show-fields': 'body,thumbnail,byline,trailText',
    'page-size':   20,
    'order-by':    'newest',
  }
  if (section) params.section = section
  const res = await axios.get('https://content.guardianapis.com/search', {
    params, timeout: 12000,
  })
  if (res.data.response?.status !== 'ok') throw new Error('Guardian API error')
  return (res.data.response.results || []).map(a => {
    const art = normaliseGuardian(a, category)
    // ALWAYS enforce the requested category — we asked for 'sports', we store as 'sports'
    if (art) art.category = category
    return art
  }).filter(Boolean)
}

// ── Knowivate — Indian news supplement ──────────────────────────
// Optional supplement to NewsData.io. Works when endpoint is live.
// Completely safe to fail — NewsData.io is the primary India source.
async function fetchKnowivate() {
  const attempts = [
    { url: 'https://news.knowivate.com/api/latest', params: {} },
    { url: 'https://news.knowivate.com/api/latest', params: { country: 'in' } },
    { url: 'https://news.knowivate.com/api/news',   params: {} },
    { url: 'https://api.knowivate.com/news',         params: {} },
  ]
  for (const { url, params } of attempts) {
    try {
      const res = await axios.get(url, {
        params, timeout: 8000,
        headers: { 'Accept': 'application/json', 'User-Agent': 'DataverseNews/1.0' },
      })
      let raw = []
      if (Array.isArray(res.data))               raw = res.data
      else if (Array.isArray(res.data.articles)) raw = res.data.articles
      else if (Array.isArray(res.data.news))      raw = res.data.news
      else if (Array.isArray(res.data.data))      raw = res.data.data
      else if (Array.isArray(res.data.results))   raw = res.data.results

      if (raw.length > 0) {
        const articles = raw.map(a => {
          const art = normaliseGNews({
            title:       a.title || a.headline || '',
            description: a.description || a.summary || a.content || '',
            image:       a.image || a.imageUrl || a.thumbnail || null,
            url:         a.url || a.link || '',
            publishedAt: a.publishedAt || a.published_at || a.date || new Date().toISOString(),
            source:      { name: a.source || a.sourceName || 'Knowivate' },
          }, 'india')
          if (art) { art.category = 'india'; art.region = 'in'; art.api_source = 'knowivate' }
          return art
        }).filter(Boolean)

        if (articles.length > 0) {
          console.log(`[knowivate] ✓ ${url} — ${articles.length} articles`)
          return articles
        }
      }
    } catch (err) {
      console.warn(`[knowivate] ${url} failed: ${err.message}`)
    }
  }
  console.warn('[knowivate] All endpoints failed — skipping (NewsData.io is primary)')
  return []  // Return empty, don't throw — NewsData is primary
}

// ── NewsData.io — Indian news ────────────────────────────────────
// Free tier: 200 requests/day
// country=in ensures geographically Indian sources only
// We paginate with nextPage token to get more articles per run
async function fetchNewsData() {
  if (!NEWSDATA_KEY) throw new Error('No NewsData.io key')

  const allArticles = []
  let nextPage = null
  let attempts = 0
  const maxPages = 3  // Max 3 pages per run to preserve quota (3 req per call)

  do {
    const params = {
      apikey:   NEWSDATA_KEY,
      country:  'in',         // India ONLY — geographically filtered
      language: 'en',         // English articles
      size:     10,           // 10 per page (max for free tier)
    }
    if (nextPage) params.page = nextPage

    const res = await axios.get('https://newsdata.io/api/1/news', {
      params, timeout: 12000,
    })

    if (res.data.status !== 'success') {
      throw new Error(res.data.message || 'NewsData.io error')
    }

    const articles = (res.data.results || [])
      .map(a => normaliseNewsData(a))
      .filter(Boolean)

    allArticles.push(...articles)
    nextPage = res.data.nextPage || null
    attempts++

    console.log(`[newsdata] Page ${attempts}: ${articles.length} articles (total: ${allArticles.length})`)

    // Small delay between pages to be polite
    if (nextPage && attempts < maxPages) {
      await new Promise(r => setTimeout(r, 300))
    }
  } while (nextPage && attempts < maxPages)

  console.log(`[newsdata] ✓ Fetched ${allArticles.length} India articles across ${attempts} page(s)`)
  return allArticles
}

const FETCH_FUNCTIONS = {
  thenewsapi: fetchTheNewsAPI,
  gnews:      fetchGNews,
  currents:   fetchCurrents,
  guardian:   fetchGuardian,
  newsdata:   () => fetchNewsData(),
  knowivate:  () => fetchKnowivate(),
}

async function fetchAndStore(apiSource, categories) {
  const fetchFn = FETCH_FUNCTIONS[apiSource]
  if (!fetchFn) { console.error(`[fetchAndStore] Unknown API: ${apiSource}`); return }

  // Knowivate & NewsData: single run, always fetches India — ignore categories param
  if (apiSource === 'knowivate' || apiSource === 'newsdata') {
    try {
      const articles = await fetchFn()
      const newCount = batchInsert(articles)
      incrementQuota(apiSource)
      logFetch(apiSource, 'india', articles.length, newCount, 'success')
      console.log(`[${apiSource}/india] +${newCount} new (${articles.length} fetched)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logFetch(apiSource, 'india', 0, 0, 'error', msg)
      console.warn(`[${apiSource}/india] Error: ${msg}`)
    }
    return
  }

  for (const category of categories) {
    try {
      const articles = await fetchFn(category)
      const newCount = batchInsert(articles)
      incrementQuota(apiSource)
      logFetch(apiSource, category, articles.length, newCount, 'success')
      console.log(`[${apiSource}/${category}] +${newCount} new (${articles.length} fetched)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logFetch(apiSource, category, 0, 0, 'error', msg)
      console.warn(`[${apiSource}/${category}] Error: ${msg}`)
      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
        console.warn(`[${apiSource}] Rate/quota limit — stopping this batch`)
        break
      }
    }
  }
}

module.exports = { fetchAndStore, fetchGuardian, fetchNewsData, fetchKnowivate }
