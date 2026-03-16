// =============================================================
// src/components/LoadingSkeletons.jsx
//
// Animated placeholder skeletons shown while news is loading.
// This prevents layout shift and provides visual feedback.
//
// SHAPES:
//   - HeroSkeleton      : Mirrors the Hero section layout
//   - CardSkeleton      : Mirrors a NewsCard
//   - GridSkeleton      : Grid of CardSkeletons
// =============================================================

/** A single skeleton block with shimmer animation */
function SkeletonBlock({ style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(90deg, var(--color-surface-1) 25%, var(--color-surface-2) 50%, var(--color-surface-1) 75%)',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/** Hero section skeleton */
export function HeroSkeleton() {
  return (
    <div style={styles.heroWrap}>
      {/* Left large image */}
      <div style={styles.heroLeft}>
        <SkeletonBlock style={{ height: '100%', borderRadius: 0 }} />
      </div>
      {/* Right side list */}
      <div style={styles.heroRight}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={styles.heroSideItem}>
            <SkeletonBlock style={{ width: '28px', height: '28px' }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock style={{ height: '14px', marginBottom: '6px' }} />
              <SkeletonBlock style={{ height: '14px', width: '80%', marginBottom: '6px' }} />
              <SkeletonBlock style={{ height: '10px', width: '50%' }} />
            </div>
            <SkeletonBlock style={{ width: '64px', height: '64px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** A single card skeleton */
export function CardSkeleton() {
  return (
    <div style={styles.card}>
      {/* Image placeholder */}
      <SkeletonBlock style={{ height: '200px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
      {/* Content */}
      <div style={styles.cardContent}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <SkeletonBlock style={{ height: '10px', width: '80px' }} />
          <SkeletonBlock style={{ height: '10px', width: '50px', marginLeft: 'auto' }} />
        </div>
        <SkeletonBlock style={{ height: '16px', marginBottom: '8px' }} />
        <SkeletonBlock style={{ height: '16px', width: '85%', marginBottom: '8px' }} />
        <SkeletonBlock style={{ height: '16px', width: '70%', marginBottom: '12px' }} />
        <SkeletonBlock style={{ height: '12px', width: '40%' }} />
      </div>
    </div>
  )
}

/** Grid of card skeletons */
export function GridSkeleton({ count = 9 }) {
  return (
    <div style={styles.grid}>
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

const styles = {
  heroWrap: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    minHeight: '480px',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--space-8)',
  },
  heroLeft: {
    minHeight: '480px',
    background: 'var(--color-surface-1)',
  },
  heroRight: {
    borderLeft: '1px solid var(--color-border)',
    padding: 'var(--space-6)',
    background: 'var(--color-surface-1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  heroSideItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-3)',
    paddingBottom: 'var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
  },
  card: {
    background: 'var(--color-surface-1)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 'var(--space-5)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--space-5)',
    marginBottom: 'var(--space-12)',
  },
}
