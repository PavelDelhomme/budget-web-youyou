# Migration vers PostgreSQL

## Vue d'ensemble

Le projet a été migré de fichiers JSON vers PostgreSQL pour une meilleure scalabilité, performance et gestion des données.

## Changements apportés

### 1. Infrastructure Docker

- Ajout d'un service PostgreSQL dans `docker-compose.yml`
- Configuration de la connexion via variables d'environnement
- Volume persisté pour les données PostgreSQL

### 2. Modèles de base de données

Les modèles SQLAlchemy sont définis dans `backend/api/database.py` :

- **User** : Utilisateurs (email)
- **UserYear** : Années associées à un utilisateur
- **YearData** : Données spécifiques à une année (categories, expenses, etc.)
- **UserGlobalData** : Données globales utilisateur (bank accounts, investments, etc.)
- **CacheEntry** : Cache pour les réponses API externes

### 3. Service de base de données

Le fichier `backend/api/db_service.py` remplace les fonctions JSON de `utils.py` :
- `load_user(db, email)` : Charge les données utilisateur depuis PostgreSQL
- `save_user(db, email, data)` : Sauvegarde les données utilisateur dans PostgreSQL
- `get_year_data(db, email, year)` : Récupère les données d'une année spécifique
- `save_year_data(db, email, year, data)` : Sauvegarde les données d'une année
- `get_global_data(db, email)` : Récupère les données globales
- `save_global_data(db, email, data)` : Sauvegarde les données globales

### 4. Migration des données

Un script de migration est disponible : `backend/scripts/migrate_json_to_postgres.py`

**Pour migrer les données existantes :**

```bash
# Dans le conteneur backend
docker exec -it budget-web-backend python scripts/migrate_json_to_postgres.py
```

**Note importante :** Le script utilise le nom du fichier JSON comme email (après sanitization). Vous devrez peut-être mapper manuellement les emails si les noms de fichiers ne correspondent pas exactement.

### 5. Variables d'environnement

Ajoutez ces variables dans votre `.env` ou `docker-compose.yml` :

```env
POSTGRES_DB=budget_db
POSTGRES_USER=budget_user
POSTGRES_PASSWORD=budget_password_change_in_production
DATABASE_URL=postgresql://budget_user:budget_password_change_in_production@postgres:5432/budget_db
```

## Démarrage

1. **Reconstruire les conteneurs :**
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

2. **Initialiser la base de données :**
   La base de données est automatiquement initialisée au démarrage de l'application.

3. **Migrer les données existantes (optionnel) :**
   ```bash
   docker exec -it budget-web-backend python scripts/migrate_json_to_postgres.py
   ```

## Rétrocompatibilité

Les fichiers JSON existants restent dans `backend/data/` mais ne sont plus utilisés par l'application. Ils servent de sauvegarde et peuvent être supprimés après vérification de la migration.

## Notes importantes

- Les fichiers JSON de cache (fiscal_calendar, regulations, etc.) restent dans le système de fichiers pour l'instant
- Le cache peut être migré vers la table `CacheEntry` dans une étape ultérieure
- Les logs restent dans le système de fichiers (comportement normal)

## Dépannage

### Erreur de connexion à PostgreSQL

Vérifiez que :
1. Le service PostgreSQL est démarré : `docker-compose ps`
2. Les variables d'environnement sont correctes
3. Le volume PostgreSQL est monté correctement

### Erreur lors de la migration

- Vérifiez les permissions des fichiers JSON
- Vérifiez les logs du conteneur backend : `docker logs budget-web-backend`
- Le script affiche des messages détaillés pour chaque fichier migré

## Prochaines étapes

- [ ] Migrer les caches API vers la table `CacheEntry`
- [ ] Ajouter des index supplémentaires pour optimiser les performances
- [ ] Implémenter des sauvegardes automatiques de la base PostgreSQL
- [ ] Ajouter Alembic pour les migrations de schéma versionnées

