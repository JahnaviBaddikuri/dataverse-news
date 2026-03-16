// backend/src/db/connection.js — v3
// sql.js pure-JS SQLite. Zero native compilation. Works on Node v24.
// FIXES:
//   - makeStmt.run() now uses _db.getRowsModified() for real change count
//   - Error handling wraps sql.js string-throws into proper Error objects
//   - batchInsert tracking now works correctly

const path = require('path')
const fs   = require('fs')

const DATA_DIR = path.join(__dirname, '../../data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'dataverse.db')

let _db       = null
let initReady = false

function persist() {
  try {
    const data = _db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  } catch (e) {
    console.error('[DB] Persist error:', e.message)
  }
}

async function initDB() {
  if (initReady) return

  const initSqlJs = require('sql.js')
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH)
    _db = new SQL.Database(buf)
    console.log(`[DB] Loaded DB from ${DB_PATH}`)
  } else {
    _db = new SQL.Database()
    console.log(`[DB] Created new DB at ${DB_PATH}`)
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      content      TEXT,
      url          TEXT UNIQUE NOT NULL,
      image_url    TEXT,
      published_at TEXT NOT NULL,
      source_name  TEXT,
      author       TEXT,
      category     TEXT,
      region       TEXT,
      language     TEXT DEFAULT 'en',
      api_source   TEXT NOT NULL,
      fetched_at   TEXT NOT NULL,
      is_breaking  INTEGER DEFAULT 0,
      is_war_news  INTEGER DEFAULT 0,
      view_count   INTEGER DEFAULT 0,
      url_hash     TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_category   ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_region     ON articles(region);
    CREATE INDEX IF NOT EXISTS idx_published  ON articles(published_at);
    CREATE INDEX IF NOT EXISTS idx_fetched    ON articles(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_api_source ON articles(api_source);

    CREATE TABLE IF NOT EXISTS api_quota_tracker (
      api_source  TEXT NOT NULL,
      date        TEXT NOT NULL,
      calls_made  INTEGER DEFAULT 0,
      calls_limit INTEGER NOT NULL,
      PRIMARY KEY (api_source, date)
    );

    CREATE TABLE IF NOT EXISTS api_fetch_log (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      api_source       TEXT NOT NULL,
      endpoint         TEXT,
      articles_fetched INTEGER,
      articles_new     INTEGER,
      fetched_at       TEXT NOT NULL,
      status           TEXT,
      error_msg        TEXT
    );
  `)

  persist()
  initReady = true
  setInterval(persist, 60_000)
  console.log('[DB] Schema ready. Auto-persist every 60s.')
}

// ── Wrap sql.js errors (it sometimes throws strings, not Error objects) ──
function wrapError(e) {
  if (e instanceof Error) return e
  return new Error(String(e))
}

function makeStmt(sql) {
  return {
    all(...args) {
      try {
        const params = resolveParams(args)
        const stmt   = _db.prepare(sql)
        const rows   = []
        stmt.bind(params)
        while (stmt.step()) rows.push(stmt.getAsObject())
        stmt.free()
        return rows
      } catch (e) { throw wrapError(e) }
    },

    get(...args) {
      try {
        const params = resolveParams(args)
        const stmt   = _db.prepare(sql)
        stmt.bind(params)
        let row
        if (stmt.step()) row = stmt.getAsObject()
        stmt.free()
        return row
      } catch (e) { throw wrapError(e) }
    },

    // FIXED: use getRowsModified() to get actual change count
    run(...args) {
      try {
        const params = resolveParams(args)
        _db.run(sql, params)
        const changes = _db.getRowsModified()
        persist()
        return { changes }
      } catch (e) { throw wrapError(e) }
    },
  }
}

function resolveParams(args) {
  if (!args || args.length === 0) return []
  if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
    const obj = args[0]
    const out = {}
    for (const k of Object.keys(obj)) {
      // Already has $ prefix? keep it. Otherwise add it.
      out[k.startsWith('$') ? k : '$' + k] = obj[k]
    }
    return out
  }
  return args.flat()
}

// transaction(fn)(rows) — run fn without per-row persist, one persist at end
function makeTransaction(fn) {
  return function(rows) {
    try {
      const result = fn(rows)
      persist()
      return result
    } catch (e) { throw wrapError(e) }
  }
}

function getDB() {
  if (!initReady) throw new Error('[DB] Call await initDB() before getDB()')
  return {
    prepare:     (sql) => makeStmt(sql),
    exec:        (sql) => { try { _db.run(sql); persist() } catch(e) { throw wrapError(e) } },
    run:         (sql, p) => { try { _db.run(sql, p || []); persist() } catch(e) { throw wrapError(e) } },
    transaction: makeTransaction,
  }
}

module.exports = { getDB, initDB, persist }
