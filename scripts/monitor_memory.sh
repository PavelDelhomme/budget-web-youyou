#!/bin/bash
# Script de monitoring de la consommation mémoire des conteneurs Docker
# Collecte les données sur une période définie et les sauvegarde dans un fichier CSV

# Configuration
DURATION_MINUTES=${1:-5}  # Durée du monitoring en minutes (défaut: 5 minutes)
INTERVAL_SECONDS=${2:-5}  # Intervalle entre les mesures en secondes (défaut: 5 secondes)
OUTPUT_DIR="memory_logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${OUTPUT_DIR}/memory_${TIMESTAMP}.csv"
CONTAINERS=("budget-web-backend" "budget-web-frontend")

# Créer le répertoire de sortie
mkdir -p "${OUTPUT_DIR}"

echo "🔍 Démarrage du monitoring mémoire..."
echo "⏱️  Durée: ${DURATION_MINUTES} minutes"
echo "⏳ Intervalle: ${INTERVAL_SECONDS} secondes"
echo "📁 Fichier de sortie: ${OUTPUT_FILE}"
echo ""

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Erreur: Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

# Vérifier que les conteneurs existent
for container in "${CONTAINERS[@]}"; do
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        echo "⚠️  Avertissement: Le conteneur ${container} n'est pas en cours d'exécution"
    fi
done

# En-têtes CSV
echo "timestamp,container,memory_used_mb,memory_limit_mb,memory_percent,cpu_percent" > "${OUTPUT_FILE}"

# Calculer le nombre total d'itérations
TOTAL_ITERATIONS=$((DURATION_MINUTES * 60 / INTERVAL_SECONDS))
CURRENT_ITERATION=0

echo "📊 Collecte des données en cours..."
echo ""

# Fonction pour convertir GiB en MB
convert_to_mb() {
    local value=$1
    local unit=$(echo "${value}" | grep -oE '[A-Za-z]+$')
    local num=$(echo "${value}" | grep -oE '^[0-9.]+')
    
    if [ "${unit}" = "GiB" ] || [ "${unit}" = "GB" ]; then
        echo "${num} * 1024" | bc 2>/dev/null | awk '{printf "%.2f", $1}'
    elif [ "${unit}" = "MiB" ] || [ "${unit}" = "MB" ]; then
        echo "${num}" | awk '{printf "%.2f", $1}'
    elif [ "${unit}" = "KiB" ] || [ "${unit}" = "KB" ]; then
        echo "${num} / 1024" | bc 2>/dev/null | awk '{printf "%.2f", $1}'
    else
        echo "0"
    fi
}

# Fonction pour obtenir les stats d'un conteneur
get_container_stats() {
    local container=$1
    local stats_output=$(docker stats --no-stream --format "{{.MemUsage}}|{{.CPUPerc}}" "${container}" 2>/dev/null)
    
    if [ -z "${stats_output}" ]; then
        return
    fi
    
    IFS='|' read -r mem_usage cpu_perc <<< "${stats_output}"
    
    # Extraire la mémoire utilisée et la limite
    mem_used_str=$(echo "${mem_usage}" | awk '{print $1}')
    mem_limit_str=$(echo "${mem_usage}" | awk '{print $3}')
    
    # Convertir en MB
    mem_used=$(convert_to_mb "${mem_used_str}")
    mem_limit=$(convert_to_mb "${mem_limit_str}")
    
    # Si la limite n'est pas disponible ou est 0, utiliser une valeur par défaut
    if [ -z "${mem_limit}" ] || [ "${mem_limit}" = "0" ]; then
        mem_limit="0"
        mem_percent="0"
    else
        # Calculer le pourcentage de mémoire
        mem_percent=$(echo "scale=2; (${mem_used} / ${mem_limit}) * 100" | bc 2>/dev/null || echo "0")
    fi
    
    # Nettoyer le CPU (enlever le %)
    cpu_perc=$(echo "${cpu_perc}" | sed 's/%//' | sed 's/--/0/')
    
    echo "${mem_used},${mem_limit},${mem_percent},${cpu_perc}"
}

# Boucle de monitoring
START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION_MINUTES * 60))

while [ $(date +%s) -lt ${END_TIME} ]; do
    CURRENT_ITERATION=$((CURRENT_ITERATION + 1))
    TIMESTAMP_NOW=$(date +"%Y-%m-%d %H:%M:%S")
    ELAPSED_SECONDS=$(($(date +%s) - START_TIME))
    ELAPSED_MINUTES=$((ELAPSED_SECONDS / 60))
    ELAPSED_SECONDS_REMAINING=$((ELAPSED_SECONDS % 60))
    
    # Afficher la progression
    printf "\r⏳ Progression: %02d:%02d / %02d:00 | Iteration %d/%d" \
        "${ELAPSED_MINUTES}" "${ELAPSED_SECONDS_REMAINING}" \
        "${DURATION_MINUTES}" "${CURRENT_ITERATION}" "${TOTAL_ITERATIONS}"
    
    # Collecter les stats pour chaque conteneur
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            STATS=$(get_container_stats "${container}")
            if [ -n "${STATS}" ]; then
                IFS=',' read -r mem_used mem_limit mem_percent cpu_perc <<< "${STATS}"
                echo "${TIMESTAMP_NOW},${container},${mem_used},${mem_limit},${mem_percent},${cpu_percent}" >> "${OUTPUT_FILE}"
            fi
        fi
    done
    
    # Attendre avant la prochaine mesure
    sleep "${INTERVAL_SECONDS}"
done

echo ""
echo ""
echo "✅ Monitoring terminé!"
echo "📁 Données sauvegardées dans: ${OUTPUT_FILE}"
echo ""
echo "📊 Résumé:"
echo "   - Durée totale: ${DURATION_MINUTES} minutes"
echo "   - Nombre de mesures: ${CURRENT_ITERATION}"
echo "   - Fichier: ${OUTPUT_FILE}"
echo ""
echo "🔍 Pour analyser les données, exécutez:"
echo "   python3 scripts/analyze_memory.py ${OUTPUT_FILE}"

