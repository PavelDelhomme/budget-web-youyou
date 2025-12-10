import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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

// Enregistrer le Service Worker pour PWA (uniquement en production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker enregistré:', registration.scope);
        // Forcer la vérification de mise à jour immédiate
        registration.update().catch(() => {
          // Ignorer silencieusement les erreurs d'update
        });
        
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          registration.update().catch(() => {
            // Ignorer silencieusement les erreurs d'update
          });
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        // Ne logger que les erreurs critiques en production
        console.error('Erreur d\'enregistrement du Service Worker:', error);
      });
  });
  
  // Forcer la mise à jour au focus de la fenêtre (uniquement en production)
  if (import.meta.env.PROD) {
    window.addEventListener('focus', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update().catch((err) => {
              // Ignorer silencieusement les erreurs
              if (import.meta.env.DEV) {
                console.warn('⚠️ Service Worker update error (ignored in dev):', err);
              }
            });
          }
        });
      }
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
