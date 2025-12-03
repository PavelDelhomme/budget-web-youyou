# Guide de Migration

## Migration des données depuis PHP vers Node.js

Si vous aviez déjà des données dans l'ancien système PHP, vous pouvez les migrer vers le nouveau système Node.js.

### Structure des données

Les deux systèmes utilisent la même structure JSON pour stocker les données utilisateur :

```json
{
  "years": [2026, 2027, 2028, 2029, 2030],
  "datasets": {
    "2026": {
      "categories": [...],
      "expenses": [...],
      "subs": [...]
    }
  }
}
```

### Migration manuelle

1. Localiser les fichiers de données PHP :
   - Ancien emplacement : `budget_annuel_server/data/*.json`

2. Copier vers le nouveau système :
   - Nouvel emplacement : `server/data/*.json`
   
   Les fichiers ont le même nom (email sanitizé), donc vous pouvez simplement copier :
   ```bash
   cp budget_annuel_server/data/*.json server/data/
   ```

3. Vérifier les permissions :
   ```bash
   chmod 775 server/data/*.json
   ```

### Migration automatique (script à venir)

Un script de migration automatique pourrait être créé pour :
- Détecter automatiquement les fichiers de données dans l'ancien emplacement
- Les copier vers le nouveau emplacement
- Vérifier l'intégrité des données
- Créer une sauvegarde avant migration

## Différences entre PHP et Node.js

### Endpoints API

Les endpoints sont identiques, seule la technologie change :

| PHP | Node.js |
|-----|---------|
| `/api/login.php` | `/api/login` |
| `/api/logout.php` | `/api/logout` |
| `/api/years.php` | `/api/years` |
| `/api/get.php?year=...` | `/api/get?year=...` |
| `/api/put.php?year=...` | `/api/put?year=...` |

### Sessions

Les deux systèmes utilisent des sessions, mais avec des implémentations différentes :
- **PHP** : Sessions PHP natives
- **Node.js** : Express sessions (avec cookies)

Les sessions ne sont pas migrables - les utilisateurs devront se reconnecter après la migration.

### Stockage

Le stockage reste identique : fichiers JSON par utilisateur dans le répertoire `data/`.

