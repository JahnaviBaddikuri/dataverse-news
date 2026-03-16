// =============================================================
// src/components/Sidebar.jsx
//
// Right sidebar displayed on desktop alongside the news grid.
//
// SECTIONS:
//   1. About Dataverse — mission statement + trust badge
//   2. Trending Topics — extracted from current article titles
//   3. Data Sources    — which APIs are in use
//   4. Category quick-nav
// =============================================================

import { useMemo } from 'react'
import { useNewsContext } from '../context/NewsContext'
import { categoryColors } from '../utils/categoryColors'

export default function Sidebar({ articles = [] }) {
  const { categories, setCategory, activeCategory } = useNewsContext()

  /**
   * Extract trending keywords from article titles.
   * Simple word frequency counter; filters common stop words.
   */
  const trendingTopics = useMemo(() => {
    const stopWords = new Set([
      'the','a','an','and','or','but','in','on','at','to','for',
      'of','with','by','from','as','is','was','are','were','be',
      'been','being','have','has','had','do','does','did','will',
      'would','could','should','may','might','shall','can','that',
      'this','these','those','it','its','he','she','they','we',
      'you','i','my','your','his','her','their','our','what','how',
      'when','where','why','who','which','after','before','into',
      'over','under','up','out','about','new','says','said',
    ])

    const freq = {}
    articles.forEach(article => {
      if (!article.title) return
      const words = article.title
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)

      words.forEach(word => {
        if (word.length < 4) return
        if (stopWords.has(word)) return
        freq[word] = (freq[word] || 0) + 1
      })
    })

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }, [articles])

  return (
    <aside style={styles.sidebar}>

      {/* ── 1. About ─────────────────────────────────────── */}
      <div style={styles.widget}>
        <div style={styles.logoMark}>◈</div>
        <h3 style={styles.widgetTitle} id="about-widget">About Dataverse</h3>
        <p style={styles.widgetText}>
          Dataverse News aggregates stories from verified global sources using
          multiple live APIs. We prioritise accuracy, source transparency, and
          editorial independence.
        </p>
        <div style={styles.trustBadges}>
          <TrustPill icon="✓" label="Multi-source" />
          <TrustPill icon="✓" label="Real-time" />
          <TrustPill icon="✓" label="Verified" />
        </div>
      </div>

      {/* ── 2. Trending Keywords ──────────────────────────── */}
      {trendingTopics.length > 0 && (
        <div style={styles.widget}>
          <h3 style={styles.widgetTitle}>Trending Keywords</h3>
          <div style={styles.tagCloud}>
            {trendingTopics.map(({ word, count }) => (
              <span
                key={word}
                style={{
                  ...styles.tag,
                  // Scale tag size slightly based on frequency
                  fontSize: `${Math.min(0.75 + count * 0.04, 0.95)}rem`,
                  opacity: Math.min(0.5 + count * 0.08, 1),
                }}
              >
                {word}
                <span style={styles.tagCount}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Data Sources ──────────────────────────────── */}
      <div style={styles.widget}>
        <h3 style={styles.widgetTitle}>Data Sources</h3>
        <div style={styles.sourceList}>
          <SourceRow
            num="①"
            name="TheNewsAPI.com"
            detail="Headlines · 250 req/day"
            url="https://www.thenewsapi.com"
            color="var(--cat-technology)"
          />
          <SourceRow
            num="②"
            name="GNews.io"
            detail="Headlines · 100 req/day"
            url="https://gnews.io"
            color="var(--cat-business)"
          />
          <SourceRow
            num="③"
            name="Currents API"
            detail="Latest news · 600 req/day"
            url="https://currentsapi.services"
            color="var(--cat-health)"
          />
          <SourceRow
            num="④"
            name="The Guardian"
            detail="Full articles · 5000 req/day"
            url="https://open-platform.theguardian.com"
            color="var(--cat-science)"
          />
        </div>
        <p style={styles.sourceNote}>
          All 4 APIs run simultaneously. Guardian articles include full body text. Cards with a green badge can be read entirely on Dataverse.
        </p>
      </div>

      {/* ── 4. Quick Category Nav ────────────────────────── */}
      <div style={styles.widget}>
        <h3 style={styles.widgetTitle}>Browse by Category</h3>
        <div style={styles.categoryList}>
          {categories.map(cat => {
            const isActive = cat.id === activeCategory
            const color = categoryColors[cat.id]
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  ...styles.categoryItem,
                  ...(isActive ? {
                    background: 'var(--color-accent-dim)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  } : {}),
                }}
              >
                <span style={{ color }}>{cat.icon}</span>
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function TrustPill({ icon, label }) {
  return (
    <span style={styles.trustPill}>
      <span style={{ color: '#34d399' }}>{icon}</span>
      {label}
    </span>
  )
}

function SourceRow({ num, name, detail, url, color }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.sourceRow}
    >
      <span style={{ ...styles.sourceNum, color }}>{num}</span>
      <div>
        <p style={styles.sourceName}>{name}</p>
        <p style={styles.sourceDetail}>{detail}</p>
      </div>
      <span style={styles.externalIcon}>↗</span>
    </a>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const styles = {
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
    position: 'sticky',
    top: 'calc(var(--header-height) + 72px + var(--space-6))', // Header + category bar
    height: 'fit-content',
  },
  widget: {
    background: 'var(--color-surface-1)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
  },
  logoMark: {
    fontSize: '1.5rem',
    color: 'var(--color-accent)',
    marginBottom: 'var(--space-3)',
  },
  widgetTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 'var(--space-4)',
  },
  widgetText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.7,
    marginBottom: 'var(--space-4)',
  },
  trustBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
  },
  trustPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.2)',
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-xs)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-sm)',
  },
  tagCloud: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    padding: '3px 8px',
    borderRadius: '20px',
    cursor: 'default',
    transition: 'border-color var(--transition-fast)',
  },
  tagCount: {
    fontSize: '0.6rem',
    color: 'var(--color-text-muted)',
  },
  sourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    marginBottom: 'var(--space-3)',
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    textDecoration: 'none',
    transition: 'background var(--transition-fast)',
  },
  sourceNum: {
    fontSize: '1.1rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  sourceName: {
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  sourceDetail: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  externalIcon: {
    marginLeft: 'auto',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-xs)',
  },
  sourceNote: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all var(--transition-fast)',
  },
}
