# 🧪 Documentation des Tests

## Vue d'ensemble

Le projet Budget Web Youyou dispose d'une suite complète de tests couvrant :
- **Scoring bancaire** : Tests unitaires pour le système de calcul du score bancaire
- **Machine Learning** : Tests des modèles ML et prédictions
- **Cybersécurité** : Tests de sécurité (WAF, CSRF, authentification, etc.)
- **Authentification** : Tests de login, session, logout
- **Endpoints API** : Tests de tous les endpoints
- **Validation** : Tests de validation des données

## Commandes de test

### Tests rapides
```bash
# Tests de base (syntaxe, conteneurs, API)
make test

# Tous les tests backend
make test-backend-all

# Tests complets avec rapport
make test-complete
```

### Tests spécifiques
```bash
# Tests de scoring bancaire uniquement
docker exec budget-web-backend python -m pytest tests/test_bank_scoring.py -v

# Tests ML
docker exec budget-web-backend python -m pytest tests/backend/test_ml_complete.py -v

# Tests de sécurité
docker exec budget-web-backend python -m pytest tests/backend/test_security.py -v

# Tests d'authentification
docker exec budget-web-backend python -m pytest tests/backend/test_auth.py -v
```

### Installation des dépendances
```bash
# Installer pytest et dépendances
make test-backend-install
```

## Structure des tests

### Tests de Scoring Bancaire (`tests/test_bank_scoring.py`)
- **TestDebtRatio** : Tests du ratio d'endettement (idéal, maximal, excessif)
- **TestSavingsCapacity** : Tests de capacité d'épargne
- **TestIncomeStability** : Tests de stabilité des revenus
- **TestAssetsScore** : Tests du score des actifs
- **TestExpenseRegularity** : Tests de régularité des dépenses
- **TestSavingsRate** : Tests du taux d'épargne
- **TestRiskLevel** : Tests de détermination du niveau de risque
- **TestCompleteScore** : Tests du calcul complet du score
- **TestRecommendations** : Tests de génération de recommandations

### Tests de Sécurité (`tests/backend/test_security.py`)
- **Rate limiting** : Limitation de débit sur les tentatives de login
- **Protection CSRF** : Protection contre les attaques CSRF
- **Headers de sécurité** : Présence des headers de sécurité
- **Prévention fixation de session** : Régénération des sessions
- **Protection brute force** : Blocage après tentatives échouées
- **Protection SQL injection** : Filtrage des payloads SQL
- **Protection XSS** : Filtrage des scripts malveillants
- **Protection WAF** : Filtrage des attaques par le WAF
- **Validation des entrées** : Validation des données utilisateur
- **Validation email** : Validation du format des emails
- **Sécurité mots de passe** : Validation et protection des mots de passe
- **Protection injection JSON** : Protection contre JSON malformé
- **Limitation de débit globale** : Rate limiting sur toutes les requêtes
- **Headers CORS** : Configuration CORS appropriée
- **Validation Content-Type** : Validation du type de contenu

### Tests ML (`tests/backend/test_ml_complete.py`)
- **Prédictions** : Tests des prédictions ML avec données suffisantes/insuffisantes
- **Entraînement** : Tests d'entraînement avec données valides/invalides
- **Recommandations** : Tests de génération de recommandations IA

## Exécution des tests

### Dans Docker (recommandé)
```bash
# Démarrer les conteneurs
make start

# Exécuter tous les tests
make test-complete

# Exécuter un test spécifique
docker exec budget-web-backend python -m pytest tests/test_bank_scoring.py::TestDebtRatio -v
```

### Localement (sans Docker)
```bash
cd backend
pip install -r requirements-test.txt
python -m pytest tests/test_bank_scoring.py -v
```

## Rapports de test

Le script `backend/scripts/run_all_tests.py` génère :
- **Sortie console** : Affichage en temps réel avec couleurs
- **Rapport JSON** : Sauvegardé dans `backend/data/test_report.json`

### Structure du rapport JSON
```json
{
  "date": "2024-12-10T15:30:00",
  "summary": {
    "total_passed": 45,
    "total_failed": 5,
    "total_skipped": 2,
    "total_errors": 0,
    "total_tests": 52,
    "success_rate": 86.5
  },
  "results": {
    "bank_scoring": { ... },
    "ml": { ... },
    "security": { ... }
  }
}
```

## Couverture de code

Pour générer un rapport de couverture :
```bash
docker exec budget-web-backend python -m pytest --cov=api --cov-report=html tests/
```

Le rapport HTML sera généré dans `htmlcov/index.html`.

## Tests en cours de développement

### À venir
- Tests E2E avec Playwright
- Tests de performance
- Tests d'intégration complets
- Tests de régression

## Dépannage

### Erreurs courantes

**Module pytest not found**
```bash
make test-backend-install
```

**Tests échouent avec des erreurs d'import**
- Vérifiez que les conteneurs sont démarrés : `make status`
- Vérifiez que les dépendances sont installées : `make test-backend-install`

**Tests de sécurité échouent**
- Vérifiez que les variables d'environnement de test sont correctes
- Vérifiez que le backend est bien configuré pour les tests

## Contribuer

Lors de l'ajout de nouvelles fonctionnalités :
1. Créer des tests unitaires correspondants
2. S'assurer que tous les tests passent : `make test-complete`
3. Maintenir une couverture de code > 80%
4. Documenter les nouveaux tests dans ce fichier

