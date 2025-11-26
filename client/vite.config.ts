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
    port: 3030,
    strictPort: true, // Fail if port is already in use instead of trying another port
    host: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        ws: false,
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
        },
      },
    },
  },
})
