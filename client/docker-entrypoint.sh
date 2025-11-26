#!/bin/sh
set -e

echo "📦 Vérification des dépendances..."

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "node_modules" ] || [ ! -d "node_modules/tailwindcss" ]; then
  echo "📥 Installation des dépendances (première fois ou après volume mount)..."
  npm install
  echo "✅ Dépendances installées!"
else
  echo "✅ Dépendances déjà installées"
fi

echo "🚀 Démarrage du serveur de développement..."
exec "$@"

