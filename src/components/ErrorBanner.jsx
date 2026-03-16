// =============================================================
// src/components/ErrorBanner.jsx
//
// Displayed when all news APIs fail to return data.
// Shows a clear explanation + a retry button.
// =============================================================

import { useNewsContext } from '../context/NewsContext'

export default function ErrorBanner({ message }) {
  const { refresh } = useNewsContext()

  return (
    <div style={styles.banner} role="alert" aria-live="assertive">
      {/* Icon */}
      <div style={styles.icon}>⚠</div>

      {/* Message */}
      <div style={styles.content}>
        <h3 style={styles.title}>Unable to load news</h3>
        <p style={styles.message}>
          {message || 'Something went wrong fetching the latest articles.'}
        </p>

        {/* Troubleshooting tips */}
        <div style={styles.tips}>
          <p style={styles.tipsTitle}>Things to check:</p>
          <ul style={styles.tipsList}>
            <li>Have you added your API keys to the <code style={styles.code}>.env</code> file?</li>
            <li>Are you running the project from the <code style={styles.code}>dataverse-news/</code> folder?</li>
            <li>Have you restarted the dev server after adding keys? (<code style={styles.code}>npm run dev</code>)</li>
            <li>Check your browser console for more detailed error info.</li>
          </ul>
        </div>
      </div>

      {/* Retry button */}
      <button style={styles.retryBtn} onClick={refresh} aria-label="Retry loading news">
        ↺ Retry
      </button>
    </div>
  )
}

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-5)',
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-8)',
    margin: 'var(--space-8) 0',
    animation: 'fadeUp 0.4s ease',
  },
  icon: {
    fontSize: '2rem',
    color: '#f87171',
    flexShrink: 0,
    lineHeight: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
    color: '#f87171',
    marginBottom: 'var(--space-2)',
  },
  message: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.7,
    marginBottom: 'var(--space-4)',
    fontFamily: 'monospace',
    background: 'rgba(0,0,0,0.3)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  tips: {
    borderTop: '1px solid var(--color-border)',
    paddingTop: 'var(--space-4)',
  },
  tipsTitle: {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-2)',
  },
  tipsList: {
    paddingLeft: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    listStyleType: 'disc',
  },
  code: {
    fontFamily: 'monospace',
    background: 'rgba(245,158,11,0.15)',
    color: 'var(--color-accent)',
    padding: '1px 4px',
    borderRadius: '3px',
    fontSize: '0.85em',
  },
  retryBtn: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background var(--transition-fast)',
    letterSpacing: '0.03em',
  },
}
