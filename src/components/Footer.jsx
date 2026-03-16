// =============================================================
// src/components/Footer.jsx
//
// Site footer with:
//   - Logo + tagline
//   - Category links
//   - API attribution
//   - Disclaimer
//   - Copyright
// =============================================================

import { Link } from 'react-router-dom'
import { useNewsContext } from '../context/NewsContext'

export default function Footer() {
  const { categories, setCategory } = useNewsContext()
  const currentYear = new Date().getFullYear()

  return (
    <footer style={styles.footer}>
      <div className="container">

        {/* ── Top Section ─────────────────────────────────── */}
        <div style={styles.top}>
          {/* Brand column */}
          <div style={styles.brandCol}>
            <div style={styles.logoRow}>
              <span style={styles.logoIcon}>◈</span>
              <span style={styles.logoText}>
                Dataverse<span style={{ color: 'var(--color-accent)' }}>News</span>
              </span>
            </div>
            <p style={styles.tagline}>
              Trusted stories. Verified sources.<br/>
              Aggregated from multiple live APIs.
            </p>
            <p style={styles.disclaimer}>
              Dataverse News is a news aggregator. All articles link to their
              original sources. We do not create editorial content.
            </p>
          </div>

          {/* Categories column */}
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Categories</h4>
            <nav style={styles.linkList}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to="/"
                  style={styles.footerLink}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.icon} {cat.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Sources column */}
          <div style={styles.linkCol}>
            <h4 style={styles.colTitle}>Data Sources</h4>
            <nav style={styles.linkList}>
              <a href="https://www.thenewsapi.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
                TheNewsAPI.com ↗
              </a>
              <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
                GNews.io ↗
              </a>
              <a href="https://currentsapi.services" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
                Currents API ↗
              </a>
              <a href="https://open-platform.theguardian.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
                The Guardian Open Platform ↗
              </a>
            </nav>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────── */}
        <div style={styles.bottom}>
          <p style={styles.copyright}>
            © {currentYear} Dataverse News. Stay Informed. Stay Ahead.
          </p>
          <p style={styles.apiNote}>
            Powered by free news APIs. Data subject to API availability.
          </p>
        </div>

      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: 'var(--color-surface-1)',
    borderTop: '1px solid var(--color-border)',
    paddingTop: 'var(--space-12)',
    paddingBottom: 'var(--space-8)',
    marginTop: 'var(--space-16)',
  },
  top: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 'var(--space-10)',
    marginBottom: 'var(--space-10)',
    paddingBottom: 'var(--space-10)',
    borderBottom: '1px solid var(--color-border)',
  },
  brandCol: {
    maxWidth: '380px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-4)',
  },
  logoIcon: {
    fontSize: '1.5rem',
    color: 'var(--color-accent)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    marginBottom: 'var(--space-4)',
    fontStyle: 'italic',
    fontFamily: 'var(--font-display)',
  },
  disclaimer: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
  },
  linkCol: {},
  colTitle: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 'var(--space-4)',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  footerLink: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  bottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
  },
  copyright: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
  apiNote: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-muted)',
  },
}
