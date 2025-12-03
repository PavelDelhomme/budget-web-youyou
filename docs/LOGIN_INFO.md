# 🔐 Information sur le système de Login

## Identifiants de connexion

Pour accéder à l'application, vous devez utiliser les identifiants suivants :

- **Email** : `dev@delhomme.ovh`
- **Mot de passe** : `5n!B@#c*ymgEBYXrWdKE`

## Comment ça fonctionne

### ✅ Authentification requise
- **Email** : Doit correspondre exactement à `dev@delhomme.ovh`
- **Mot de passe** : Doit correspondre exactement au mot de passe configuré
- **Vérification** : Les deux sont vérifiés avant la connexion
- **Sessions** : L'email est stocké dans la session Flask après authentification réussie
- **Création automatique** : Le fichier de données est créé à la première connexion

### 🔒 Sécurité
- **Vérification des identifiants** : Email et mot de passe sont vérifiés
- **Messages d'erreur génériques** : "Email ou mot de passe incorrect" pour ne pas révéler lequel est faux
- **Stockage sécurisé** : Les identifiants peuvent être définis via variables d'environnement

## Exemple d'utilisation

1. Ouvrir l'application : `http://localhost:6061`
2. Formulaire de connexion apparaît
3. Entrer l'email : `dev@delhomme.ovh`
4. Entrer le mot de passe : `5n!B@#c*ymgEBYXrWdKE`
5. Cliquer sur "Se connecter"
6. ✅ Vous êtes connecté !

**Important** : Les identifiants doivent correspondre exactement (mais l'email n'est pas sensible à la casse).

## Configuration

Les identifiants peuvent être configurés via des variables d'environnement :

```bash
ADMIN_EMAIL=dev@delhomme.ovh
ADMIN_PASSWORD=5n!B@#c*ymgEBYXrWdKE
```

Ou dans le fichier `.env` pour le développement local.

Dans Docker, ces variables sont définies dans `docker-compose.yml` ou peuvent être surchargées via un fichier `.env` à la racine du projet.

## Comment améliorer la sécurité (si besoin)

Si vous voulez ajouter une vraie authentification, voici ce qu'il faudrait faire :

### Option 1 : Hash simple des mots de passe

Stockage des mots de passe hashés dans les fichiers JSON utilisateur.

### Option 2 : Authentification complète avec base de données

1. Ajouter une table `users` dans une base de données
2. Stocker les emails et mots de passe hashés (bcrypt)
3. Vérifier les mots de passe à chaque connexion

### Option 3 : OAuth / Authentification externe

Utiliser Google, GitHub, etc. pour l'authentification.

---

**Pour l'instant, le système actuel fonctionne mais n'est pas sécurisé.** C'est volontaire pour simplifier l'application.

