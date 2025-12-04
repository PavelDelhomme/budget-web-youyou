#!/bin/bash
# Script complet de suppression de toutes les données utilisateur
# Utilisé par les commandes make reset et make reset-and-restart

DATA_DIR="backend/data"
CONTAINER_NAME="budget-web-backend"

echo "🗑️  Suppression complète de toutes les données..."
echo ""

# Fonction pour supprimer depuis le conteneur Docker
cleanup_docker() {
    if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        echo "📦 Suppression depuis le conteneur Docker..."
        echo "   • Fichiers JSON utilisateur..."
        docker exec ${CONTAINER_NAME} sh -c "rm -f /app/data/*.json 2>/dev/null || true" || true
        
        echo "   • Cache..."
        docker exec ${CONTAINER_NAME} sh -c "rm -rf /app/data/cache/* 2>/dev/null || true" || true
        
        echo "   • Fichiers fiscaux..."
        docker exec ${CONTAINER_NAME} sh -c "rm -rf /app/data/fiscal/* 2>/dev/null || true" || true
        
        echo "   • Cache fiscal..."
        docker exec ${CONTAINER_NAME} sh -c "rm -rf /app/data/fiscal_cache/* 2>/dev/null || true" || true
        
        echo "   • Logs..."
        docker exec ${CONTAINER_NAME} sh -c "rm -rf /app/data/logs/* 2>/dev/null || true" || true
        
        echo "   • Modèles ML..."
        docker exec ${CONTAINER_NAME} sh -c "rm -rf /app/data/models/* 2>/dev/null || true" || true
        
        echo "   • Fichiers de sécurité..."
        docker exec ${CONTAINER_NAME} sh -c "rm -f /app/data/security.log 2>/dev/null || true" || true
        
        echo "✅ Données supprimées depuis le conteneur Docker"
        return 0
    else
        echo "⚠️  Conteneur ${CONTAINER_NAME} non actif"
        return 1
    fi
}

# Fonction pour supprimer depuis le système de fichiers local
cleanup_local() {
    if [ -d "${DATA_DIR}" ]; then
        echo ""
        echo "📁 Suppression depuis le système de fichiers local..."
        echo "   • Fichiers JSON utilisateur..."
        find "${DATA_DIR}" -maxdepth 1 -name "*.json" -type f ! -name ".gitkeep" -exec rm -f {} \; 2>/dev/null || true
        
        echo "   • Cache..."
        rm -rf "${DATA_DIR}/cache"/* 2>/dev/null || true
        
        echo "   • Fichiers fiscaux..."
        rm -rf "${DATA_DIR}/fiscal"/* 2>/dev/null || true
        
        echo "   • Cache fiscal..."
        rm -rf "${DATA_DIR}/fiscal_cache"/* 2>/dev/null || true
        
        echo "   • Logs..."
        rm -rf "${DATA_DIR}/logs"/* 2>/dev/null || true
        
        echo "   • Modèles ML..."
        rm -rf "${DATA_DIR}/models"/* 2>/dev/null || true
        
        echo "   • Fichiers de sécurité..."
        rm -f "${DATA_DIR}/security.log" 2>/dev/null || true
        
        echo "✅ Fichiers supprimés dans ${DATA_DIR}/"
        return 0
    else
        echo "⚠️  Répertoire ${DATA_DIR} n'existe pas"
        return 1
    fi
}

# Exécuter les nettoyages
cleanup_docker
cleanup_local

echo ""
echo "✅ Toutes les données ont été supprimées !"

