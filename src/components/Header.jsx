// src/components/Header.jsx — v3
// CHANGES:
//   - Mobile hamburger menu (≤768px): categories collapse into a slide-down menu
//   - Search bar becomes full-width on mobile
//   - Date hidden on mobile (was already hidden via CSS, now properly handled)
//   - Category nav scrollable on tablet

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useNewsContext, CATEGORIES } from '../context/NewsContext'
import { categoryColors } from '../utils/categoryColors'

export default function Header() {
  const { activeCategory, setCategory, triggerSearch } = useNewsContext()
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const searchInputRef = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [searchOpen])

  // Close menu on nav
  function handleCategoryClick(id) {
    setCategory(id)
    setMenuOpen(false)
    navigate('/home')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchValue.trim()) {
      triggerSearch(searchValue.trim())
      navigate('/home')
      setSearchOpen(false)
      setMenuOpen(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <header style={styles.header}>

      {/* ── Top bar ── */}
      <div style={styles.topBar} className="container">

        {/* Logo */}
        <Link to="/home" style={styles.logo} onClick={() => { setCategory('general'); setMenuOpen(false) }}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText} className="logo-text">
            Dataverse<span style={styles.logoAccent}>News</span>
          </span>
        </Link>

        <span style={styles.dateDisplay} className="date-display">{today}</span>

        <div style={styles.actions}>
          {/* Flash Feed */}
          <Link to="/" style={styles.flashBtn} className="flash-feed-nav-btn">
            ⚡<span className="flash-feed-label" style={{ marginLeft: '4px' }}>Flash Feed</span>
          </Link>

          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
              <input
                ref={searchInputRef} type="text" value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchValue('') } }}
                placeholder="Search stories…" style={styles.searchInput}
                aria-label="Search news"
              />
              <button type="submit" style={styles.searchSubmitBtn}>↵</button>
              <button type="button"
                onClick={() => { setSearchOpen(false); setSearchValue('') }}
                style={styles.searchCloseBtn}>✕</button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} style={styles.iconBtn} aria-label="Search">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          )}

          {/* Hamburger (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(m => !m)}
            style={styles.iconBtn}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <span style={{ fontSize: '1rem', lineHeight: 1 }}>✕</span>
              : <span style={styles.hamburgerIcon}><span/><span/><span/></span>
            }
          </button>
        </div>
      </div>

      <div style={styles.divider} />

      {/* ── Category nav (desktop/tablet) ── */}
      <nav style={styles.categoryNav} className="desktop-cat-nav" aria-label="News categories">
        <div style={styles.categoryScroll} className="container">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id
            const catColor = categoryColors[cat.id] || 'var(--color-accent)'
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  ...styles.categoryBtn,
                  ...(isActive ? { color: catColor, borderBottomColor: catColor, fontWeight: 600 } : {}),
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={styles.categoryIcon}>{cat.icon}</span>
                {cat.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Mobile menu (hamburger dropdown) ── */}
      {menuOpen && (
        <div style={styles.mobileMenu} className="mobile-menu">
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} style={styles.mobileSearchForm}>
            <input
              type="text" value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search stories…"
              style={styles.mobileSearchInput}
            />
            <button type="submit" style={styles.searchSubmitBtn}>↵</button>
          </form>

          {/* Categories list */}
          <div style={styles.mobileCatList}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id
              const catColor = categoryColors[cat.id] || 'var(--color-accent)'
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    ...styles.mobileCatBtn,
                    ...(isActive ? {
                      background: catColor + '18',
                      color: catColor,
                      borderLeftColor: catColor,
                    } : {}),
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Flash Feed link in menu */}
          <Link to="/" style={styles.mobileFlashLink} onClick={() => setMenuOpen(false)}>
            ⚡ Open Flash Feed
          </Link>
        </div>
      )}
    </header>
  )
}

const styles = {
  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--color-bg-glass)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--color-border)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 'var(--header-height)', gap: 'var(--space-3)',
    padding: '0 var(--space-4)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    flexShrink: 0, textDecoration: 'none',
  },
  logoIcon: { fontSize: '1.4rem', color: 'var(--color-accent)', lineHeight: 1 },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
    fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
  },
  logoAccent: { color: 'var(--color-accent)' },
  dateDisplay: {
    fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    flex: 1, textAlign: 'center',
  },
  actions: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 },
  flashBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '5px 12px',
    background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
  },
  iconBtn: {
    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--color-text-secondary)', background: 'transparent',
    border: '1px solid var(--color-border)', cursor: 'pointer', flexShrink: 0,
  },
  hamburgerIcon: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    alignItems: 'center', justifyContent: 'center',
  },
  searchForm: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  searchInput: {
    background: 'var(--color-surface-1)', border: '1px solid var(--color-border-accent)',
    borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
    padding: 'var(--space-2) var(--space-3)', width: '200px', outline: 'none',
  },
  searchSubmitBtn: {
    background: 'var(--color-accent)', color: 'var(--color-text-inverse)',
    border: 'none', borderRadius: 'var(--radius-sm)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--text-base)', cursor: 'pointer', fontWeight: 600,
  },
  searchCloseBtn: {
    background: 'transparent', color: 'var(--color-text-muted)',
    border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', padding: '4px',
  },
  divider: { height: '1px', background: 'var(--color-border)' },
  categoryNav: { overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  categoryScroll: {
    display: 'flex', alignItems: 'stretch', gap: 0,
    minWidth: 'max-content', padding: '0 var(--space-4)',
  },
  categoryBtn: {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 400,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  categoryIcon: { fontSize: '0.72rem', opacity: 0.7 },

  // ── Mobile menu ──
  mobileMenu: {
    background: 'var(--color-bg-elevated)',
    borderTop: '1px solid var(--color-border)',
    padding: '0.75rem',
    animation: 'fadeDown 0.2s ease',
  },
  mobileSearchForm: {
    display: 'flex', gap: '0.5rem', marginBottom: '0.75rem',
  },
  mobileSearchInput: {
    flex: 1, background: 'var(--color-surface-1)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)',
    fontSize: '0.85rem', padding: '0.45rem 0.75rem', outline: 'none',
  },
  mobileCatList: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0.35rem', marginBottom: '0.75rem',
  },
  mobileCatBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.55rem 0.75rem',
    background: 'transparent',
    border: 'none',
    borderLeft: '2px solid transparent',
    borderRadius: '0 6px 6px 0',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)', fontSize: '0.82rem',
    cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s, color 0.15s',
  },
  mobileFlashLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0.65rem',
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: '8px', color: '#f59e0b',
    fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 700,
    textDecoration: 'none', gap: '0.4rem',
  },
}
