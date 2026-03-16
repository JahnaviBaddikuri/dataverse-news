// backend/src/startup.js — v3
// FIXED: newsdata seeds India on startup; knowivate removed (not in FETCH_FUNCTIONS)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { getDB, persist } = require('./db/connection')
const { fetchAndStore }  = require('./scheduler/fetchAndStore')

async function seedOnStartup() {
  const db    = getDB()
  const row   = db.prepare('SELECT COUNT(*) as c FROM articles').get()
  const count = row ? (row.c || 0) : 0

  // Also check if India articles specifically exist
  const indiaRow   = db.prepare("SELECT COUNT(*) as c FROM articles WHERE category='india' OR api_source='newsdata' OR region='in'").get()
  const indiaCount = indiaRow ? (indiaRow.c || 0) : 0

  // Force a full seed if total < 50 OR India has no articles
  if (count >= 50 && indiaCount >= 5) {
    console.log(`[Startup] DB has ${count} articles (${indiaCount} India) — scheduler maintains freshness.`)
    return
  }

  if (count < 50) {
    console.log(`[Startup] DB has only ${count} articles — running full initial seed...`)
    console.log('[Startup] This takes 30-60 seconds. Fetching from all APIs...')

    await fetchAndStore('guardian',   ['general', 'technology', 'world', 'science', 'business', 'sports', 'health', 'entertainment'])
    await fetchAndStore('gnews',      ['general', 'world', 'technology', 'sports', 'business'])
    await fetchAndStore('currents',   ['general', 'technology', 'sports', 'health', 'entertainment', 'business'])
    await fetchAndStore('thenewsapi', ['general', 'technology', 'world', 'sports', 'business'])
  }

  // Always seed India news separately
  if (indiaCount < 5) {
    console.log(`[Startup] India has only ${indiaCount} articles — seeding India news...`)
    // NewsData.io — primary India source (country=in filter, guaranteed accurate)
    await fetchAndStore('newsdata', ['india'])
    // Knowivate — supplement (free, no key, safe to fail silently)
    await fetchAndStore('knowivate', ['india'])
  }

  persist()
  await new Promise(r => setTimeout(r, 500))

  const newRow      = db.prepare('SELECT COUNT(*) as c FROM articles').get()
  const newIndia    = db.prepare("SELECT COUNT(*) as c FROM articles WHERE category='india' OR api_source='newsdata' OR region='in'").get()
  const newCount    = newRow   ? (newRow.c   || 0) : 0
  const newIndiaC   = newIndia ? (newIndia.c || 0) : 0
  console.log(`[Startup] Seed complete. DB: ${newCount} articles total, ${newIndiaC} India articles.`)
}

module.exports = { seedOnStartup }
