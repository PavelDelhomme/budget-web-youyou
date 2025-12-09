# 📁 Plan de Réorganisation - backend/api

## 🎯 Structure actuelle (désorganisée)

Tous les fichiers sont à la racine de `backend/api/` :
- 30+ fichiers mélangés
- Services, routes, middleware, utils tout mélangé
- Difficile de trouver ce qu'on cherche

## ✅ Structure proposée (organisée)

```
backend/api/
├── __init__.py                    # Point d'entrée principal
├── views.py                       # Routes principales (à garder à la racine ou déplacer)
│
├── services/                      # Services métier
│   ├── __init__.py
│   ├── fiscal_service.py
│   ├── health_service.py
│   ├── ml_service.py
│   ├── statistical_service.py
│   ├── government_service.py
│   ├── export_service.py
│   ├── backup_service.py
│   └── government_deductions_service.py
│
├── routes/                        # Routes API par domaine
│   ├── __init__.py
│   ├── fiscal_routes.py          # (fiscal_country_routes.py)
│   ├── health_routes.py
│   ├── export_routes.py
│   └── backup_routes.py          # (backup_service_routes.py)
│
├── fiscal/                        # Tout ce qui est fiscal
│   ├── __init__.py
│   ├── fiscal_service.py         # (déplacé depuis services/)
│   ├── fiscal_tracking.py
│   ├── fiscal_country_manager.py
│   ├── fiscal_country_routes.py
│   └── fiscal_country_routes.py  # (à fusionner avec routes/fiscal_routes.py)
│
├── government/                    # APIs gouvernementales
│   ├── __init__.py
│   ├── government_service.py
│   ├── government_deductions_service.py
│   ├── government_fiscal_calendar.py
│   ├── government_fiscal_regulations.py
│   ├── insee_statistics_service.py
│   └── apis/                      # (ancien government_apis/)
│       ├── __init__.py
│       ├── impot_particulier.py
│       ├── mon_entreprise.py
│       └── openfisca.py
│
├── export/                        # Export de données
│   ├── __init__.py
│   ├── export_routes.py
│   └── export_service.py
│
├── backup/                        # Sauvegarde
│   ├── __init__.py
│   ├── backup_routes.py          # (backup_service_routes.py)
│   └── backup_service.py
│
├── ml/                            # Machine Learning (déjà organisé)
│   ├── __init__.py
│   ├── cache.py
│   ├── data_validator.py
│   ├── features.py
│   ├── model.py
│   ├── neural_network.py
│   ├── performance_tests.py
│   └── recommendations.py
│
├── middleware/                    # Middlewares
│   ├── __init__.py
│   ├── middleware.py
│   ├── compression_middleware.py
│   └── waf.py
│
├── security/                      # Sécurité
│   ├── __init__.py
│   ├── security.py
│   └── security_advanced.py
│
├── utils/                         # Utilitaires
│   ├── __init__.py
│   ├── utils.py
│   ├── json_schema_validator.py
│   ├── retry_logic.py
│   └── structured_logging.py
│
├── monitoring/                    # Monitoring
│   ├── __init__.py
│   └── monitoring.py
│
└── core/                          # Fichiers core partagés
    ├── __init__.py
    ├── swagger_docs.py
    └── statistical_budget_generator.py
```

## 🔄 Fichiers à déplacer

### → services/
- `fiscal_service.py`
- `health_service.py`
- `ml_service.py`
- `statistical_service.py`
- `government_service.py`
- `export_service.py`
- `backup_service.py`
- `government_deductions_service.py`

### → routes/
- `health_routes.py`
- `export_routes.py`
- `fiscal_country_routes.py` → `fiscal_routes.py`
- `backup_service_routes.py` → `backup_routes.py`

### → fiscal/
- `fiscal_service.py` (depuis services/)
- `fiscal_tracking.py`
- `fiscal_country_manager.py`
- `fiscal_country_routes.py` (à fusionner ou garder)

### → government/
- `government_service.py`
- `government_deductions_service.py`
- `government_fiscal_calendar.py`
- `government_fiscal_regulations.py`
- `insee_statistics_service.py`
- `government_apis/` → `government/apis/`

### → export/
- `export_routes.py`
- `export_service.py`

### → backup/
- `backup_service_routes.py` → `backup_routes.py`
- `backup_service.py`

### → middleware/
- `middleware.py`
- `compression_middleware.py`
- `waf.py`

### → security/
- `security.py`
- `security_advanced.py`

### → utils/
- `utils.py`
- `json_schema_validator.py`
- `retry_logic.py`
- `structured_logging.py`

### → monitoring/
- `monitoring.py`

### → core/
- `swagger_docs.py`
- `statistical_budget_generator.py`

## ⚠️ Fichiers à garder à la racine
- `__init__.py` (point d'entrée)
- `views.py` (routes principales, peut-être déplacer dans routes/)

## 🔧 Modifications des imports nécessaires

Après réorganisation, il faudra mettre à jour tous les imports :
- `from api.fiscal_service import ...` → `from api.services.fiscal_service import ...`
- `from api.health_routes import ...` → `from api.routes.health_routes import ...`
- etc.

## 📝 Étapes de migration

1. ✅ Créer la nouvelle structure de dossiers
2. ✅ Déplacer les fichiers dans les bons dossiers
3. ✅ Créer les `__init__.py` dans chaque dossier
4. ✅ Mettre à jour tous les imports dans tous les fichiers
5. ✅ Mettre à jour `app.py` si nécessaire
6. ✅ Tester que tout fonctionne
7. ✅ Supprimer les anciens fichiers (après vérification)

