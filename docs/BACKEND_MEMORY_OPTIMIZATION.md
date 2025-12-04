# 🚀 Optimisation Mémoire Backend - Budget Web Youyou

## 📊 Objectif

Réduire la consommation mémoire du backend de **460 MB** à environ **200-250 MB** (réduction de ~45-50%).

---

## ✅ Optimisations Implémentées

### 1. **Lazy Loading TensorFlow** ⭐ PRIORITÉ HAUTE

**Problème** : TensorFlow était importé au niveau du module, ce qui chargeait immédiatement ~200-300 MB en mémoire même si non utilisé.

**Solution** : Implémentation d'un système de lazy loading :
- TensorFlow n'est importé que lors de la création d'un `NeuralNetworkBudgetPredictor`
- Utilisation de propriétés (`@property`) pour accéder aux modules TensorFlow
- Import différé jusqu'au moment où l'IA est réellement utilisée

**Impact estimé** : Réduction de **200-300 MB** au démarrage

**Fichiers modifiés** :
- `backend/api/ml/neural_network.py` : Refactorisation complète avec lazy loading

---

### 2. **Optimisation WAF**

**Problème** : Les logs WAF pouvaient consommer trop de mémoire.

**Solution** :
- Réduction de la taille du deque de 1000 à 500 événements
- Nettoyage périodique des IPs bloquées expirées

**Impact estimé** : Réduction de **1-2 MB**

**Fichiers modifiés** :
- `backend/api/waf.py` : Réduction `maxlen=1000` → `maxlen=500`

---

## 📈 Résultats Attendus

### Avant Optimisation
```
Backend : 460.71 MB (stable)
```

### Après Optimisation
```
Backend : 200-250 MB (estimé)
Réduction : ~210-260 MB (45-50%)
```

---

## 🔧 Détails Techniques

### Lazy Loading TensorFlow

```python
# AVANT (chargé immédiatement)
import tensorflow as tf
from tensorflow import keras

# APRÈS (chargé à la demande)
TF_AVAILABLE = None
TF_MODULE = None

def _lazy_import_tensorflow():
    global TF_AVAILABLE, TF_MODULE
    if TF_AVAILABLE is not None:
        return TF_AVAILABLE
    
    try:
        import tensorflow as tf
        # ... stockage dans TF_MODULE
        TF_AVAILABLE = True
        return True
    except ImportError:
        TF_AVAILABLE = False
        return False
```

### Utilisation dans la classe

```python
class NeuralNetworkBudgetPredictor:
    @property
    def keras(self):
        """Lazy access to Keras"""
        _lazy_import_tensorflow()
        return TF_MODULE['keras']
```

---

## 🧪 Tests de Validation

Pour vérifier l'optimisation :

```bash
# 1. Monitoring avant optimisation
make memory-monitor DURATION=5

# 2. Redémarrer avec les optimisations
docker-compose restart backend

# 3. Monitoring après optimisation
make memory-monitor DURATION=5

# 4. Comparer les résultats
make memory-analyze FILE=memory_logs/memory_YYYYMMDD_HHMMSS.csv
```

---

## 📝 Prochaines Optimisations Possibles

### Priorité Moyenne

1. **Lazy Loading des Autres Modules Lourds**
   - Charger scikit-learn seulement si nécessaire
   - Charger les services fiscaux seulement si utilisés

2. **Optimisation des Structures de Données**
   - Limiter la taille des caches
   - Nettoyer périodiquement les données obsolètes

3. **Pooling de Connexions**
   - Réutiliser les connexions aux APIs externes

### Priorité Basse

4. **Compression des Données**
   - Compresser les réponses JSON volumineuses
   - Utiliser des formats binaires pour les données fréquentes

---

## ✅ Checklist

- [x] Lazy loading TensorFlow implémenté
- [x] WAF optimisé (deque réduit)
- [ ] Tests de validation effectués
- [ ] Monitoring post-optimisation
- [ ] Documentation mise à jour

---

## 🎯 Conclusion

Les optimisations principales sont en place. La réduction de mémoire devrait être visible au prochain démarrage du backend, surtout si TensorFlow n'est pas immédiatement utilisé.

**Prochaine étape** : Effectuer un monitoring pour valider les gains réels.

