# Migration vers Django

## Migration des données depuis Node.js/Express vers Django

Les données sont stockées dans le même format JSON, donc la migration est très simple.

### Structure des données

Le format JSON reste identique :
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

1. **Localiser les fichiers de données Node.js** :
   - Ancien emplacement : `server/data/*.json`

2. **Copier vers Django** :
   - Nouvel emplacement : `backend/data/*.json`
   
   ```bash
   cp server/data/*.json backend/data/
   ```

3. **Vérifier les permissions** :
   ```bash
   chmod 644 backend/data/*.json
   ```

### Différences principales

#### Backend
- **Node.js/Express** → **Django** + Django REST Framework
- Sessions gérées par Django au lieu d'express-session
- Même structure de fichiers JSON
- Même format d'API

#### Ports
- **Backend** : 3001 → 8000 (port Django par défaut)
- **Frontend** : 3000 (inchangé)

#### Endpoints API
Les endpoints restent identiques :
- `POST /api/login`
- `POST /api/logout`
- `GET /api/years`
- `POST /api/years`
- `DELETE /api/years?year=YYYY`
- `GET /api/get?year=YYYY`
- `PUT /api/put?year=YYYY`

### Migration automatique (script)

Vous pouvez créer un script Python pour automatiser la migration :

```python
import shutil
from pathlib import Path

# Chemins
old_data_dir = Path('server/data')
new_data_dir = Path('backend/data')

if old_data_dir.exists():
    new_data_dir.mkdir(exist_ok=True)
    for json_file in old_data_dir.glob('*.json'):
        shutil.copy2(json_file, new_data_dir / json_file.name)
    print(f"✅ {len(list(old_data_dir.glob('*.json')))} fichiers migrés")
else:
    print("⚠️  Aucun fichier à migrer")
```

## Avantages de Django

1. **Admin Django** : Interface d'administration intégrée (à configurer si besoin)
2. **ORM** : Possibilité de migrer vers une base de données plus tard
3. **Sécurité** : Protection CSRF, XSS intégrées
4. **Scalabilité** : Meilleure gestion des sessions et cache
5. **Écosystème** : Nombreuses extensions disponibles

