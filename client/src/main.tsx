import React from 'react'
import ReactDOM from 'react-dom/client'
// IMPORTANT: Importer le gestionnaire d'erreurs silencieuses EN PREMIER
import './utils/silentErrorHandler'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import './index.css'

// Créer le container Portal AVANT que React ne se monte
// Cela garantit qu'il existe toujours, même après un refresh normal
if (typeof document !== 'undefined') {
  const createPortalContainer = () => {
    if (document.body && !document.getElementById('fab-portal-container')) {
      const container = document.createElement('div');
      container.id = 'fab-portal-container';
      container.style.cssText = `
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      `;
      document.body.appendChild(container);
      console.log('✅ Container Portal créé dans main.tsx');
    }
  };
  
  // Essayer immédiatement
  if (document.body) {
    createPortalContainer();
  } else {
    // Attendre que document.body soit disponible
    const observer = new MutationObserver(() => {
      if (document.body) {
        createPortalContainer();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    
    // Timeout de sécurité
    setTimeout(() => {
      observer.disconnect();
      if (document.body) {
        createPortalContainer();
      }
    }, 5000);
  }
}

// Enregistrer le Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré:', registration.scope);
      })
      .catch((error) => {
        console.error('Erreur d\'enregistrement du Service Worker:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
