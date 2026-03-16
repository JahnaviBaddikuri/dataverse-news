// src/components/ArticleModal.jsx — FIXED
// Fix: guardianMatch state machine was leaving a gap where nothing rendered.
//      Added 8s timeout so if Guardian search hangs, we show snippet mode.
//      Mobile: full-screen on small devices via CSS class.

import { useState, useEffect, useCallback } from 'react'
import { fetchGuardianArticle } from '../services/newsService'
import { formatDateTime, readingTime } from '../utils/formatDate'
import SourceBadge from './SourceBadge'

export default function ArticleModal({ article, onClose }) {
  // null = loading, false = not found, Object = found
  const [guardianMatch,   setGuardianMatch]   = useState(null)
  const [loadingContent,  setLoadingContent]  = useState(false)

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!article) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [article, handleKeyDown])

  useEffect(() => {
    if (!article) return
    setGuardianMatch(null)

    // Guardian articles already have full content — skip search
    if (article.apiSource === 'guardian' || article.fullContent) return

    setLoadingContent(true)

    // Set a timeout: if Guardian search takes > 8s, show snippet mode
    const timeout = setTimeout(() => {
      setGuardianMatch(false)
      setLoadingContent(false)
    }, 8000)

    fetchGuardianArticle(article.title)
      .then(match => {
        clearTimeout(timeout)
        setGuardianMatch(match || false)
      })
      .catch(() => {
        clearTimeout(timeout)
        setGuardianMatch(false)
      })
      .finally(() => setLoadingContent(false))

    return () => clearTimeout(timeout)
  }, [article])

  if (!article) return null

  const isGuardianDirect = article.apiSource === 'guardian' || !!article.fullContent
  const hasFullContent   = isGuardianDirect
  const hasGuardianMatch = !isGuardianDirect && !!guardianMatch && guardianMatch !== false
  const showSnippetOnly  = !isGuardianDirect && !hasGuardianMatch && guardianMatch === false

  const contentHtml    = hasFullContent ? article.fullContent : (hasGuardianMatch ? guardianMatch.fullContent : null)
  const displaySource  = hasGuardianMatch ? guardianMatch.source  : article.source
  const displayAuthor  = hasGuardianMatch ? guardianMatch.author  : article.author
  const displayDate    = hasGuardianMatch ? guardianMatch.publishedAt : article.publishedAt
  const displayImage   = (hasGuardianMatch ? guardianMatch.image : article.image) || 
                         'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'

  return (
    <>
      <div style={s.backdrop} onClick={onClose} aria-hidden="true" />

      <div style={s.modal} className="article-modal" role="dialog" aria-modal="true" aria-label={article.title}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div style={s.scroll}>
          {/* Hero image */}
          <div style={s.heroWrap}>
            <img
              src={displayImage} alt={article.title} style={s.heroImg}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80' }}
            />
            <div style={s.heroGrad} />
          </div>

          {/* Header */}
          <div style={s.header}>
            <div style={s.metaRow}>
              <SourceBadge sourceName={displaySource} />
              {isGuardianDirect && <span style={s.badge('34d399', '52,211,153')}>● Full Article</span>}
              {hasGuardianMatch  && <span style={s.badge('60a5fa', '96,165,250')}>◎ Related Coverage</span>}
              {showSnippetOnly   && <span style={s.badge('94a3b8', '148,163,184')}>◇ Summary</span>}
              <span style={s.date}>{formatDateTime(displayDate)}</span>
            </div>

            <h1 style={s.title}>{article.title}</h1>

            {(displayAuthor || contentHtml) && (
              <div style={s.byline}>
                {displayAuthor && <span style={s.author}>By {displayAuthor}</span>}
                {contentHtml   && <span style={s.readTime}>{readingTime(contentHtml.replace(/<[^>]+>/g, ''))}</span>}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={s.body}>

            {/* Loading */}
            {loadingContent && (
              <div style={s.loadWrap}>
                <div style={s.spinner} />
                <p style={s.loadText}>Fetching full article…</p>
              </div>
            )}

            {/* Full HTML content (Guardian) */}
            {!loadingContent && contentHtml && (
              <>
                {hasGuardianMatch && (
                  <div style={s.notice}>
                    <span style={{ color: '#60a5fa', flexShrink: 0 }}>ℹ</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      Showing Guardian's coverage of this topic.{' '}
                      <a href={article.url} target="_blank" rel="noopener noreferrer" style={s.link}>
                        Read original source →
                      </a>
                    </span>
                  </div>
                )}
                <div
                  className="article-body-content"
                  style={s.articleBody}
                  dangerouslySetInnerHTML={{ __html: sanitise(contentHtml) }}
                />
                <div style={s.footer}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Content from{' '}
                    <a
                      href={hasGuardianMatch ? guardianMatch.url : article.url}
                      target="_blank" rel="noopener noreferrer" style={s.link}
                    >
                      The Guardian ↗
                    </a>
                  </span>
                </div>
              </>
            )}

            {/* Snippet only — no full content available */}
            {!loadingContent && showSnippetOnly && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {article.description && (
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.75, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                    {article.description}
                  </p>
                )}
                <div style={s.snippetBox}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                    Full article on {article.source}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    The full text of this article isn't available through our free API. Click below to read it on the publisher's website.
                  </p>
                  <a
                    href={article.url} target="_blank" rel="noopener noreferrer"
                    style={s.readBtn}
                  >
                    Read Full Article ↗
                  </a>
                </div>
              </div>
            )}

            {/* Still loading (guardianMatch is null, not false yet) */}
            {!loadingContent && guardianMatch === null && !isGuardianDirect && (
              <div style={s.loadWrap}>
                <div style={s.spinner} />
                <p style={s.loadText}>Looking for full article…</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

function sanitise(html) {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/<a /gi, '<a target="_blank" rel="noopener noreferrer" ')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+data-[^=]+="[^"]*"/gi, '')
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(5,8,20,0.88)',
    zIndex: 200, backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(780px, 96vw)',
    maxHeight: '90vh',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
    zIndex: 201,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    animation: 'fadeUp 0.3s ease',
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(10,15,30,0.85)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backdropFilter: 'blur(8px)',
  },
  scroll: { overflowY: 'auto', height: '100%', scrollbarWidth: 'thin' },
  heroWrap: { position: 'relative', height: '220px', overflow: 'hidden', flexShrink: 0 },
  heroImg:  { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
    background: 'linear-gradient(to top, var(--color-bg-secondary), transparent)',
  },
  header: { padding: '1.5rem 2rem 1rem' },
  metaRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    flexWrap: 'wrap', marginBottom: '1rem',
  },
  badge: (color, rgb) => ({
    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
    color: `#${color}`,
    background: `rgba(${rgb},0.1)`,
    border: `1px solid rgba(${rgb},0.25)`,
    padding: '2px 8px', borderRadius: '4px',
  }),
  date: { marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
    fontWeight: 700, lineHeight: 1.25,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '0.75rem',
  },
  byline: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem',
  },
  author: {
    fontSize: '0.875rem', color: 'var(--color-text-secondary)',
    fontStyle: 'italic', fontFamily: 'var(--font-display)',
  },
  readTime: { fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' },
  body: { padding: '0 2rem 2rem' },
  loadWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '1rem', padding: '3rem 0',
  },
  spinner: {
    width: '32px', height: '32px',
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadText: { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  notice: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    background: 'rgba(96,165,250,0.06)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: '8px', padding: '1rem',
    marginBottom: '1.5rem',
  },
  articleBody: {
    fontSize: '1rem', lineHeight: 1.8,
    color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)',
  },
  footer: {
    marginTop: '2rem', paddingTop: '1rem',
    borderTop: '1px solid var(--color-border)',
  },
  link: { color: 'var(--color-accent)', textDecoration: 'underline' },
  snippetBox: {
    background: 'var(--color-surface-1)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px', padding: '1.5rem',
  },
  readBtn: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
    padding: '0.65rem 1.4rem', borderRadius: '8px',
    fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
    letterSpacing: '0.02em',
  },
}
