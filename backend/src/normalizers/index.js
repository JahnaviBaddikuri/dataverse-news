// backend/src/normalizers/index.js
// FIXES:
//   - stripHtml() added — removes HTML tags from description fields
//   - Guardian trailText often has <strong> etc. — now cleaned
//   - All descriptions stripped of HTML before storage

const crypto = require('crypto')

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80'

const WAR_KEYWORDS = [
  'iran', 'israel', 'attack', 'strike', 'missile', 'drone', 'bomb',
  'war', 'conflict', 'military', 'troops', 'ceasefire', 'casualties',
  'killed', 'wounded', 'airstrike', 'invasion', 'offensive', 'battle',
  'ukraine', 'russia', 'hamas', 'hezbollah', 'pentagon', 'nato',
  'sanction', 'nuclear', 'weapon', 'refugee', 'evacuation',
]

// ── Strip HTML tags and decode common entities ──────────────────
function stripHtml(text = '') {
  if (!text) return ''
  return text
    .replace(/<[^>]+>/g, '')           // remove all HTML tags
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim()
}

function generateId(url) {
  return crypto.createHash('sha256').update(url || Math.random().toString()).digest('hex').slice(0, 16)
}

function generateTitleHash(title = '') {
  const normalised = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an|is|in|of|to|for|and|or)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  return crypto.createHash('md5').update(normalised).digest('hex').slice(0, 16)
}

function isBreaking(dateString) {
  if (!dateString) return 0
  const pub  = new Date(dateString)
  const diff = (new Date() - pub) / (1000 * 60 * 60)
  return diff <= 2 ? 1 : 0
}

function isWarNews(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase()
  return WAR_KEYWORDS.some(kw => text.includes(kw)) ? 1 : 0
}

function mapGuardianSection(section = '') {
  const s = section.toLowerCase()
  if (s.includes('tech'))                                               return 'technology'
  if (s.includes('business') || s.includes('finance'))                 return 'business'
  if (s.includes('sport'))                                              return 'sports'
  if (s.includes('health') || s.includes('medical') || s.includes('society')) return 'health'
  if (s.includes('science'))                                            return 'science'
  if (s.includes('culture') || s.includes('film') || s.includes('tv') || s.includes('music')) return 'entertainment'
  if (s.includes('world') || s.includes('international'))               return 'world'
  return 'general'
}

function isValid(article) {
  if (!article.title || article.title === '[Removed]') return false
  if (!article.url)  return false
  if (article.title.length < 10) return false
  // Filter out articles where title IS the url or source name (empty articles)
  if (article.title === article.source_name) return false
  return true
}

// =============================================================
// NORMALIZERS
// =============================================================

function normaliseTheNewsAPI(raw, category = 'general') {
  const article = {
    id:           generateId(raw.url),
    title:        stripHtml(raw.title || 'Untitled'),
    description:  stripHtml(raw.description || raw.snippet || ''),
    content:      null,
    url:          raw.url          || '',
    image_url:    raw.image_url    || DEFAULT_IMAGE,
    published_at: raw.published_at || new Date().toISOString(),
    source_name:  raw.source       || 'Unknown',
    author:       null,
    category,
    region:       'world',
    language:     'en',
    api_source:   'thenewsapi',
    fetched_at:   new Date().toISOString(),
    url_hash:     generateTitleHash(raw.title),
  }
  article.is_breaking = isBreaking(article.published_at)
  article.is_war_news = isWarNews(article.title, article.description)
  return isValid(article) ? article : null
}

function normaliseGNews(raw, category = 'general') {
  const article = {
    id:           generateId(raw.url),
    title:        stripHtml(raw.title || 'Untitled'),
    description:  stripHtml(raw.description || ''),
    content:      null,
    url:          raw.url          || '',
    image_url:    raw.image        || DEFAULT_IMAGE,
    published_at: raw.publishedAt  || new Date().toISOString(),
    source_name:  raw.source?.name || 'Unknown',
    author:       null,
    category,
    region:       'world',
    language:     'en',
    api_source:   'gnews',
    fetched_at:   new Date().toISOString(),
    url_hash:     generateTitleHash(raw.title),
  }
  article.is_breaking = isBreaking(article.published_at)
  article.is_war_news = isWarNews(article.title, article.description)
  return isValid(article) ? article : null
}

function mapCurrentsCategory(cat = '') {
  const map = { finance: 'business', medical: 'health', 'breaking-news': 'general' }
  return map[cat] || cat || 'general'
}

function normaliseCurrents(raw, category = 'general') {
  const article = {
    id:           generateId(raw.url),
    title:        stripHtml(raw.title || 'Untitled'),
    description:  stripHtml(raw.description || ''),
    content:      null,
    url:          raw.url         || '',
    image_url:    (raw.image && raw.image !== 'None') ? raw.image : DEFAULT_IMAGE,
    published_at: raw.published   || new Date().toISOString(),
    source_name:  raw.author      || 'Unknown',
    author:       raw.author      || null,
    category,
    region:       'world',
    language:     'en',
    api_source:   'currents',
    fetched_at:   new Date().toISOString(),
    url_hash:     generateTitleHash(raw.title),
  }
  article.is_breaking = isBreaking(article.published_at)
  article.is_war_news = isWarNews(article.title, article.description)
  return isValid(article) ? article : null
}

function normaliseGuardian(raw, category = 'general') {
  const fields = raw.fields || {}
  const article = {
    id:           generateId(raw.webUrl),
    title:        stripHtml(raw.webTitle || 'Untitled'),
    // trailText often contains HTML — strip it for clean description
    description:  stripHtml(fields.trailText || ''),
    content:      fields.body  || null,
    url:          raw.webUrl   || '',
    image_url:    fields.thumbnail || DEFAULT_IMAGE,
    published_at: raw.webPublicationDate || new Date().toISOString(),
    source_name:  'The Guardian',
    author:       fields.byline || null,
    category:     mapGuardianSection(raw.sectionName) || category,
    region:       'world',
    language:     'en',
    api_source:   'guardian',
    fetched_at:   new Date().toISOString(),
    url_hash:     generateTitleHash(raw.webTitle),
  }
  article.is_breaking = isBreaking(article.published_at)
  article.is_war_news = isWarNews(article.title, article.description)
  return isValid(article) ? article : null
}

function normaliseKnowivate(raw, category = 'india') {
  const url   = raw.url || raw.link || raw.articleUrl || ''
  const image = raw.imageUrl || raw.image_url || raw.image || raw.urlToImage || DEFAULT_IMAGE
  const date  = raw.publishedAt || raw.published_at || raw.pubDate || raw.date || new Date().toISOString()
  // Knowivate sometimes puts source name as the title when article is empty
  const title = stripHtml(raw.title || raw.headline || '')

  const article = {
    id:           generateId(url),
    title,
    description:  stripHtml(raw.description || raw.summary || raw.excerpt || ''),
    content:      null,
    url,
    image_url:    (image && image !== 'None' && image !== 'null') ? image : DEFAULT_IMAGE,
    published_at: date,
    source_name:  raw.source || raw.sourceName || raw.publisher || 'Indian News',
    author:       raw.author || null,
    category:     'india',   // Always tag as india
    region:       'in',
    language:     raw.language || 'en',
    api_source:   'knowivate',
    fetched_at:   new Date().toISOString(),
    url_hash:     generateTitleHash(title),
  }
  article.is_breaking = isBreaking(article.published_at)
  article.is_war_news = isWarNews(article.title, article.description)
  return isValid(article) ? article : null
}

module.exports = {
  normaliseTheNewsAPI,
  normaliseGNews,
  normaliseCurrents,
  normaliseGuardian,
  normaliseKnowivate,
  stripHtml,
}
