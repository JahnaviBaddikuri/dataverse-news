// src/pages/FlashFeedPage.jsx — v6
// CHANGES:
//   - Full-bleed image card design with frosted glass text panel at bottom
//   - No more dead space — image fills entire card, text floats over bottom
//   - War Feed: mobile-responsive compact layout (no broken overflow)
//   - My Feed: category prompt every 20 articles
//   - Live: shows most recent news
//   - Swipe/scroll/keyboard navigation

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArticleModal from '../components/ArticleModal'
import { timeAgo } from '../utils/formatDate'
import SourceBadge from '../components/SourceBadge'
import {
  fetchTrending, fetchBreaking, fetchIndiaNews, fetchWarNews,
  recordView, fetchCategoryStats, fetchNews,
} from '../services/newsService'
import { categoryColors } from '../utils/categoryColors'

const TABS = [
  { id: 'feed',  label: 'My Feed',  icon: '◈' },
  { id: 'live',  label: 'Live',     icon: '🔴' },
  { id: 'india', label: 'India',    icon: '🇮🇳' },
  { id: 'war',   label: 'War Feed', icon: '⚡' },
]

const CAT_META = {
  general:       { icon: '🌐', label: 'Top Stories',   color: '#60a5fa' },
  technology:    { icon: '💻', label: 'Technology',    color: '#a78bfa' },
  business:      { icon: '📈', label: 'Business',      color: '#34d399' },
  sports:        { icon: '⚽', label: 'Sports',        color: '#fb923c' },
  health:        { icon: '🏥', label: 'Health',        color: '#f472b6' },
  science:       { icon: '🔬', label: 'Science',       color: '#22d3ee' },
  entertainment: { icon: '🎬', label: 'Entertainment', color: '#facc15' },
  world:         { icon: '🗺️', label: 'World',         color: '#94a3b8' },
  india:         { icon: '🇮🇳', label: 'India',        color: '#f97316' },
}

const CATEGORY_PROMPT_INTERVAL = 20

function stripHtml(t = '') {
  return t.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim()
}

function truncateWords(text, max = 40) {
  const clean = stripHtml(text)
  const words = clean.split(' ').filter(Boolean)
  return words.length <= max ? clean : words.slice(0, max).join(' ') + '…'
}

export default function FlashFeedPage() {
  const navigate   = useNavigate()
  const scrollRef  = useRef(null)

  const [activeTab,        setActiveTab]        = useState('feed')
  const [articles,         setArticles]         = useState([])
  const [currentIndex,     setCurrentIndex]     = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [selectedArticle,  setSelectedArticle]  = useState(null)
  const [showCatChooser,   setShowCatChooser]   = useState(false)
  const [catChooserMode,   setCatChooserMode]   = useState('end')
  const [catStats,         setCatStats]         = useState([])
  const [isMobile,         setIsMobile]         = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetchCategoryStats().then(stats => setCatStats(stats || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    setCurrentIndex(0)
    setArticles([])
    setError(null)
    setShowCatChooser(false)

    const loaders = {
      feed:  fetchTrending,
      live:  fetchBreaking,
      india: fetchIndiaNews,
      war:   fetchWarNews,
    }

    ;(loaders[activeTab] || fetchTrending)()
      .then(data => {
        const valid = (data || []).filter(a => a && a.title && a.title.length > 5 && a.title !== a.source)
        setArticles(valid)
        if (!valid.length) setError('No articles yet — backend is still fetching. Try again in 30 seconds.')
      })
      .catch(() => {
        setError('Could not load articles. Is the backend running on port 3001?')
        setArticles([])
      })
      .finally(() => setLoading(false))
  }, [activeTab])

  useEffect(() => {
    const cur = articles[currentIndex]
    if (cur?.id) recordView(cur.id)
  }, [currentIndex, articles])

  // Category prompt every 20 articles in My Feed
  useEffect(() => {
    if (activeTab !== 'feed') return
    if (articles.length === 0) return
    if (currentIndex > 0 && currentIndex % CATEGORY_PROMPT_INTERVAL === 0) {
      const t = setTimeout(() => { setCatChooserMode('interval'); setShowCatChooser(true) }, 600)
      return () => clearTimeout(t)
    }
  }, [currentIndex, activeTab, articles.length])

  // End-of-feed chooser
  useEffect(() => {
    if (articles.length > 0 && currentIndex >= articles.length - 1 && !loading) {
      const t = setTimeout(() => { setCatChooserMode('end'); setShowCatChooser(true) }, 1500)
      return () => clearTimeout(t)
    }
  }, [currentIndex, articles.length, loading])

  const goNext = useCallback(() => setCurrentIndex(i => Math.min(i + 1, articles.length - 1)), [articles.length])
  const goPrev = useCallback(() => setCurrentIndex(i => Math.max(i - 1, 0)), [])

  useEffect(() => {
    function onKey(e) {
      if (selectedArticle || showCatChooser) return
      if (e.key === 'ArrowDown' || e.key === 'j') goNext()
      if (e.key === 'ArrowUp'   || e.key === 'k') goPrev()
      if (e.key === 'Enter') { const c = articles[currentIndex]; if (c) setSelectedArticle(c) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, selectedArticle, showCatChooser, articles, currentIndex])

  const touchStartY = useRef(null)
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (showCatChooser || selectedArticle) return
    if (touchStartY.current === null) return
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev()
    touchStartY.current = null
  }

  const lastWheel = useRef(0)
  function onWheel(e) {
    if (showCatChooser || selectedArticle) return
    const now = Date.now()
    if (now - lastWheel.current < 400) return
    lastWheel.current = now
    e.deltaY > 0 ? goNext() : goPrev()
  }

  async function handleShare(article) {
    if (navigator.share) {
      try { await navigator.share({ title: article.title, url: article.url }) } catch {}
    } else {
      await navigator.clipboard.writeText(article.url).catch(() => {})
      alert('Link copied!')
    }
  }

  async function handleChooseCategory(catId) {
    setShowCatChooser(false)
    setLoading(true)
    setCurrentIndex(0)
    setArticles([])
    try {
      const data = catId === 'india' ? await fetchIndiaNews() : await fetchNews(catId)
      const valid = (data || []).filter(a => a && a.title && a.title.length > 5)
      setArticles(valid)
    } catch {
      setError('Could not load ' + catId + ' articles.')
    }
    setLoading(false)
  }

  const topCats = catStats
    .filter(c => c.category && c.count > 0)
    .slice(0, 4)
    .map(c => ({ ...c, ...(CAT_META[c.category] || { icon: '📰', label: c.category, color: '#94a3b8' }) }))
  const fallbackCats = ['technology', 'sports', 'health', 'business']
  while (topCats.length < 4) {
    const cat = fallbackCats[topCats.length]
    if (cat && !topCats.find(c => c.category === cat))
      topCats.push({ category: cat, count: 0, ...(CAT_META[cat] || {}) })
  }

  const current = articles[currentIndex]
  const isFirst = currentIndex === 0
  const isLast  = currentIndex >= articles.length - 1

  if (activeTab === 'war') {
    return (
      <div style={s.page}>
        <TopNav navigate={navigate} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <WarFeedTimeline articles={articles} loading={loading} error={error} isMobile={isMobile}
          onOpenArticle={setSelectedArticle} onRetry={() => setActiveTab(t => t)} />
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      </div>
    )
  }

  return (
    <div style={s.page} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onWheel={onWheel}>
      <TopNav navigate={navigate} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />

      {loading && (
        <div style={s.centred}>
          <div style={s.spinner} />
          <p style={s.hint}>Loading…</p>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div style={s.centred}>
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>◎</span>
          <p style={s.hint}>{error || 'No articles available.'}</p>
          <button style={s.retryBtn} onClick={() => setActiveTab(t => t)}>↺ Retry</button>
          <button style={{ ...s.retryBtn, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
            onClick={() => navigate('/home')}>Go to Full Site →</button>
        </div>
      )}

      {!loading && showCatChooser && articles.length > 0 && (
        <CategoryChooser
          mode={catChooserMode}
          topCats={topCats}
          onChoose={handleChooseCategory}
          onDismiss={() => setShowCatChooser(false)}
          onHome={() => navigate('/home')}
        />
      )}

      {!loading && articles.length > 0 && !showCatChooser && (
        <>
          <ArticleCard
            key={currentIndex}
            article={current}
            index={currentIndex}
            total={articles.length}
            isMobile={isMobile}
            isFirst={isFirst}
            isLast={isLast}
            onNext={goNext}
            onPrev={goPrev}
            onRead={() => setSelectedArticle(current)}
            onShare={() => handleShare(current)}
          />

          {/* Progress dots */}
          <div style={s.dotsRow}>
            {articles.slice(Math.max(0, currentIndex - 4), currentIndex + 5).map((_, i) => {
              const idx = Math.max(0, currentIndex - 4) + i
              return (
                <div key={idx} onClick={() => setCurrentIndex(idx)} style={{
                  height: 4, borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                  width: idx === currentIndex ? 20 : 4,
                  background: idx === currentIndex ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                }} />
              )
            })}
          </div>

          <div style={s.keyHint}>
            {isMobile ? 'Swipe up/down to navigate · tap to read' : '↑ ↓ keys · scroll wheel · swipe · Enter to read'}
          </div>
        </>
      )}
    </div>
  )
}

// ── Article Card — full-bleed image, frosted glass text at bottom ───────────
function ArticleCard({ article, index, total, isMobile, isFirst, isLast, onNext, onPrev, onRead, onShare }) {
  if (!article) return null
  const catColor = categoryColors[article.category] || '#f59e0b'

  return (
    <div style={s.card}>
      {/* Full-bleed image */}
      <div style={s.imgFull}>
        <img
          src={article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'}
          alt={article.title}
          style={s.img}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80' }}
        />
        {/* Gradient: transparent at top, dark at bottom — text sits in dark zone */}
        <div style={s.imgGradient} />
      </div>

      {/* Top overlay: source + counter */}
      <div style={s.topOverlay}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
          <SourceBadge sourceName={article.source} />
          {article.isBreaking && <span style={s.breakBadge}>● LIVE</span>}
          <span style={{ ...s.catChip, color: catColor, borderColor: catColor + '70' }}>
            {article.category?.toUpperCase()}
          </span>
        </div>
        <span style={s.counter}>{index + 1} / {total}</span>
      </div>

      {/* Bottom frosted glass panel */}
      <div style={s.glassPanel}>
        <h1 style={s.headline}>{article.title}</h1>

        {article.description && article.description !== article.title && (
          <p style={s.summary}>{truncateWords(article.description, 40)}</p>
        )}

        <div style={s.cardMeta}>
          {article.author && <span style={s.metaText}>By {article.author}</span>}
          <span style={s.metaText}>{timeAgo(article.publishedAt)}</span>
        </div>

        <div style={s.cardActions}>
          <button style={s.readBtn} onClick={onRead}>Read Full Story</button>
          <button style={s.shareBtn} onClick={onShare}>↗ Share</button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={s.srcBtn}>Source ↗</a>
        </div>
      </div>

      {/* Desktop arrow nav */}
      {!isMobile && (
        <div style={s.arrowsDesktop}>
          <button style={{ ...s.arrowBtn, opacity: isFirst ? 0.25 : 1 }} onClick={onPrev} disabled={isFirst} aria-label="Previous">↑</button>
          <button style={{ ...s.arrowBtn, opacity: isLast  ? 0.5  : 1 }} onClick={onNext} disabled={isLast}  aria-label="Next">↓</button>
        </div>
      )}
    </div>
  )
}

// ── Category Chooser ──────────────────────────────────────────────────────────
function CategoryChooser({ mode, topCats, onChoose, onDismiss, onHome }) {
  return (
    <div style={s.chooserOverlay}>
      <div style={s.chooserBox}>
        <p style={s.chooserTitle}>
          {mode === 'interval' ? '🔄 Switch Category?' : "✓ You're all caught up!"}
        </p>
        <p style={s.chooserSub}>
          {mode === 'interval'
            ? "You've read 20 stories. Want to explore a different topic?"
            : 'What would you like to read next?'}
        </p>
        <div style={s.chooserGrid}>
          {topCats.map(cat => (
            <button key={cat.category} style={{ ...s.chooserCard, borderColor: cat.color + '40' }}
              onClick={() => onChoose(cat.category)}>
              <span style={s.chooserIcon}>{cat.icon}</span>
              <span style={{ ...s.chooserLabel, color: cat.color }}>{cat.label}</span>
              {cat.count > 0 && <span style={s.chooserCount}>{cat.count} stories</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={s.chooserDismiss} onClick={onDismiss}>
            {mode === 'interval' ? '← Keep Reading' : '← Back to feed'}
          </button>
          <button style={s.chooserHome} onClick={onHome}>Full Site ↗</button>
        </div>
      </div>
    </div>
  )
}

// ── Top Nav ───────────────────────────────────────────────────────────────────
function TopNav({ navigate }) {
  return (
    <div style={s.topNav}>
      <span style={s.logo}>◈ Dataverse</span>
      <span style={s.logoSub} className="flash-feed-label">FLASH FEED</span>
      <div style={{ flex: 1 }} />
      <button style={s.exitBtn} onClick={() => navigate('/home')}>
        ✕ <span className="flash-exit-btn-text">Exit to Full Site</span>
      </button>
    </div>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={s.tabBar}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
          ...s.tabBtn,
          borderBottomColor: activeTab === tab.id ? '#f59e0b' : 'transparent',
          color: activeTab === tab.id ? '#f59e0b' : 'rgba(148,163,184,0.6)',
          fontWeight: activeTab === tab.id ? 700 : 500,
        }}>
          <span>{tab.icon}</span> {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── War Feed Timeline — mobile-first layout ───────────────────────────────────
function WarFeedTimeline({ articles, loading, error, onOpenArticle, onRetry, isMobile }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Header ── */}
      <div style={{
        padding: '1rem 1.25rem', flexShrink: 0,
        background: 'linear-gradient(135deg, #1a0000, #2d0000 50%, #0a0f1e)',
        display: 'flex', alignItems: 'center', gap: '0.65rem',
      }}>
        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔴</span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Global Conflict
          </h1>
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>
            Live Feed · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>}
      {!loading && articles.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          <p>{error || 'No conflict articles flagged yet.'}</p>
          <button style={{ marginTop: '1rem', background: '#f59e0b', color: '#0a0f1e', border: 'none', borderRadius: '8px', padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer' }} onClick={onRetry}>Retry</button>
        </div>
      )}

      {/* ── Timeline body ── */}
      {!loading && articles.length > 0 && (
        /*
          Layout math (all measured from left edge of this container):
            - DOT_LEFT = 16px  (left padding of outer div below)
            - DOT_SIZE = 10px (normal), 14px (top)
            - DOT_CENTRE = 16 + 5 = 21px  → line sits at left: 20px (1px off-centre looks better)
            - Timestamp lives in the content column, above the title, NOT beside the dot
        */
        <div style={{ position: 'relative', padding: '0.25rem 0 2rem 0' }}>

          {/* Single continuous line — left:20px = dot centre */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '1.5rem', bottom: 0,
            width: '1.5px',
            background: 'rgba(251,146,60,0.75)',
            zIndex: 0,
          }} />

          {articles.map((a, i) => {
            const isTop    = i === 0
            const isRecent = i <= 2
            const dotSize  = isTop ? 14 : 10

            const dotBg =
              isTop    ? '#fb923c' :
              isRecent ? '#fb923c' :
              i <= 5   ? '#fb923c' : '#fb923c'

            const dotBorder =
              isTop    ? '2px solid rgba(253,186,116,0.7)' :
              isRecent ? '1.5px solid rgba(194,65,12,0.5)' : 'none'

            const dotGlow =
              isTop    ? '0 0 0 5px rgba(251,146,60,0.12), 0 0 14px rgba(251,146,60,0.45)' :
              isRecent ? '0 0 0 5px rgba(251,146,60,0.12), 0 0 14px rgba(251,146,60,0.45)' : 'none'

            const timeColor =
              isTop    ? '#fb923c' :
              isRecent ? '#fb923c' : '#fb923c'

            return (
              <div key={a.id || i}
                onClick={() => onOpenArticle(a)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onOpenArticle(a)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: `${isTop ? '1.1rem' : '0.85rem'} 1rem ${isTop ? '1.1rem' : '0.85rem'} 0`,
                  cursor: 'pointer',
                  background: isTop ? 'rgba(251,146,60,0.05)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.035)',
                  transition: 'background 0.15s',
                }}>

                {/* Dot — fixed 40px column, dot centred at px 20 from container left */}
                <div style={{
                  width: '40px',
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  paddingTop: '3px',
                  zIndex: 1,
                }}>
                  <div style={{
                    width:  dotSize + 'px',
                    height: dotSize + 'px',
                    borderRadius: '50%',
                    background: dotBg,
                    border: dotBorder,
                    boxShadow: dotGlow,
                    flexShrink: 0,
                  }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Timestamp above title */}
                  <span style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    color: timeColor,
                    fontWeight: isTop ? 700 : 500,
                    marginBottom: '0.3rem',
                  }}>
                    {new Date(a.publishedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Desktop thumbnail — floated right */}
                  {a.image && !isMobile && (
                    <img src={a.image} alt=""
                      style={{ width: '110px', height: '70px', objectFit: 'cover', borderRadius: '6px', float: 'right', marginLeft: '0.75rem', marginBottom: '0.25rem', opacity: 0.75 }}
                      onError={e => { e.target.style.display = 'none' }} />
                  )}

                  {/* Title */}
                  <p style={{
                    fontSize: 'clamp(0.82rem, 2.2vw, 0.9rem)',
                    lineHeight: 1.5,
                    color: isTop ? '#fff' : isRecent ? '#e2e8f0' : '#94a3b8',
                    fontFamily: 'var(--font-display)',
                    fontWeight: isTop ? 700 : isRecent ? 600 : 400,
                    marginBottom: '0.2rem',
                    wordBreak: 'break-word',
                  }}>
                    {a.title}
                  </p>

                  {/* Source */}
                  {a.source && (
                    <span style={{ fontSize: '0.6rem', color: '#374151' }}>{a.source}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    position: 'relative', height: '100dvh',
    display: 'flex', flexDirection: 'column',
    background: '#050810', overflow: 'hidden',
    userSelect: 'none',
  },
  topNav: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(5,8,16,0.98)',
    borderBottom: '1px solid rgba(148,163,184,0.07)',
    flexShrink: 0, zIndex: 20,
  },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
    color: '#f59e0b', letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: '0.55rem', color: 'rgba(148,163,184,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.12em',
    alignSelf: 'flex-end', marginBottom: '1px',
  },
  exitBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(241,245,249,0.55)',
    borderRadius: '6px', padding: '0.28rem 0.7rem',
    fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
  },
  tabBar: {
    display: 'flex', alignItems: 'stretch',
    background: 'rgba(10,15,30,0.98)',
    borderBottom: '1px solid rgba(148,163,184,0.09)',
    flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none',
    zIndex: 20,
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.6rem 1rem',
    background: 'transparent', border: 'none',
    borderBottom: '2px solid transparent',
    fontFamily: 'var(--font-body)', fontSize: '0.82rem',
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  },

  // ── Loading/Error ──
  centred: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '1rem', color: '#64748b',
  },
  spinner: {
    width: '34px', height: '34px',
    border: '3px solid rgba(255,255,255,0.07)',
    borderTopColor: '#f59e0b', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  hint: { fontSize: '0.85rem', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6 },
  retryBtn: {
    background: '#f59e0b', color: '#0a0f1e',
    border: 'none', borderRadius: '8px',
    padding: '0.5rem 1.3rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
  },

  // ── Article Card ──
  card: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeIn 0.3s ease',
    minHeight: 0,
  },

  // Full-bleed image layer (absolute, fills entire card)
  imgFull: {
    position: 'absolute',
    inset: 0,
    background: '#0d1525',
  },
  img: {
    width: '100%', height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 25%',
    display: 'block',
  },
  // Gradient: stays mostly transparent until ~50%, then fades to semi-dark.
  // Critically, it NEVER goes fully opaque — the glass panel's backdropFilter
  // blurs the image that shows through underneath, creating the true frosted look.
  imgGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(5,8,20,0.05) 0%, rgba(5,8,20,0.15) 40%, rgba(5,8,20,0.5) 60%, rgba(5,8,20,0.72) 75%, rgba(5,8,20,0.82) 100%)',
  },

  // Top source/counter bar (absolute overlay)
  topOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.65rem 1rem',
    gap: '0.5rem',
    // Subtle top gradient so badges are readable against light images
    background: 'linear-gradient(to bottom, rgba(5,8,20,0.6) 0%, transparent 100%)',
    zIndex: 2,
  },
  breakBadge: {
    fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
    background: '#dc2626', color: '#fff', padding: '2px 7px', borderRadius: '4px',
  },
  catChip: {
    fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em',
    border: '1px solid', padding: '2px 7px', borderRadius: '4px',
    background: 'rgba(5,8,20,0.6)',
  },
  counter: {
    fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
    flexShrink: 0, whiteSpace: 'nowrap',
    background: 'rgba(5,8,20,0.5)', padding: '2px 8px', borderRadius: '20px',
  },

  // Bottom frosted glass panel
  // The gradient above keeps the image semi-visible here, so backdropFilter
  // has real image pixels to blur — creating the true frosted glass texture.
  // Lower background opacity = more image texture visible through the frost.
  glassPanel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    background: 'rgba(6, 10, 24, 0.55)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: 'clamp(0.9rem, 2.5vw, 1.4rem) clamp(1rem, 3vw, 1.75rem)',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    zIndex: 2,
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.05rem, 2.4vw, 1.65rem)',
    fontWeight: 700, lineHeight: 1.22,
    color: '#fff', letterSpacing: '-0.02em',
    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  summary: {
    fontSize: 'clamp(0.8rem, 1.6vw, 0.9rem)',
    lineHeight: 1.6, color: 'rgba(203,213,225,0.82)',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  metaText: { fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)' },
  cardActions: {
    display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
    marginTop: '0.1rem',
  },
  readBtn: {
    background: '#f59e0b', color: '#0a0f1e', border: 'none',
    borderRadius: '8px', padding: '0.45rem 1rem',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0,
  },
  shareBtn: {
    background: 'rgba(255,255,255,0.12)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px', padding: '0.45rem 0.9rem',
    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
  },
  srcBtn: {
    background: 'transparent', color: 'rgba(255,255,255,0.45)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '0.45rem 0.9rem',
    fontWeight: 500, fontSize: '0.78rem',
    cursor: 'pointer', textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center',
  },

  // Desktop arrows
  arrowsDesktop: {
    position: 'absolute', right: '1rem',
    top: '40%', transform: 'translateY(-50%)',
    display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 5,
  },
  arrowBtn: {
    width: '40px', height: '40px',
    background: 'rgba(10,15,30,0.75)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%', color: '#fff', fontSize: '1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },

  // Progress dots
  dotsRow: {
    position: 'absolute', bottom: '1.2rem',
    left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '4px', alignItems: 'center',
    zIndex: 10,
  },
  keyHint: {
    position: 'absolute', bottom: '0.4rem',
    left: '50%', transform: 'translateX(-50%)',
    fontSize: '0.56rem', color: 'rgba(255,255,255,0.2)',
    letterSpacing: '0.03em', whiteSpace: 'nowrap', zIndex: 10,
  },

  // ── Category Chooser ──
  chooserOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(5,8,20,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 15, animation: 'fadeIn 0.3s ease',
  },
  chooserBox: {
    width: 'min(460px, 92vw)',
    padding: '1.75rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
  },
  chooserTitle: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
    fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', textAlign: 'center',
  },
  chooserSub: {
    fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem',
    textAlign: 'center', lineHeight: 1.5,
  },
  chooserGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0.65rem', width: '100%',
  },
  chooserCard: {
    background: 'rgba(15,22,41,0.9)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '12px', padding: '1rem 0.85rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
    cursor: 'pointer',
  },
  chooserIcon:  { fontSize: '1.75rem', lineHeight: 1 },
  chooserLabel: { fontSize: '0.85rem', fontWeight: 700 },
  chooserCount: { fontSize: '0.66rem', color: '#4b5e7a' },
  chooserDismiss: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.45)', borderRadius: '8px',
    padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer',
  },
  chooserHome: {
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
    color: '#f59e0b', borderRadius: '8px',
    padding: '0.45rem 1rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600,
  },
}
