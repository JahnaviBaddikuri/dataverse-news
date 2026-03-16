// src/components/Hero.jsx — v3
// FIX: heroGrid was collapsing because featuredImage used position:absolute
//      inside an absolutely-positioned wrapper with no explicit height on the grid row.
//      Now uses a clean grid with explicit heights. Also adds className hooks
//      for responsive CSS (hero-grid, hero-side-list).
// FIX: descriptions strip HTML tags before rendering.

import { useMemo } from 'react'
import { timeAgo } from '../utils/formatDate'
import { categoryColors } from '../utils/categoryColors'
import { useNewsContext } from '../context/NewsContext'
import SourceBadge from './SourceBadge'

// Strip HTML tags for display safety (descriptions may contain <strong> etc)
function stripHtml(str = '') {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

export default function Hero({ articles = [], onOpenArticle }) {
  const { activeCategory } = useNewsContext()

  const featuredArticle = articles[0]
  const sideArticles    = articles.slice(1, 5)
  const tickerArticles  = articles.slice(5, 15)

  const tickerText = useMemo(
    () => tickerArticles.map(a => a.title).join('   ◈   '),
    [tickerArticles]
  )

  if (!featuredArticle) return null

  const categoryColor = categoryColors[activeCategory] || categoryColors.general

  const isBreaking = (() => {
    const pub  = new Date(featuredArticle.publishedAt)
    const diff = (new Date() - pub) / (1000 * 60 * 60)
    return diff <= 2
  })()

  const desc = stripHtml(featuredArticle.description || '')

  return (
    <section style={s.hero} aria-label="Featured story">

      {/* ── Main grid: featured (left) + side list (right) ── */}
      <div style={s.heroGrid} className="hero-grid">

        {/* LEFT — large featured article */}
        <div
          style={s.featured}
          onClick={() => onOpenArticle && onOpenArticle(featuredArticle)}
          role="button" tabIndex={0}
          aria-label={`Read: ${featuredArticle.title}`}
          onKeyDown={e => e.key === 'Enter' && onOpenArticle && onOpenArticle(featuredArticle)}
        >
          {/* Background image */}
          <img
            src={featuredArticle.image}
            alt={featuredArticle.title}
            style={s.featImg}
            onError={e => {
              e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'
            }}
          />
          {/* Gradient for text contrast */}
          <div style={s.overlay} />

          {/* Content overlaid on image */}
          <div style={s.content}>
            <div style={s.metaRow}>
              {isBreaking && <span style={s.breakBadge}>● BREAKING</span>}
              <span style={{ ...s.catChip, color: categoryColor, borderColor: categoryColor }}>
                {activeCategory.toUpperCase()}
              </span>
            </div>

            <h1 style={s.title}>{featuredArticle.title}</h1>

            {desc && (
              <p style={s.desc}>
                {desc.length > 180 ? desc.slice(0, 180) + '…' : desc}
              </p>
            )}

            <div style={s.footer}>
              <SourceBadge sourceName={featuredArticle.source} />
              <span style={s.ts}>{timeAgo(featuredArticle.publishedAt)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT — side list of 4 articles */}
        <aside style={s.side} className="hero-side-list" aria-label="More stories">
          <p style={s.sideHeading}>
            <span style={{ color: 'var(--color-accent)' }}>◈</span>&nbsp; Top Stories
          </p>
          {sideArticles.map((art, idx) => (
            <SideCard
              key={art.id || idx}
              article={art}
              index={idx + 2}
              onClick={() => onOpenArticle && onOpenArticle(art)}
            />
          ))}
        </aside>
      </div>

      {/* ── Ticker ── */}
      {tickerArticles.length > 0 && (
        <div style={s.tickerWrap} aria-label="News ticker">
          <span style={s.tickerLabel}>LIVE</span>
          <div style={s.tickerTrack}>
            <span style={s.tickerText}>{tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}</span>
          </div>
        </div>
      )}
    </section>
  )
}

function SideCard({ article, index, onClick }) {
  const desc = stripHtml(article.description || '')
  return (
    <div style={s.sideCard} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <span style={s.sideIdx}>{String(index).padStart(2, '0')}</span>
      <div style={s.sideBody}>
        <p style={s.sideTitle}>{article.title}</p>
        <span style={s.sideMeta}>
          {article.source} · {timeAgo(article.publishedAt)}
        </span>
      </div>
      <img
        src={article.image}
        alt=""
        style={s.sideThumb}
        onError={e => { e.target.style.display = 'none' }}
      />
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────
const s = {
  hero: {
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--space-8)',
    overflow: 'hidden',
  },

  // The grid: two columns on desktop, single column on mobile (via CSS)
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    // height is controlled entirely by CSS (.hero-grid) so media queries can override it
    overflow: 'hidden',
  },

  // LEFT — fills the grid cell, image covers it
  featured: {
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    background: 'var(--color-surface-1)',
    height: '100%',   // ← always fill the grid row height
  },

  // Image fills the featured cell completely
  featImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.5s ease',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(5,8,20,0.97) 0%, rgba(5,8,20,0.65) 45%, rgba(5,8,20,0.1) 100%)',
    zIndex: 1,
  },

  content: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 'var(--space-8)',
    zIndex: 2,
  },

  metaRow: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
    marginBottom: 'var(--space-4)',
  },

  breakBadge: {
    display: 'inline-flex', alignItems: 'center',
    background: '#dc2626', color: '#fff',
    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
  },

  catChip: {
    fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
    padding: '3px 8px', border: '1px solid', borderRadius: 'var(--radius-sm)',
    background: 'transparent',
  },

  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.4rem, 2.2vw, 2.1rem)',
    fontWeight: 700, lineHeight: 1.2, color: '#fff',
    marginBottom: 'var(--space-3)', letterSpacing: '-0.02em',
    textShadow: '0 2px 12px rgba(0,0,0,0.8)',
  },

  desc: {
    fontSize: 'var(--text-sm)', color: 'rgba(241,245,249,0.75)',
    lineHeight: 1.6, marginBottom: 'var(--space-4)', maxWidth: '580px',
  },

  footer: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' },

  ts: { fontSize: 'var(--text-xs)', color: 'rgba(241,245,249,0.5)' },

  // RIGHT side panel
  side: {
    borderLeft: '1px solid var(--color-border)',
    padding: 'var(--space-5) var(--space-5)',
    background: 'var(--color-surface-1)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    height: '100%',
  },

  sideHeading: {
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
    fontWeight: 600, color: 'var(--color-text-muted)',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 'var(--space-3)',
    display: 'flex', alignItems: 'center',
  },

  sideCard: {
    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    flexShrink: 0,
  },

  sideIdx: {
    fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
    fontWeight: 700, color: 'var(--color-border)',
    lineHeight: 1, flexShrink: 0, width: '28px',
    letterSpacing: '-0.05em',
  },

  sideBody: { flex: 1, minWidth: 0 },

  sideTitle: {
    fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)',
    fontWeight: 600, color: 'var(--color-text-primary)',
    lineHeight: 1.4, marginBottom: 'var(--space-1)',
    display: '-webkit-box', WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },

  sideMeta: { fontSize: '0.7rem', color: 'var(--color-text-muted)' },

  sideThumb: {
    width: '60px', height: '60px', objectFit: 'cover',
    borderRadius: 'var(--radius-md)', flexShrink: 0,
  },

  // Ticker
  tickerWrap: {
    display: 'flex', alignItems: 'center',
    background: 'var(--color-surface-1)',
    borderTop: '1px solid var(--color-border)',
    height: '38px', overflow: 'hidden',
  },
  tickerLabel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#dc2626', color: '#fff',
    fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em',
    padding: '0 var(--space-4)', height: '100%', flexShrink: 0,
  },
  tickerTrack: {
    flex: 1, overflow: 'hidden',
    display: 'flex', alignItems: 'center',
  },
  tickerText: {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
    letterSpacing: '0.02em', lineHeight: 1,
    animation: 'ticker 60s linear infinite',
    paddingLeft: '1rem',
  },
}
