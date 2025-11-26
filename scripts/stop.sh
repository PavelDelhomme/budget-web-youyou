#!/bin/bash
# Script pour arrêter les serveurs backend et frontend

BACKEND_PORT=${BACKEND_PORT:-6060}
FRONTEND_PORT=${FRONTEND_PORT:-6061}

echo "🛑 Arrêt des serveurs..."

# Arrêt du backend
echo "Arrêt du backend sur le port ${BACKEND_PORT}..."
PIDS=$(lsof -ti:${BACKEND_PORT} 2>/dev/null || echo "")
if [ -n "$PIDS" ]; then
    echo "Processus utilisant le port ${BACKEND_PORT}: $PIDS"
    for pid in $PIDS; do
        kill -9 $pid 2>/dev/null || true
    done
    echo "✅ Port ${BACKEND_PORT} libéré"
else
    echo "⚠️  Port ${BACKEND_PORT} déjà libre"
fi

pkill -9 -f "python.*app.py" 2>/dev/null || true

# Arrêt du frontend
echo "Arrêt du frontend sur le port ${FRONTEND_PORT}..."
PIDS=$(lsof -ti:${FRONTEND_PORT} 2>/dev/null || echo "")
if [ -n "$PIDS" ]; then
    echo "Processus utilisant le port ${FRONTEND_PORT}: $PIDS"
    for pid in $PIDS; do
        kill -9 $pid 2>/dev/null || true
    done
    echo "✅ Port ${FRONTEND_PORT} libéré"
else
    echo "⚠️  Port ${FRONTEND_PORT} déjà libre"
fi

pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "node.*vite" 2>/dev/null || true
pkill -9 -f "npm.*dev" 2>/dev/null || true

echo "Attente de libération des ports..."
sleep 2

# Force l'arrêt des processus restants
if lsof -ti:${BACKEND_PORT} >/dev/null 2>&1 || lsof -ti:${FRONTEND_PORT} >/dev/null 2>&1; then
    echo "⚠️  Force l'arrêt des processus restants..."
    lsof -ti:${BACKEND_PORT} 2>/dev/null | while read pid; do
        kill -9 $pid 2>/dev/null || true
    done
    lsof -ti:${FRONTEND_PORT} 2>/dev/null | while read pid; do
        kill -9 $pid 2>/dev/null || true
    done
    sleep 1
fi

echo "✅ Serveurs arrêtés!"

