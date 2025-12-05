/**
 * Gestion silencieuse des erreurs pour éviter la pollution de la console
 * Intercepte les erreurs 401 (non authentifié) et WebSocket qui sont normales
 */

// Sauvegarder les fonctions originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Liste des messages d'erreur à ignorer
const IGNORED_ERRORS = [
  'not authenticated',
  '401',
  'unauthorized',
  'websocket',
  'failed to connect to websocket',
  'hmr',
  'webpack',
  'vite',
  'ws://',
  'websocket connection',
  'websocket connection to',
  'setupwebsocket',
  'client:536',
  'installhook',
  'your current setup',
  'check out your vite',
  'network configuration',
  'server-options',
  'overrideMethod',
  'failed to connect',
  'connection failed',
  'session-check',
  'session check',
  'could not load years',
  'could not load global',
  'could not load year data',
  'get?year=',
  'api/years',
  'api/global',
  'api/get',
  'api/fiscal',
  'uauthenticated', // Typo possible
];

// Fonction pour vérifier si une erreur doit être ignorée
function shouldIgnoreError(...args: any[]): boolean {
  if (args.length === 0) return false;
  
  // Vérifier chaque argument
  for (const arg of args) {
    if (!arg) continue;
    
    const messageStr = String(arg).toLowerCase();
    
    // Vérifier si le message contient un pattern à ignorer
    if (IGNORED_ERRORS.some(ignored => messageStr.includes(ignored))) {
      return true;
    }
    
    // Vérifier si c'est une URL avec 401 dans le chemin
    if (typeof arg === 'string' && (arg.includes('/api/') && (arg.includes('401') || arg.includes('unauthorized')))) {
      return true;
    }
    
    // Vérifier si c'est un objet d'erreur avec status 401
    if (arg && typeof arg === 'object') {
      if ('status' in arg && arg.status === 401) {
        return true;
      }
      if ('message' in arg && shouldIgnoreError(arg.message)) {
        return true;
      }
    }
  }
  
  return false;
}

// Intercepter window.onerror pour masquer les erreurs 401 et WebSocket
if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const messageStr = String(message || '').toLowerCase();
    
    // Ignorer les erreurs WebSocket et 401
    if (shouldIgnoreError(messageStr, source, error)) {
      return true; // Empêcher l'affichage dans la console
    }
    
    // Appeler le gestionnaire d'erreur original
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    
    return false;
  };
  
  // Intercepter window.onunhandledrejection pour masquer les erreurs 401
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    
    // Ignorer les erreurs 401 et WebSocket
    if (shouldIgnoreError(reason, String(reason))) {
      event.preventDefault(); // Empêcher l'affichage dans la console
      return;
    }
    
    // Appeler le gestionnaire original
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection.call(window, event);
    }
  };
}

// Surcharger console.error
console.error = (...args: any[]) => {
  // Ignorer les erreurs 401 et WebSocket
  if (shouldIgnoreError(...args)) {
    return; // Ne pas afficher l'erreur
  }
  
  // Afficher les autres erreurs normalement
  originalConsoleError.apply(console, args);
};

// Surcharger console.warn pour filtrer les warnings WebSocket
console.warn = (...args: any[]) => {
  // Ignorer les warnings WebSocket et HMR
  if (shouldIgnoreError(...args)) {
    return; // Ne pas afficher le warning
  }
  
  // Afficher les autres warnings normalement
  originalConsoleWarn.apply(console, args);
};

// Exporter une fonction pour restaurer la console originale si nécessaire
export function restoreConsole() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  if (typeof window !== 'undefined') {
    window.onerror = null;
    window.onunhandledrejection = null;
  }
}
