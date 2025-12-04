# 🔧 Correction Permissions Fichiers de Données

## 📍 Emplacement du Fichier

Le fichier `dev_delhomme.ovh.json` se trouve à :
```
/home/pactivisme/Documents/Dev/Perso/BudgetYouyou/budget-web-youyou-merdique/backend/data/dev_delhomme.ovh.json
```

## ⚠️ Problème

Si vous avez modifié les permissions avec `sudo`, le fichier peut appartenir à `root:root`, ce qui empêche l'application de le modifier.

## ✅ Solution

### Méthode 1 : Script Automatique

Utilisez le script fourni :

```bash
./scripts/fix_permissions.sh
```

### Méthode 2 : Commandes Manuelles

Pour corriger les permissions manuellement :

```bash
# Corriger le répertoire complet
sudo chown -R pactivisme:pactivisme backend/data/
sudo chmod -R 755 backend/data/

# Ou uniquement le fichier
sudo chown pactivisme:pactivisme backend/data/dev_delhomme.ovh.json
sudo chmod 644 backend/data/dev_delhomme.ovh.json
```

## 🔍 Vérification

Pour vérifier les permissions actuelles :

```bash
ls -la backend/data/dev_delhomme.ovh.json
```

Le fichier doit appartenir à votre utilisateur (pas `root`) :
```
-rw-r--r-- 1 pactivisme pactivisme ... dev_delhomme.ovh.json
```

## 📝 Note

L'application backend doit pouvoir :
- **Lire** les fichiers JSON (permission `r`)
- **Écrire** les fichiers JSON (permission `w`)

Si le fichier appartient à `root`, l'application ne pourra pas le modifier même si les permissions le permettent.

