// src/App.jsx — FIXED
// Fixes:
//   1. No double Header — Header rendered exactly once in AppShell
//   2. /home route no longer injects a second Header
//   3. Flash Feed at / — full site at /home
//   4. Category navigation goes to /home not /

import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect } from 'react'

import { NewsProvider }  from './context/NewsContext'
import Header            from './components/Header'
import Footer            from './components/Footer'
import HomePage          from './pages/HomePage'
import FlashFeedPage     from './pages/FlashFeedPage'
import './styles/globals.css'

// All styles moved to globals.css — no dynamic injection needed
function GlobalHoverStyles() { return null }

// Single layout wrapper — Header rendered once here
function AppShell() {
  const location    = useLocation()
  const isFlashFeed = location.pathname === '/' || location.pathname === '/flash-feed'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header only shows on the full site (/home) */}
      {!isFlashFeed && <Header />}

      <Routes>
        {/* Flash Feed is the default */}
        <Route path="/"           element={<FlashFeedPage />} />
        <Route path="/flash-feed" element={<FlashFeedPage />} />
        {/* Full news site */}
        <Route path="/home"       element={<HomePage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>

      {!isFlashFeed && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <NewsProvider>
          <GlobalHoverStyles />
          <AppShell />
        </NewsProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
