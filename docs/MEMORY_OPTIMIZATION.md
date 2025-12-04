# 🚀 Optimisation Mémoire - Budget Web Youyou

## 📊 État Actuel

**Consommation mémoire actuelle** :
- Backend : ~460 MB
- Frontend : ~96 MB
- **Total : ~556 MB**

## 🎯 Objectifs d'Optimisation

Réduire la consommation mémoire de **~40-50%** :
- Backend : ~250-300 MB (optimisation TensorFlow)
- Frontend : ~60-70 MB (lazy loading, memoization)

## 🔧 Optimisations Implémentées

### 1. Backend - Lazy Loading TensorFlow

**Problème** : TensorFlow charge ~200-300 MB au démarrage même si non utilisé.

**Solution** : Import lazy de TensorFlow uniquement quand nécessaire.

```python
# Avant (chargé au démarrage)
import tensorflow as tf

# Après (chargé à la demande)
def get_tensorflow():
    import tensorflow as tf
    return tf
```

### 2. Frontend - Lazy Loading des Composants

**Problème** : Tous les composants sont chargés même si non utilisés.

**Solution** : Utiliser React.lazy() pour charger les composants à la demande.

### 3. Optimisation des Structures de Données

**Problème** : Données historiques chargées entièrement en mémoire.

**Solution** :
- Limiter le nombre d'années en mémoire simultanément
- Pagination des données
- Compression des données en mémoire

### 4. Nettoyage des Intervalles et Timers

**Problème** : Intervalles et timers qui s'accumulent.

**Solution** : Nettoyer tous les timers/intervalles dans useEffect cleanup.

### 5. Optimisation WAF

**Problème** : Logs WAF qui s'accumulent.

**Solution** : Limiter la taille des deques et nettoyer périodiquement.

## 📋 Checklist d'Optimisation

- [ ] Lazy loading TensorFlow
- [ ] Lazy loading composants React lourds
- [ ] Mémoization des calculs coûteux
- [ ] Limitation taille structures de données
- [ ] Nettoyage des timers/intervalles
- [ ] Pagination des données
- [ ] Compression en mémoire si nécessaire

## 🔍 Monitoring

Pour surveiller la consommation mémoire :

```bash
# Docker stats en temps réel
docker stats budget-web-backend budget-web-frontend

# Logs de mémoire
docker-compose logs backend | grep -i memory
```

## 📝 Notes

- Les optimisations ne doivent pas affecter les performances
- Tester après chaque optimisation
- Mesurer l'impact avant/après

