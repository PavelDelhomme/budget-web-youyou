# Système d'IA Locale pour les Prédictions de Budget

Ce document explique le système d'Intelligence Artificielle locale mis en place pour générer des prédictions de budget personnalisées.

## 🎯 Vue d'ensemble

Le système utilise du **Machine Learning local** (sans API externe) pour apprendre des habitudes budgétaires de l'utilisateur et prédire les budgets futurs. Les modèles sont entraînés uniquement sur **vos propres données historiques**, garantissant la confidentialité totale.

## 🔧 Architecture Technique

### Technologies Utilisées

- **scikit-learn** : Bibliothèque ML de référence pour Python
- **Random Forest** : Pour prédire les dépenses totales (non-linéaire, robuste)
- **Ridge Regression** : Pour prédire les revenus (linéaire avec régularisation)
- **Gradient Boosting** : Pour prédire l'épargne (modèle puissant pour tendances complexes)
- **NumPy** : Calculs numériques optimisés

### Structure des Modules

```
backend/api/ml/
├── __init__.py           # Module init
├── features.py           # Feature engineering (extraction de caractéristiques)
└── model.py             # Modèles ML et entraînement

backend/api/
└── ml_service.py        # API endpoints pour ML
```

## 📊 Feature Engineering (Extraction de Caractéristiques)

Le système extrait **15 caractéristiques** de chaque année historique :

1. **Année normalisée** : Position temporelle (pour détecter les tendances)
2. **Total dépenses annuelles** : Toutes les dépenses combinées
3. **Revenus annuels** : Salaire mensuel × 12
4. **Nombre de catégories** : Diversité du budget
5. **Nombre d'abonnements** : Engagement récurrent
6. **Dépenses fixes annuelles** : Coûts non-récurrents
7. **Épargne initiale** : Point de départ
8. **Nombre de dépenses** : Fréquence des transactions
9. **Variance des dépenses par catégorie** : Équilibre du budget
10. **Tendance des dépenses** : Augmentation/diminution vs année précédente
11. **Ratio épargne/revenus** : Santé financière
12. **Dépenses par mois moyen** : Consommation mensuelle
13. **Total dépenses réelles** : Ce qui a réellement été dépensé
14. **Différence budget vs réel** : Précision du budget
15. **Diversité des dépenses** : Nombre de catégories utilisées

## 🤖 Modèles d'IA

### 1. Prédiction des Dépenses Totales
- **Modèle** : Random Forest Regressor
- **Avantages** : Capture les relations non-linéaires, robuste aux outliers
- **Paramètres** : 100 arbres, profondeur max 10

### 2. Prédiction des Revenus
- **Modèle** : Ridge Regression
- **Avantages** : Simple, stable, régularisé pour éviter le surapprentissage
- **Paramètres** : Alpha=1.0 (régularisation)

### 3. Prédiction de l'Épargne
- **Modèle** : Gradient Boosting Regressor
- **Avantages** : Excellent pour les tendances complexes et évolutives
- **Paramètres** : 100 estimateurs, profondeur max 5

## 🚀 Utilisation

### 1. Entraîner le Modèle

```bash
POST /api/ml/train
Headers: Cookie avec session valide
Body: (vide, utilise les données historiques)

Réponse:
{
  "success": true,
  "message": "Modèle entraîné avec succès",
  "training_scores": {
    "total_expenses": {
      "mae": 150.5,      // Erreur absolue moyenne
      "r2": 0.85,        // Score R² (1.0 = parfait)
      "rmse": 200.3      // Erreur quadratique moyenne
    },
    ...
  },
  "years_used": 5
}
```

**Conditions** :
- Minimum **2 années** de données historiques
- Plus il y a de données, meilleure est la précision

### 2. Générer des Prédictions

```bash
POST /api/ml/predict
Headers: Cookie avec session valide
Body: {
  "years": [2026, 2027, 2028]
}

Réponse:
{
  "success": true,
  "predictions": [
    {
      "year": 2026,
      "predicted_total_expenses": 25000.0,
      "predicted_annual_income": 35000.0,
      "predicted_savings": 10000.0,
      "confidence": 0.85
    },
    ...
  ]
}
```

### 3. Informations sur le Modèle

```bash
GET /api/ml/info

Réponse:
{
  "model_info": {
    "is_trained": true,
    "training_score": {...},
    "has_saved_model": true
  },
  "historical_years_available": 5,
  "years": [2021, 2022, 2023, 2024, 2025]
}
```

### 4. Réentraîner le Modèle

```bash
POST /api/ml/retrain
```

Réentraîne le modèle avec toutes les données historiques disponibles (utile après ajout de nouvelles données).

## 📈 Amélioration Continue

### Plus de Données = Meilleures Prédictions

Le modèle s'améliore automatiquement avec :
- **Plus d'années historiques** : Plus de patterns détectés
- **Plus de données par année** : Meilleure compréhension des habitudes
- **Réentraînement régulier** : Adaptation aux changements

### Interprétation des Scores

- **R² (R-squared)** : 
  - 1.0 = Prédictions parfaites
  - 0.8+ = Très bon
  - 0.6-0.8 = Bon
  - < 0.6 = Peut être amélioré (plus de données nécessaires)

- **MAE (Mean Absolute Error)** : 
  - Erreur moyenne en euros
  - Exemple : MAE de 150€ signifie que les prédictions sont en moyenne à ±150€

- **RMSE (Root Mean Squared Error)** :
  - Punition plus forte pour les grandes erreurs
  - Toujours ≥ MAE

## 🔐 Confidentialité

✅ **Tout est local** :
- Entraînement sur votre machine
- Modèles sauvegardés dans `/backend/data/models/`
- Aucune donnée envoyée à des services externes
- Aucune connexion internet nécessaire pour les prédictions

✅ **Données protégées** :
- Modèles stockés par utilisateur (nom de fichier basé sur email)
- Isolation totale entre utilisateurs
- Pas de partage de données entre sessions

## 🎓 Fonctionnement Technique

### Processus d'Entraînement

1. **Extraction** : Les données historiques sont transformées en features
2. **Normalisation** : Les features sont standardisées (moyenne 0, écart-type 1)
3. **Split** : 70% pour l'entraînement, 30% pour la validation
4. **Entraînement** : Chaque modèle apprend les patterns
5. **Évaluation** : Calcul des scores de précision
6. **Sauvegarde** : Les modèles sont sauvegardés sur disque

### Processus de Prédiction

1. **Chargement** : Le modèle entraîné est chargé depuis le disque
2. **Features** : Création des features pour l'année future (basé sur la dernière année)
3. **Normalisation** : Les features sont normalisées avec le même scaler
4. **Prédiction** : Chaque modèle prédit sa valeur
5. **Confidence** : Calcul de la confiance basé sur les scores d'entraînement

## 🔄 Intégration avec le Système Existant

Le système ML peut être utilisé en complément ou en remplacement du système de prédiction actuel (`budgetPredictor.ts`). Les deux approches peuvent coexister :

- **Système actuel** : Basé sur moyennes et inflation (simple, rapide)
- **Système ML** : Basé sur patterns d'apprentissage (précis, personnalisé)

## 📝 Exemple d'Utilisation Complète

```python
# 1. Charger les données historiques
historical_data = get_historical_data_for_ml(user_email)

# 2. Créer et entraîner le modèle
predictor = create_predictor(user_email)
scores = predictor.train(historical_data)

# 3. Générer des prédictions
predictions = predictor.predict(
    future_years=[2026, 2027, 2028],
    last_historical_data=historical_data[-1]
)

# 4. Utiliser les prédictions
for pred in predictions:
    print(f"Année {pred['year']}:")
    print(f"  Dépenses: {pred['predicted_total_expenses']:.2f}€")
    print(f"  Revenus: {pred['predicted_annual_income']:.2f}€")
    print(f"  Épargne: {pred['predicted_savings']:.2f}€")
    print(f"  Confiance: {pred['confidence']:.0%}")
```

## 🚧 Limitations et Améliorations Futures

### Limitations Actuelles

- **Minimum 2 années** de données nécessaires
- Prédictions basées sur les tendances passées (ne prédit pas les changements majeurs de style de vie)
- Modèles entraînés séparément (pas de corrélations entre dépenses/revenus/épargne)

### Améliorations Possibles

- **LSTM/RNN** : Pour capturer les dépendances temporelles longues
- **Modèles de séries temporelles** : ARIMA pour les tendances saisonnières
- **Ensembe learning avancé** : Combiner plusieurs modèles
- **Features additionnelles** : Événements de vie, inflation personnalisée
- **Prédictions par catégorie** : Modèle séparé pour chaque catégorie de dépenses
- **Prédictions mensuelles** : Au lieu de seulement annuelles

## 🛠️ Maintenance

### Sauvegarder les Modèles

Les modèles sont automatiquement sauvegardés dans :
```
backend/data/models/{email_sanitized}_budget.pkl
```

### Réentraîner Régulièrement

Recommandé après :
- Ajout d'une nouvelle année complète
- Changements majeurs dans les habitudes
- Tous les 6 mois pour maintenir la précision

## 📚 Ressources

- [scikit-learn Documentation](https://scikit-learn.org/)
- [Random Forest Explanation](https://en.wikipedia.org/wiki/Random_forest)
- [Gradient Boosting Explanation](https://en.wikipedia.org/wiki/Gradient_boosting)
- [Feature Engineering Guide](https://www.kaggle.com/learn/feature-engineering)

