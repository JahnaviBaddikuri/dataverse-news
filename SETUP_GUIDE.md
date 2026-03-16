# Dataverse News — Complete Setup Guide (v2)

## What's New in v2

| Feature | Details |
|---|---|
| **Flash Feed** | Full-screen swipeable reader at `/flash-feed` |
| **War Live Feed** | Timestamped conflict news timeline (tab inside Flash Feed) |
| **India News** | Knowivate API — free Indian news, no key needed |
| **SQLite Backend** | Express server caches all articles — quota used only by scheduler, never by users |
| **5 APIs total** | TheNewsAPI + GNews + Currents + Guardian + Knowivate |
| **Trending system** | View counts drive the trending feed organically |

---

## Project Structure

```
dataverse-news/               ← ROOT
├── src/                      ← React frontend (Vite)
│   ├── components/
│   │   ├── ArticleModal.jsx  ← Full article reader modal (UNCHANGED)
│   │   ├── ErrorBanner.jsx   (UNCHANGED)
│   │   ├── Footer.jsx        (UNCHANGED)
│   │   ├── Header.jsx        ← UPDATED: Flash Feed button added
│   │   ├── Hero.jsx          (UNCHANGED)
│   │   ├── LoadingSkeletons.jsx (UNCHANGED)
│   │   ├── NewsCard.jsx      (UNCHANGED)
│   │   ├── NewsGrid.jsx      (UNCHANGED)
│   │   ├── Sidebar.jsx       (UNCHANGED)
│   │   └── SourceBadge.jsx   (UNCHANGED)
│   ├── context/
│   │   └── NewsContext.jsx   ← UPDATED: India category added
│   ├── pages/
│   │   ├── HomePage.jsx      (UNCHANGED)
│   │   └── FlashFeedPage.jsx ← NEW: InShorts-style feed
│   ├── services/
│   │   └── newsService.js    ← UPDATED: calls backend first, direct APIs as fallback
│   ├── styles/globals.css    (UNCHANGED)
│   ├── utils/
│   │   ├── formatDate.js     (UNCHANGED)
│   │   └── categoryColors.js (UNCHANGED)
│   ├── App.jsx               ← UPDATED: /flash-feed route added
│   └── main.jsx              (UNCHANGED)
├── public/favicon.svg        (UNCHANGED)
├── index.html                (UNCHANGED)
├── .env                      ← UPDATED: VITE_BACKEND_URL added
├── .env.example
├── .gitignore                ← UPDATED
├── package.json              (UNCHANGED)
├── vite.config.js            ← UPDATED: proxy to backend added
├── start-backend.bat         ← NEW: Windows start script
├── start-backend.sh          ← NEW: Mac/Linux start script
│
└── backend/                  ← NEW: Express + SQLite backend
    ├── src/
    │   ├── server.js         ← Entry point
    │   ├── startup.js        ← Seeds DB on first launch
    │   ├── db/
    │   │   ├── connection.js ← SQLite init + schema + indexes
    │   │   ├── quotaManager.js ← API call counter (prevents overuse)
    │   │   └── articleQueries.js ← All DB reads
    │   ├── normalizers/
    │   │   └── index.js      ← Converts each API format to standard shape
    │   ├── scheduler/
    │   │   ├── masterScheduler.js ← Cron jobs (runs every 6-30 min)
    │   │   └── fetchAndStore.js   ← Fetches + inserts articles
    │   ├── routes/
    │   │   └── news.js       ← Express REST API routes
    │   └── cache/
    │       └── memCache.js   ← In-memory cache for hot endpoints
    ├── data/                 ← Auto-created: dataverse.db lives here
    ├── .env                  ← Your API keys (server-side, no VITE_ prefix)
    ├── .env.example
    └── package.json
```

---

## Step-by-Step Setup

### Step 1 — Frontend (same as before)

```bash
# From the dataverse-news/ folder:
npm install
npm run dev
# Opens at http://localhost:3000
```

The site works immediately using direct API calls as a fallback.

---

### Step 2 — Backend (NEW — open a second terminal)

```bash
# Open a NEW terminal window. Do NOT close the first one.
cd dataverse-news/backend
npm install
node src/server.js
```

You will see:
```
[DB] Connected to .../backend/data/dataverse.db
[Startup] DB is sparse — running initial seed...
[Startup] This may take 30-60 seconds...
[Server] ✓ Dataverse News Backend running on port 3001
[Scheduler] All 5 API jobs active.
```

After this, **all page loads are served from SQLite** — zero live API calls per user request.

---

### Step 3 — Verify it's working

Open: http://localhost:3001/health
```json
{ "status": "ok", "service": "Dataverse News Backend" }
```

Open: http://localhost:3001/api/news/status
```json
{ "db": { "total": 150, "perSource": [...] }, "quota": [...] }
```

---

## Two-Terminal Summary

| Terminal 1 | Terminal 2 |
|---|---|
| `cd dataverse-news` | `cd dataverse-news/backend` |
| `npm run dev` | `node src/server.js` |
| Frontend at :3000 | Backend at :3001 |

---

## How Flash Feed Works

Navigate to http://localhost:3000/flash-feed

**Tabs:**
- **My Feed** — trending articles (sorted by view count)
- **🔴 Live** — breaking news (published < 2 hours ago)
- **🇮🇳 India** — Indian news from Knowivate API
- **⚡ War Feed** — conflict timeline (timestamped, like InShorts screenshot)

**Navigation:**
- ↑ / ↓ arrow keys
- On-screen arrow buttons
- Swipe up/down on mobile
- Press Enter to open the full article

---

## API Quota Budget (per day)

| API | Limit | Scheduled Calls | Buffer |
|---|---|---|---|
| Guardian | 5000 | ~96 | 4904 |
| Currents | 600 | ~240 | 360 |
| TheNewsAPI | 250 | ~48 | 202 |
| GNews | 100 | ~48 | 52 |
| Knowivate | unlimited | ~72 | ∞ |

**Total: ~504 scheduled calls/day across 5 APIs**
Users never trigger API calls — only the scheduler does.

---

## Deployment (Free Tier)

### Frontend → Vercel (free)
```bash
# In root dataverse-news/ folder:
npm run build
# Upload dist/ to Vercel, or connect your GitHub repo
```
Set environment variable in Vercel dashboard:
```
VITE_BACKEND_URL = https://your-backend.railway.app
```

### Backend → Railway (free tier: $5 credit/month, enough for this)
```bash
# In dataverse-news/backend/ folder:
# Connect to Railway, set root directory to backend/
# Set all env vars in Railway dashboard (same keys as backend/.env)
```

Railway auto-detects Node.js and runs `npm start` (which runs `node src/server.js`).
SQLite database file persists in Railway's disk volume.

---

## Knowivate API Note

Knowivate is a free Indian news API with no authentication required.
The backend tries two endpoint patterns automatically:
- `https://api.knowivate.com/news`
- `https://knowivate.com/api/v1/news`

If both fail (API endpoint changed), Indian news simply won't appear —
the site continues working from other APIs. No error is thrown.

---

## Troubleshooting

**"Backend unavailable, using direct APIs"** in browser console
→ Backend terminal is not running. Start it with `node src/server.js` in the backend/ folder.

**Port 3001 already in use**
→ Change `PORT=3002` in backend/.env

**SQLite error on Windows**
→ `better-sqlite3` compiles native code. Run: `npm install --build-from-source`

**Articles not appearing after backend starts**
→ Wait 60 seconds for initial seed to complete, then refresh.
