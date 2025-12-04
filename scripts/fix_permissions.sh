#!/bin/bash
# Script pour corriger les permissions des fichiers de données utilisateur

DATA_DIR="backend/data"
USER=$(whoami)

echo "🔧 Correction des permissions pour les fichiers de données..."
echo ""

# Corriger les permissions du répertoire
if [ -d "$DATA_DIR" ]; then
    echo "📁 Correction des permissions du répertoire $DATA_DIR"
    sudo chown -R $USER:$USER "$DATA_DIR"
    sudo chmod -R 755 "$DATA_DIR"
    echo "✅ Permissions du répertoire corrigées"
else
    echo "❌ Le répertoire $DATA_DIR n'existe pas"
fi

# Corriger les permissions des fichiers JSON
echo ""
echo "📄 Correction des permissions des fichiers JSON..."
find "$DATA_DIR" -name "*.json" -type f -exec sudo chown $USER:$USER {} \;
find "$DATA_DIR" -name "*.json" -type f -exec sudo chmod 644 {} \;
echo "✅ Permissions des fichiers JSON corrigées"

# Afficher les permissions actuelles
echo ""
echo "📋 Permissions actuelles :"
ls -la "$DATA_DIR" | head -10

echo ""
echo "✅ Correction terminée!"

