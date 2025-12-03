# Tests Backend

Suite complète de tests pour l'API backend Flask.

## Structure

```
tests/backend/
├── conftest.py                 # Fixtures pytest partagées
├── test_auth.py               # Tests d'authentification
├── test_security.py           # Tests de sécurité
├── test_validation.py         # Tests de validation
├── test_years_endpoints.py    # Tests endpoints années
├── test_data_endpoints.py     # Tests endpoints données
├── test_error_handling.py     # Tests gestion d'erreurs
├── test_ml_service_endpoints.py  # Tests ML (existant)
└── test_ml_performance.py     # Tests performance ML (existant)
```

## Installation

```bash
# Dans le conteneur backend
pip install -r backend/requirements-test.txt

# Ou avec Makefile
make test-backend-install
```

## Exécution des tests

### Tous les tests

```bash
make test-backend-all
```

### Tests spécifiques

```bash
# Tests d'authentification
pytest tests/backend/test_auth.py -v

# Tests de sécurité
pytest tests/backend/test_security.py -v

# Tests de validation
pytest tests/backend/test_validation.py -v

# Avec couverture de code
pytest tests/backend/ --cov=backend --cov-report=html
```

### Dans Docker

```bash
docker exec budget-web-backend python -m pytest tests/backend/ -v
```

## Couverture des tests

### Tests d'authentification (`test_auth.py`)
- ✅ Connexion réussie/échouée
- ✅ Récupération token CSRF
- ✅ Déconnexion
- ✅ Vérification de session
- ✅ Rate limiting login
- ✅ Sécurité des cookies

### Tests de sécurité (`test_security.py`)
- ✅ Rate limiting
- ✅ Protection CSRF
- ✅ Headers de sécurité
- ✅ Prévention fixation de session
- ✅ Protection brute force
- ✅ Protection injection SQL/XSS
- ✅ Authentification requise

### Tests de validation (`test_validation.py`)
- ✅ Format année
- ✅ Format email
- ✅ Données catégories
- ✅ Données dépenses
- ✅ Structure JSON
- ✅ Types de données
- ✅ Longueur chaînes
- ✅ Plages de nombres

### Tests endpoints années (`test_years_endpoints.py`)
- ✅ Récupération années
- ✅ Ajout année
- ✅ Validation année
- ✅ Protection CSRF
- ✅ Années invalides

### Tests endpoints données (`test_data_endpoints.py`)
- ✅ Récupération données année
- ✅ Sauvegarde données année
- ✅ Données globales
- ✅ Validation paramètres

### Tests gestion d'erreurs (`test_error_handling.py`)
- ✅ 404 Not Found
- ✅ 500 Internal Error
- ✅ Champs manquants
- ✅ Type contenu invalide
- ✅ Protection débordement
- ✅ Requêtes concurrentes
- ✅ Timeouts
- ✅ Erreurs mémoire/DB

## Fixtures disponibles

Les fixtures dans `conftest.py` :
- `client` : Client Flask de test
- `admin_credentials` : Identifiants admin
- `auth_session` : Session authentifiée
- `csrf_token` : Token CSRF valide
- `sample_user_data` : Données utilisateur de test
- `mock_load_user` : Mock de load_user
- `mock_save_user` : Mock de save_user
- `clean_test_data` : Nettoyage après tests

## Notes

- Les tests utilisent des mocks pour éviter de modifier les données réelles
- Les tests de sécurité sont particulièrement importants
- La couverture de code peut être générée avec `--cov`
- Les tests peuvent être exécutés en parallèle avec `-n auto` (pytest-xdist)

