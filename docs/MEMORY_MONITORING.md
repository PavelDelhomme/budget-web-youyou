# 📊 Monitoring Mémoire - Budget Web Youyou

## 📋 Vue d'ensemble

Système complet de monitoring et d'analyse de la consommation mémoire des conteneurs Docker.

## 🚀 Utilisation

### 1. Monitoring de la mémoire

Collecte les données de consommation mémoire sur une période définie :

```bash
# Monitoring par défaut (5 minutes, intervalle de 5 secondes)
make memory-monitor

# Monitoring personnalisé (10 minutes, intervalle de 10 secondes)
make memory-monitor DURATION=10 INTERVAL=10

# Ou directement avec le script
bash scripts/monitor_memory.sh 10 10
```

**Paramètres** :
- `DURATION` : Durée du monitoring en minutes (défaut: 5)
- `INTERVAL` : Intervalle entre les mesures en secondes (défaut: 5)

**Sortie** :
- Les données sont sauvegardées dans `memory_logs/memory_YYYYMMDD_HHMMSS.csv`

### 2. Analyse des données

Analyse un fichier CSV généré par le monitoring :

```bash
# Analyser le dernier fichier
make memory-analyze FILE=memory_logs/memory_20241204_143022.csv

# Ou directement avec le script Python
python3 scripts/analyze_memory.py memory_logs/memory_20241204_143022.csv
```

**Fonctionnalités de l'analyseur** :
- Statistiques détaillées (moyenne, min, max, médiane, écart-type)
- Détection de fuites mémoire
- Identification des pics mémoire
- Analyse des tendances
- Recommandations d'optimisation
- Rapport sauvegardé dans `memory_logs/memory_YYYYMMDD_HHMMSS_report.txt`

### 3. Test complet

Lance un monitoring puis une analyse automatique :

```bash
# Test complet (5 minutes de monitoring + analyse)
make memory-test

# Test avec durée personnalisée
make memory-test DURATION=10 INTERVAL=5
```

## 📊 Format des données

Le fichier CSV contient les colonnes suivantes :

```
timestamp,container,memory_used_mb,memory_limit_mb,memory_percent,cpu_percent
2024-12-04 14:30:22,budget-web-backend,460.50,48000.00,0.96,0.49
2024-12-04 14:30:27,budget-web-frontend,96.85,48000.00,0.20,0.04
```

## 🔍 Analyse des résultats

### Statistiques fournies

Pour chaque conteneur :
- **Consommation mémoire** :
  - Minimum, Maximum, Moyenne, Médiane
  - Écart-type
  - Valeur au début et à la fin
  - Évolution (tendance)
- **Pourcentage mémoire** :
  - Moyenne et Maximum
- **CPU** :
  - Moyenne et Maximum

### Détections automatiques

1. **Fuite mémoire** :
   - Détectée si augmentation continue > 1 MB par itération
   - Alerte affichée dans le rapport

2. **Consommation élevée** :
   - Alerte si moyenne > 500 MB

3. **Pics mémoire** :
   - Identification des pics au-delà de 2 écarts-types

4. **Variation importante** :
   - Alerte si écart-type > 50 MB

## 💡 Recommandations

Le système génère automatiquement des recommandations basées sur l'analyse :

- **Fuite mémoire détectée** : "Implémenter un nettoyage mémoire périodique"
- **Consommation élevée** : "Optimiser la consommation mémoire"
- **Augmentation significative** : "Investiguer l'augmentation de X MB"
- **Variation importante** : "Stabiliser la consommation mémoire"

## 📁 Structure des fichiers

```
memory_logs/
├── memory_20241204_143022.csv          # Données brutes
├── memory_20241204_143022_report.txt   # Rapport d'analyse
└── ...
```

## 🔧 Dépendances

- **Bash** : Pour le script de monitoring
- **Python 3** : Pour l'analyseur (avec pandas/numpy optionnels)
- **Docker** : Pour accéder aux stats des conteneurs
- **bc** : Pour les calculs mathématiques (généralement pré-installé)

## 📝 Notes

- Les données sont collectées en temps réel depuis Docker
- Le monitoring peut être interrompu avec Ctrl+C
- Les fichiers sont sauvegardés automatiquement
- Les rapports incluent des graphiques ASCII si possible

## 🚨 Exemple d'utilisation complète

```bash
# 1. Lancer un monitoring de 10 minutes
make memory-monitor DURATION=10 INTERVAL=5

# 2. Analyser les résultats
make memory-analyze FILE=memory_logs/memory_20241204_143022.csv

# 3. Ou tout en un
make memory-test DURATION=10 INTERVAL=5
```

## 📊 Interprétation des résultats

### Bon état
- Consommation stable
- Pas de fuite mémoire
- Variation faible

### À surveiller
- Consommation > 300 MB
- Variation modérée
- Pics occasionnels

### Action requise
- Fuite mémoire détectée
- Consommation > 500 MB
- Variation importante (> 50 MB)

