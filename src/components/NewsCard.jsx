// =============================================================
// src/components/NewsCard.jsx
//
// Individual news article card component.
//
// VARIANTS:
//   - default  : Standard card with image top, text below
//   - compact  : Small horizontal card (image left, text right)
//   - featured : Large card with taller image (used in grid)
//
// CHANGE: Cards now open the ArticleModal instead of redirecting
// to an external tab. The onOpenArticle prop is passed down from
// HomePage -> NewsGrid / Hero -> NewsCard.
// =============================================================

import { categoryColors } from '../utils/categoryColors'
import { timeAgo } from '../utils/formatDate'
import SourceBadge from './SourceBadge'

function stripHtml(str = '') {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim()
}

/**
 * @param {Object}   article         - Normalised article object
 * @param {string}   variant         - 'default' | 'compact' | 'featured'
 * @param {number}   index           - Position in list (for staggered animation)
 * @param {Function} onOpenArticle   - Called with article when card is clicked
 */
export default function NewsCard({ article, variant = 'default', index = 0, onOpenArticle }) {
  if (!article) return null
  // Skip empty articles (title = source name, or too short)
  if (!article.title || article.title === article.source || article.title.length < 10) return null

  const catColor = categoryColors[article.category] || categoryColors.general

  function handleClick() {
    if (onOpenArticle) {
      onOpenArticle(article)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') handleClick()
  }

  // ── Compact Variant ──────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <article
        style={{
          ...styles.compact,
          animationDelay: `${index * 50}ms`,
        }}
        className="news-card"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Read: ${article.title}`}
      >
        {/* Thumbnail */}
        <div style={styles.compactThumbWrap}>
          <img
            src={article.image}
            alt={article.title}
            style={styles.compactThumb}
            onError={e => {
              e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=70'
            }}
          />
        </div>
        {/* Text */}
        <div style={styles.compactContent}>
          <p style={styles.compactTitle}>{article.title}</p>
          <span style={styles.compactMeta}>
            {article.source} · {timeAgo(article.publishedAt)}
          </span>
        </div>
      </article>
    )
  }

  // ── Featured & Default Variants ──────────────────────────────
  const isFeatured = variant === 'featured'

  return (
    <article
      style={{
        ...styles.card,
        animationDelay: `${index * 80}ms`,
      }}
      className="news-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Read: ${article.title}`}
    >
      {/* Image */}
      <div style={{
        ...styles.imageWrap,
        height: isFeatured ? '240px' : '200px',
      }}>
        <img
          src={article.image}
          alt={article.title}
          style={styles.image}
          loading="lazy"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=70'
          }}
        />

        {/* Category ribbon */}
        <span style={{ ...styles.categoryRibbon, color: catColor, borderColor: catColor }}>
          {article.category?.toUpperCase()}
        </span>

        {/* Content availability badge (top-right of image) */}
        <span style={{
          ...styles.contentBadge,
          ...(article.fullContent
            ? { background: 'rgba(52,211,153,0.85)', color: '#fff' }
            : { background: 'rgba(10,15,30,0.7)', color: 'var(--color-text-muted)' }
          )
        }} title={article.fullContent ? 'Full article available on Dataverse' : 'Summary only'}>
          {article.fullContent ? '● Full Article' : '◇ Summary'}
        </span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Source and time */}
        <div style={styles.metaRow}>
          <SourceBadge sourceName={article.source} />
          <span style={styles.timeAgo}>{timeAgo(article.publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 style={{
          ...styles.title,
          fontSize: isFeatured ? 'var(--text-lg)' : 'var(--text-base)',
          WebkitLineClamp: isFeatured ? 3 : 2,
        }}>
          {article.title}
        </h3>

        {/* Description — only shown on featured variant */}
        {isFeatured && article.description && (() => {
          const clean = stripHtml(article.description)
          return clean ? (
            <p style={styles.description}>
              {clean.length > 120 ? clean.slice(0, 120) + '…' : clean}
            </p>
          ) : null
        })()}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.readMoreHint}>
            Read more →
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Styles ─────────────────────────────────────────────────────
const styles = {
  card: {
    background: 'var(--color-surface-1)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeUp 0.4s ease both',
    // Hover is handled with inline JS or CSS class; 
    // since inline styles can't do :hover, we use the .news-card class in globals
  },
  imageWrap: {
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--color-bg-elevated)',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
    display: 'block',
  },
  categoryRibbon: {
    position: 'absolute',
    top: 'var(--space-3)',
    left: 'var(--space-3)',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    background: 'rgba(10,15,30,0.85)',
    border: '1px solid',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
  },
  contentBadge: {
    position: 'absolute',
    top: 'var(--space-3)',
    right: 'var(--space-3)',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: 'var(--radius-sm)',
    lineHeight: 1.6,
  },
  content: {
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-2)',
  },
  timeAgo: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    lineHeight: 1.35,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  description: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--color-border)',
  },
  readMoreHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-accent)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  // ── Compact variant ──────────────────────────────────────────
  compact: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    animation: 'fadeUp 0.4s ease both',
    alignItems: 'flex-start',
  },
  compactThumbWrap: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: 'var(--color-surface-2)',
  },
  compactThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  compactContent: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    lineHeight: 1.4,
    marginBottom: 'var(--space-1)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  compactMeta: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
}
