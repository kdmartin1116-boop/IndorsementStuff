import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './App.css'
import PWAManager from './utils/pwaManager'

// Initialize PWA Manager
const pwaManager = new PWAManager()

// Initialize PWA functionality
document.addEventListener('DOMContentLoaded', () => {
  pwaManager.init()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
