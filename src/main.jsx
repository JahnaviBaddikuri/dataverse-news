// =============================================================
// src/main.jsx
//
// React application entry point.
//
// This is the FIRST JavaScript file that runs in the browser.
// It mounts the <App /> component into the <div id="root"> in index.html.
//
// React.StrictMode:
//   - Enables extra warnings in development
//   - Runs effects twice in dev to catch side-effect bugs
//   - Has NO effect on production builds
// =============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Find the #root div in index.html and mount React into it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
