// =============================================================
// src/pages/HomePage.jsx
//
// The main landing page of Dataverse News.
//
// CHANGE: Now manages the ArticleModal state.
//   - selectedArticle : the article object the user clicked on
//   - When a card is clicked, setSelectedArticle(article) is called
//   - ArticleModal receives the article and an onClose handler
//   - The onOpenArticle prop is threaded through Hero and NewsGrid
//     down to every NewsCard
//
// LAYOUT:
//   Header (sticky)
//   Hero (Featured + side list + ticker)
//   NewsGrid + Sidebar
//   ArticleModal (overlaid when an article is selected)
// =============================================================

import { useState } from 'react'
import { useNewsContext } from '../context/NewsContext'
import Hero from '../components/Hero'
import NewsGrid from '../components/NewsGrid'
import Sidebar from '../components/Sidebar'
import ArticleModal from '../components/ArticleModal'
import ErrorBanner from '../components/ErrorBanner'
import { HeroSkeleton, GridSkeleton } from '../components/LoadingSkeletons'
import { categoryLabels } from '../utils/categoryColors'

export default function HomePage() {
  const { articles, loading, error, activeCategory, searchQuery } = useNewsContext()

  // Track which article is open in the modal. null = modal closed.
  const [selectedArticle, setSelectedArticle] = useState(null)

  function handleOpenArticle(article) {
    setSelectedArticle(article)
  }

  function handleCloseArticle() {
    setSelectedArticle(null)
  }

  return (
    <main style={styles.main}>

      {/* ── Article Modal (rendered on top of everything) ── */}
      <ArticleModal
        article={selectedArticle}
        onClose={handleCloseArticle}
      />

      {/* ── Page heading (for category/search context) ───── */}
      {(activeCategory !== 'general' || searchQuery) && (
        <div className="container" style={styles.pageHeadWrap}>
          <div style={styles.pageHead}>
            <h1 style={styles.pageHeadTitle}>
              {searchQuery
                ? `Search: "${searchQuery}"`
                : categoryLabels[activeCategory] || activeCategory
              }
            </h1>
            {articles.length > 0 && !loading && (
              <span style={styles.articleCount}>
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────── */}
      {error && !loading && (
        <div className="container">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────── */}
      {loading && (
        <>
          <HeroSkeleton />
          <div className="container">
            <div className="content-layout">
              <GridSkeleton count={9} />
              <div style={styles.sidebarPlaceholder} />
            </div>
          </div>
        </>
      )}

      {/* ── Content ───────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && (
        <>
          {/* Hero: only for category browsing (not search) */}
          {!searchQuery && (
            <Hero
              articles={articles}
              onOpenArticle={handleOpenArticle}
            />
          )}

          <div className="container">
            <div className="content-layout">

              <div style={styles.gridCol}>
                <NewsGrid
                  articles={articles}
                  startAt={searchQuery ? 0 : 5}
                  onOpenArticle={handleOpenArticle}
                />
              </div>

              <div style={styles.sidebarCol} className="sidebar-col">
                <Sidebar articles={articles} />
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!loading && !error && articles.length === 0 && (
        <div className="container" style={styles.emptyState}>
          <span style={styles.emptyIcon}>◎</span>
          <h2 style={styles.emptyTitle}>No articles found</h2>
          <p style={styles.emptyText}>
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : 'No articles available right now. Try another category.'
            }
          </p>
        </div>
      )}

    </main>
  )
}

const styles = {
  main: {
    minHeight: 'calc(100vh - var(--header-height))',
  },
  pageHeadWrap: {
    paddingTop: 'var(--space-8)',
    paddingBottom: 'var(--space-6)',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--space-6)',
  },
  pageHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
  },
  pageHeadTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  articleCount: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  },
  contentLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 'var(--space-8)',
    paddingTop: 'var(--space-8)',
    alignItems: 'start',
  },
  gridCol: { minWidth: 0 },
  sidebarCol: { minWidth: 0 },
  sidebarPlaceholder: { width: '320px' },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-16) 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  emptyIcon: {
    fontSize: '3rem',
    color: 'var(--color-text-muted)',
    display: 'block',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-2xl)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  },
  emptyText: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    maxWidth: '400px',
    lineHeight: 1.6,
  },
}
