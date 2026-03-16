// src/components/NewsGrid.jsx — v4
// FIXES:
//   - "More Stories" restored (was renamed to "Continue Reading")
//   - All cards use consistent "default" variant — no more "featured" first card
//     that was causing grid overflow/layout issues
//   - Grid uses a clean 3-column layout with proper overflow containment

import NewsCard from './NewsCard'

export default function NewsGrid({ articles = [], startAt = 5, onOpenArticle }) {
  const gridArticles = articles.slice(startAt)
  if (gridArticles.length === 0) return null

  return (
    <section style={styles.section} aria-label="News articles">
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>More Stories</h2>
        <div style={styles.sectionLine} />
      </div>

      <div style={styles.grid} className="news-grid">
        {gridArticles.map((article, idx) => (
          <NewsCard
            key={article.id || idx}
            article={article}
            variant="default"
            index={idx}
            onOpenArticle={onOpenArticle}
          />
        ))}
      </div>
    </section>
  )
}

const styles = {
  section: { marginBottom: 'var(--space-12)' },
  sectionHeader: {
    display: 'flex', alignItems: 'center',
    gap: 'var(--space-4)', marginBottom: 'var(--space-6)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)', fontWeight: 600,
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap', letterSpacing: '-0.01em',
  },
  sectionLine: { flex: 1, height: '1px', background: 'var(--color-border)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--space-5)',
  },
}
