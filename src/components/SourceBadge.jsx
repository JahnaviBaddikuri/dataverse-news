// =============================================================
// src/components/SourceBadge.jsx
//
// Displays a small colored trust badge for a news source.
// Color-coded: green = verified, blue = established, grey = other
// =============================================================

import { getTrustLevel } from '../utils/categoryColors'

/**
 * @param {string} sourceName - Name of the news source
 * @param {boolean} showDot   - Show the colored dot indicator
 */
export default function SourceBadge({ sourceName = 'Unknown', showDot = true }) {
  const trust = getTrustLevel(sourceName)

  return (
    <span style={{
      ...styles.badge,
      color: trust.color,
    }}>
      {showDot && (
        <span style={{ ...styles.dot, background: trust.color }} />
      )}
      {sourceName}
    </span>
  )
}

const styles = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
}
