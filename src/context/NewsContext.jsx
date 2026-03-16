// src/context/NewsContext.jsx  —  UPDATED v2
// Changes: India category added, newsService now calls backend first

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { fetchNews, searchNews } from '../services/newsService'

const NewsContext = createContext(null)

export const CATEGORIES = [
  { id:'general',       label:'Top Stories',   icon:'◈' },
  { id:'world',         label:'World',          icon:'◎' },
  { id:'technology',    label:'Technology',     icon:'◇' },
  { id:'business',      label:'Business',       icon:'◆' },
  { id:'science',       label:'Science',        icon:'△' },
  { id:'health',        label:'Health',         icon:'○' },
  { id:'sports',        label:'Sports',         icon:'◉' },
  { id:'entertainment', label:'Entertainment',  icon:'✦' },
  { id:'india',         label:'India',          icon:'🇮🇳' },
]

export function NewsProvider({ children }) {
  const [articles,       setArticles]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [activeCategory, setActiveCategory] = useState('general')
  const [searchQuery,    setSearchQuery]    = useState('')

  const loadNews = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = searchQuery.trim()
        ? await searchNews(searchQuery.trim())
        : await fetchNews(activeCategory)
      setArticles(data)
    } catch(err) {
      setError(err.message || 'Failed to load news.'); setArticles([])
    } finally { setLoading(false) }
  }, [activeCategory, searchQuery])

  useEffect(() => { loadNews() }, [loadNews])

  const value = {
    articles, loading, error, activeCategory, searchQuery,
    categories: CATEGORIES,
    setCategory:   (id) => { setSearchQuery(''); setActiveCategory(id) },
    triggerSearch: (q)  => setSearchQuery(q),
    refresh: loadNews,
  }
  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>
}

export function useNewsContext() {
  const ctx = useContext(NewsContext)
  if (!ctx) throw new Error('useNewsContext must be used inside <NewsProvider>')
  return ctx
}
