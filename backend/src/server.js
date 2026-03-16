// =============================================================
// backend/src/server.js  —  UPDATED for sql.js
//
// CHANGE: getDB() is now preceded by await initDB()
//   because sql.js initialises asynchronously (WebAssembly load).
//   Everything else is identical.
// =============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const express = require('express')
const cors    = require('cors')

// ── Import our modules ───────────────────────────────────────
const { initDB, getDB }  = require('./db/connection')       // ← added initDB
const { startScheduler } = require('./scheduler/masterScheduler')
const { seedOnStartup }  = require('./startup')
const newsRoutes         = require('./routes/news')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}))
app.use(express.json())

// ── Routes ───────────────────────────────────────────────────
app.use('/api/news', newsRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Dataverse News Backend', time: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
})

app.use((err, req, res, next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Bootstrap ────────────────────────────────────────────────
async function bootstrap() {
  try {
    // Step 1: Init sql.js (async — must await before anything DB-related)
    await initDB()
    console.log('[Server] Database initialised')

    // Step 2: Clean up any non-India articles incorrectly tagged as India
    // MUST happen BEFORE seedOnStartup so india count is accurate
    try {
      const { cleanupFakeIndiaArticles } = require('./db/articleQueries')
      cleanupFakeIndiaArticles()
    } catch(e) { console.warn('[Server] India cleanup skipped:', e.message) }

    // Step 3: Seed if empty (first run) — after cleanup so india count is correct
    await seedOnStartup()

    // Step 4: Start background scheduler
    startScheduler()
    console.log('[Server] Scheduler running')

    // Step 5: Listen
    app.listen(PORT, () => {
      console.log(`\n[Server] ✓ Dataverse News Backend running on port ${PORT}`)
      console.log(`[Server] Health:  http://localhost:${PORT}/health`)
      console.log(`[Server] API:     http://localhost:${PORT}/api/news`)
      console.log(`[Server] Status:  http://localhost:${PORT}/api/news/status\n`)
    })
  } catch (err) {
    console.error('[Server] Failed to start:', err)
    process.exit(1)
  }
}

bootstrap()
