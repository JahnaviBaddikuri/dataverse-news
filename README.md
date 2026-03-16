# 📰 Dataverse News

A modern, trustworthy, and visually stunning news aggregation platform built with React + Vite.

---

## 📁 FILE STRUCTURE

```
dataverse-news/
│
├── public/
│   └── favicon.svg                    # App favicon (SVG logo)
│
├── src/
│   ├── components/
│   │   ├── Header.jsx                 # Top navigation with logo, search, categories
│   │   ├── Hero.jsx                   # Featured/breaking news hero section
│   │   ├── NewsCard.jsx               # Individual news card (image, title, summary)
│   │   ├── NewsGrid.jsx               # Grid layout for rendering multiple NewsCards
│   │   ├── Sidebar.jsx                # Trending topics + source trust badges
│   │   ├── Footer.jsx                 # Footer with links, about, disclaimer
│   │   ├── LoadingSkeletons.jsx       # Animated skeleton loaders
│   │   ├── ErrorBanner.jsx            # Error display with retry button
│   │   └── SourceBadge.jsx            # Color-coded trust badge per source
│   │
│   ├── pages/
│   │   ├── HomePage.jsx               # Main landing page (hero + grid + sidebar)
│   │   ├── CategoryPage.jsx           # Filtered news by category
│   │   └── ArticlePage.jsx            # Full article view (opens source in iframe or redirects)
│   │
│   ├── hooks/
│   │   └── useNews.js                 # Custom hook: fetch + fallback + cache logic
│   │
│   ├── services/
│   │   └── newsService.js             # API call functions for all 3 news APIs + fallback chain
│   │
│   ├── context/
│   │   └── NewsContext.jsx            # Global state: articles, loading, error, category
│   │
│   ├── utils/
│   │   ├── formatDate.js              # Date formatting utilities
│   │   └── categoryColors.js          # Category → color mapping
│   │
│   ├── styles/
│   │   └── globals.css                # CSS variables, fonts, global resets, animations
│   │
│   ├── App.jsx                        # Root component with Router setup
│   └── main.jsx                       # React entry point (ReactDOM.createRoot)
│
├── .env                               # ⚠️ API keys go here (DO NOT commit to git)
├── .gitignore                         # Ignores node_modules, .env, dist
├── index.html                         # HTML shell for Vite
├── vite.config.js                     # Vite configuration
├── package.json                       # Dependencies and scripts
└── README.md                          # This file
```

---

## 🔑 API KEYS NEEDED (all free, all production-safe)

| # | API | Free/Day | Images | Production | Env Variable |
|---|-----|----------|--------|------------|--------------|
| ① Primary  | TheNewsAPI.com | 250 req | ✅ Great   | ✅ Yes | `VITE_THENEWSAPI_KEY` |
| ② Fallback | GNews.io       | 100 req | ✅ Good    | ✅ Yes | `VITE_GNEWS_KEY`      |
| ③ Fallback | Currents API   | 600 req | ⚠️ Partial | ✅ Yes | `VITE_CURRENTS_KEY`   |

See `SETUP_GUIDE.md` for step-by-step instructions on getting each key.

---

## 🚀 SETUP INSTRUCTIONS

```bash
# 1. Clone or unzip the project
cd dataverse-news

# 2. Install dependencies
npm install

# 3. Add your API keys (see .env section below)
cp .env.example .env
# Then edit .env with your actual keys

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
```
