import React from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary'
import SeoProvider from './components/seo/SeoProvider'
import App from './App'
import './index.css'
import { LanguageProvider } from './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SeoProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </SeoProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
