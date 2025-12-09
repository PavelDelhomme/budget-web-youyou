# 🔍 Vérification de la Configuration du Cache

## 📁 Dossiers de cache existants

```
backend/data/
├── cache/              # Cache ML (vide actuellement)
├── fiscal_cache/       # Cache fiscal (vide actuellement)
├── fiscal/             # Données fiscales
├── logs/               # Logs
├── models/             # Modèles ML
└── dev_delhomme.ovh.json  # Données utilisateur
```

## ✅ Systèmes de cache implémentés

### 1. Cache ML (`backend/api/ml/cache.py`)
- **Classe** : `MLCache`
- **Emplacement prévu** : `backend/data/cache/` (vide actuellement)
- **Utilisation** : Pour les prédictions ML et les scores d'entraînement
- **TTL** : 24h par défaut
- **Format** : Fichiers `.cache` (pickle) + `.meta.json` (métadonnées)

### 2. Cache Fiscal (`backend/api/government_fiscal_regulations.py`)
- **Emplacement** : `backend/data/fiscal_cache/` (vide actuellement)
- **Utilisation** : Cache des régulations fiscales gouvernementales
- **TTL** : 24h
- **Format** : Fichiers JSON `regulations_{year}.json`

### 3. Cache Fiscal Calendar (`backend/api/government_fiscal_calendar.py`)
- **Emplacement** : À vérifier
- **Utilisation** : Calendrier fiscal

### 4. Cache Deductions (`backend/api/government_deductions_service.py`)
- **Emplacement** : À vérifier
- **Utilisation** : Déductions fiscales

## ❌ Problèmes détectés

### Problème 1 : Cache ML non initialisé
- Le dossier `backend/data/cache/` existe mais est vide
- `MLCache` n'est pas utilisé dans `ml_service.py` actuellement
- Il faut initialiser le cache dans `ml_service.py`

### Problème 2 : Chemins de cache non standardisés
- Certains caches utilisent des chemins relatifs
- Pas de gestion centralisée des chemins de cache

### Problème 3 : Pas de nettoyage automatique
- Les caches expirés ne sont pas nettoyés automatiquement
- Risque d'accumulation de fichiers

## 🔧 Actions à prendre

### 1. Initialiser le cache ML dans `ml_service.py`
```python
from api.ml.cache import create_ml_cache
from api.utils import DATA_DIR

# Initialiser le cache ML
ml_cache = create_ml_cache(DATA_DIR / 'cache')
```

### 2. Standardiser les chemins de cache
```python
# Dans utils.py
CACHE_DIR = DATA_DIR / 'cache'
FISCAL_CACHE_DIR = DATA_DIR / 'fiscal_cache'
MODELS_DIR = DATA_DIR / 'models'
LOGS_DIR = DATA_DIR / 'logs'
```

### 3. Ajouter le nettoyage automatique
- Créer un script de nettoyage
- L'exécuter périodiquement (cron job ou au démarrage)

### 4. Vérifier tous les services gouvernementaux
- `government_fiscal_calendar.py`
- `government_deductions_service.py`
- S'assurer qu'ils utilisent les bons chemins

## 📋 Checklist

- [ ] Initialiser le cache ML dans `ml_service.py`
- [ ] Vérifier que `government_fiscal_calendar.py` utilise le bon chemin
- [ ] Vérifier que `government_deductions_service.py` utilise le bon chemin
- [ ] Standardiser tous les chemins de cache dans `utils.py`
- [ ] Ajouter un script de nettoyage automatique
- [ ] Tester que les caches fonctionnent correctement
- [ ] Documenter la configuration du cache

