/**
 * Service Worker pour PWA
 * Cache des assets statiques pour fonctionnement hors ligne
 */

const CACHE_NAME = 'budget-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  
  // Ignorer les requêtes d'extensions Chrome et autres schémas non-HTTP
  if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
    return; // Laisser passer les requêtes non-HTTP sans interception
  }
  
  // Ne pas intercepter les requêtes API
  if (requestUrl.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourner depuis le cache si disponible
      if (response) {
        return response;
      }

      // Sinon, fetch depuis le réseau
      return fetch(event.request).then((response) => {
        // Ne pas mettre en cache les réponses non valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Vérifier que la requête est une requête HTTP/HTTPS valide avant de mettre en cache
        if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
          return response; // Ne pas mettre en cache les requêtes non-HTTP
        }

        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          try {
            cache.put(event.request, responseToCache);
          } catch (error) {
            // Ignorer les erreurs de cache (ex: chrome-extension, data:, etc.)
            console.debug('Cache ignoré pour:', requestUrl);
          }
        });

        return response;
      }).catch((error) => {
        // En cas d'erreur de fetch, retourner une réponse d'erreur
        console.error('Erreur fetch dans Service Worker:', error);
        throw error;
      });
    })
  );
});

