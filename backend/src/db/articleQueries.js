// backend/src/db/articleQueries.js — v4
// FIXES:
//   - getIndianNews: added api_source='newsdata' to query
//   - All limits increased: 50 articles per page instead of 30
//     This matches what getCategoryStats reports (no more "50 in chooser, only 30 loaded")
//   - getTopStories: excludes india category
//   - getCategoryStats: shows actual per-category counts correctly

const { getDB } = require('./connection')

const LIST_COLS = `
  id, title, description, url, image_url, published_at,
  source_name, author, category, region, api_source,
  is_breaking, is_war_news, view_count
`

// Page size increased to 50 so Flash Feed chooser count matches what's loaded
const PAGE_SIZE = 50

function getByCategory(category, page = 1, size = PAGE_SIZE) {
  if (category === 'india') return getIndianNews(page, size)

  const offset = (page - 1) * size
  return getDB().prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE category = $cat
    ORDER BY published_at DESC
    LIMIT $size OFFSET $offset
  `).all({ cat: category, size, offset })
}

function getTopStories(page = 1, size = PAGE_SIZE) {
  const offset = (page - 1) * size
  return getDB().prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE category != 'india'
    ORDER BY published_at DESC
    LIMIT $size OFFSET $offset
  `).all({ size, offset })
}

function getTrending(limit = PAGE_SIZE) {
  const db = getDB()
  // Try recent articles sorted by views first
  const withViews = db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE fetched_at >= datetime('now', '-24 hours')
      AND category != 'india'
    ORDER BY view_count DESC, published_at DESC
    LIMIT $limit
  `).all({ limit })
  if (withViews.length >= 5) return withViews
  // Fallback: newest articles
  return db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE category != 'india'
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ limit })
}

function getBreaking(limit = 30) {
  const db = getDB()
  // Live feed = most recent news overall, with breaking flagged first
  // "Breaking" (< 2hrs old) float to top; rest sorted by newest
  const breaking = db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE is_breaking = 1
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ limit })

  // Always show recent news even if no "breaking" articles
  const recent = db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ limit })

  if (breaking.length >= 10) return breaking

  // Merge: breaking first, then fill with recent (deduped)
  const seen = new Set(breaking.map(a => a.id))
  const fill  = recent.filter(a => !seen.has(a.id))
  return [...breaking, ...fill].slice(0, limit)
}

function getIndianNews(page = 1, size = PAGE_SIZE) {
  const offset = (page - 1) * size
  return getDB().prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE category = 'india'
       OR api_source = 'newsdata'
       OR api_source = 'knowivate'
       OR region = 'in'
    ORDER BY published_at DESC
    LIMIT $size OFFSET $offset
  `).all({ size, offset })
}

function getWarNews(limit = 60) {
  const db = getDB()
  // Primary: articles flagged is_war_news=1
  let war = db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE is_war_news = 1
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ limit })

  // Post-filter: remove obvious false positives (gaming/entertainment themes
  // that triggered war keywords like "battle", "attack", "bomb")
  const NOISE_PATTERN = /mario|pokemon|zelda|game|movie|film|album|song|award|oscars|grammy|nba|nfl|mlb|nhl|premier league|champions league|concert|tour|trailer|streaming|netflix|disney|spotify/i
  war = war.filter(a => {
    const text = `${a.title} ${a.description || ''}`
    return !NOISE_PATTERN.test(text)
  })

  if (war.length >= 5) return war

  // Fallback: world category articles (genuine conflict news often lands here)
  const world = db.prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE category = 'world'
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ limit })

  const seen = new Set(war.map(a => a.id))
  const fill = world.filter(a => !seen.has(a.id) && !NOISE_PATTERN.test(`${a.title} ${a.description || ''}`))
  return [...war, ...fill].slice(0, limit)
}

function searchArticles(keyword, limit = PAGE_SIZE) {
  const q = `%${keyword}%`
  return getDB().prepare(`
    SELECT ${LIST_COLS} FROM articles
    WHERE title LIKE $q OR description LIKE $q
    ORDER BY published_at DESC
    LIMIT $limit
  `).all({ q, limit })
}

function getArticleById(id) {
  return getDB().prepare('SELECT * FROM articles WHERE id = $id').get({ id })
}

function incrementViewCount(id) {
  getDB().prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = $id').run({ id })
}

// Returns per-category counts for Flash Feed "What's Next?" chooser
// Counts are capped at PAGE_SIZE so the displayed number matches what actually loads
function getCategoryStats() {
  const db = getDB()

  // Get raw counts per category
  const rows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM articles
    GROUP BY category
    ORDER BY count DESC
  `).all()

  // For India: combine all india-related sources into one count
  const indiaCount = db.prepare(`
    SELECT COUNT(*) as count FROM articles
    WHERE category = 'india'
       OR api_source = 'newsdata'
       OR api_source = 'knowivate'
       OR region = 'in'
  `).get()

  // Merge: replace or add 'india' entry with combined count
  const merged = rows.filter(r => r.category !== 'india')
  merged.unshift({ category: 'india', count: indiaCount ? indiaCount.count : 0 })

  // Cap each count at PAGE_SIZE so chooser numbers match what loads
  return merged.map(r => ({ ...r, count: Math.min(r.count, PAGE_SIZE) }))
}

function getStats() {
  const db = getDB()
  const total   = db.prepare('SELECT COUNT(*) as count FROM articles').get()
  const perSrc  = db.prepare('SELECT api_source, COUNT(*) as count FROM articles GROUP BY api_source ORDER BY count DESC').all()
  const byCat   = db.prepare('SELECT category,  COUNT(*) as count FROM articles GROUP BY category  ORDER BY count DESC').all()
  const oldest  = db.prepare('SELECT MIN(published_at) as date FROM articles').get()
  const newest  = db.prepare('SELECT MAX(published_at) as date FROM articles').get()
  return {
    total: total ? total.count : 0,
    perSource: perSrc, byCat,
    oldest: oldest ? oldest.date : null,
    newest: newest ? newest.date : null,
  }
}

// Remove OBVIOUS non-India articles mistakenly tagged as India.
// We use a strict allowlist: only delete if the title has NONE of our India keywords.
// Being conservative here — better to have some global news leak in than lose real India stories.
function cleanupFakeIndiaArticles() {
  const db = getDB()

  // Core keywords — if ANY of these appear in the title, we keep the article
  const INDIA_TITLE_TERMS = [
    '%india%','%indian%','%delhi%','%mumbai%','%bengaluru%','%bangalore%',
    '%chennai%','%kolkata%','%hyderabad%','%modi%','%bjp%','%bollywood%',
    '%rupee%','%ipl%','%kashmir%','%bharat%','%isro%',
    '%pakistan%','%nepal%','%sri lanka%','%bangladesh%',
  ]
  const conditions = INDIA_TITLE_TERMS.map(() => 'LOWER(title) LIKE ?').join(' OR ')
  const params = INDIA_TITLE_TERMS.map(t => t)

  try {
    // ONLY clean non-dedicated India sources (newsdata/knowivate articles are always real India)
    // AND only delete if the TITLE has absolutely no India keywords (very clear false positives)
    const toDelete = db.prepare(`
      SELECT COUNT(*) as count FROM articles
      WHERE (category = 'india' OR region = 'in')
        AND api_source NOT IN ('newsdata','knowivate')
        AND NOT (${conditions})
    `).get(...params)

    if (toDelete && toDelete.count > 0) {
      db.prepare(`
        DELETE FROM articles
        WHERE (category = 'india' OR region = 'in')
          AND api_source NOT IN ('newsdata','knowivate')
          AND NOT (${conditions})
      `).run(...params)
      console.log(`[cleanup] Removed ${toDelete.count} clearly non-India articles from India category`)
    } else {
      console.log('[cleanup] India category is clean')
    }
  } catch(e) {
    console.warn('[cleanup] India cleanup error:', e.message || String(e))
  }
}

module.exports = {
  getByCategory, getTopStories, getTrending, getBreaking,
  getIndianNews, getWarNews, searchArticles,
  getArticleById, incrementViewCount, getCategoryStats, getStats,
  cleanupFakeIndiaArticles,
}
