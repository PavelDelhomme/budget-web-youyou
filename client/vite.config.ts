import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pour Docker, utilise le nom du service 'backend', sinon localhost
const getProxyTarget = () => {
  // Vérifie si on est dans Docker (le nom du service backend est disponible)
  if (process.env.VITE_PROXY_TARGET) {
    return process.env.VITE_PROXY_TARGET
  }
  // Sinon, utilise localhost (développement local sans Docker)
  return 'http://localhost:6060'
}

const proxyTarget = getProxyTarget()
console.log(`🔗 Proxy target: ${proxyTarget}`)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3030, // Port INTERNE dans le conteneur Docker (mappé vers 6061 externe dans docker-compose.yml)
    strictPort: false, // Permettre d'utiliser un autre port si 3030 est occupé
    host: '0.0.0.0', // Écouter sur toutes les interfaces réseau (accessible depuis IP locale via docker-compose)
    // HMR désactivé car ws: false
    hmr: false,
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    // Désactiver complètement les WebSockets
    ws: false,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        ws: false,
        cookieDomainRewrite: {
          '*': '', // Supprimer le domaine du cookie pour qu'il fonctionne avec le proxy
        },
        cookiePathRewrite: {
          '*': '/', // Réécrire le chemin du cookie
        },
        headers: {
          'Connection': 'keep-alive',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`Proxy error (backend non disponible) [target: ${proxyTarget}]:`, err.message);
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Service temporairement indisponible',
                message: 'Le serveur backend n\'est pas disponible. Veuillez le démarrer avec: make restart'
              }));
            }
          });
          // Log proxy requests for debugging
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // CRITICAL: Transmettre les cookies de la requête originale
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            // S'assurer que les headers de connexion sont corrects
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // CRITICAL: Transmettre les cookies Set-Cookie du backend vers le client
            // Le proxy doit préserver les headers Set-Cookie tels quels
            if (proxyRes.headers['set-cookie']) {
              // Les headers Set-Cookie sont automatiquement transmis par http-proxy-middleware
              // Mais on peut les logger pour debug
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Cookies Set-Cookie reçus du backend:', proxyRes.headers['set-cookie']);
              }
            }
            // S'assurer que Access-Control-Allow-Credentials est présent
            if (!proxyRes.headers['access-control-allow-credentials']) {
              proxyRes.headers['access-control-allow-credentials'] = 'true';
            }
          });
        },
      },
    },
  },
})
