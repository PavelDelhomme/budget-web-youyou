# 🔐 Mesures de Sécurité Implémentées

Ce document décrit les mesures de sécurité minimales implémentées dans le backend Flask.

## ✅ Authentification et Vérification du Mot de Passe

### Vérification des Identifiants
- ✅ Validation stricte de l'email avec regex
- ✅ Vérification du format email (limite RFC 5321: 254 caractères)
- ✅ Vérification du mot de passe en texte clair (comparaison sécurisée)
- ✅ Messages d'erreur génériques pour ne pas révéler quel champ est incorrect
- ✅ Validation de type pour tous les champs d'entrée

### Rate Limiting (Protection contre les attaques brute force)
- ✅ Maximum 5 tentatives de connexion par IP
- ✅ Blocage de l'IP pendant 15 minutes après 5 tentatives échouées
- ✅ Fenêtre de 60 secondes pour compter les tentatives
- ✅ Réinitialisation automatique du compteur après la fenêtre de temps
- ✅ Gestion de l'IP via `X-Forwarded-For` et `REMOTE_ADDR`

## 🔒 Sécurité des Sessions

### Configuration des Cookies de Session
- ✅ `SESSION_COOKIE_HTTPONLY = True` : Empêche l'accès JavaScript aux cookies
- ✅ `SESSION_COOKIE_SAMESITE = 'Lax'` : Protection CSRF
- ✅ `SESSION_COOKIE_SECURE` : Activé en production pour HTTPS uniquement
- ✅ Nom de cookie personnalisé : `budget_session`
- ✅ Durée de session : 30 jours

### Validation de Session
- ✅ Vérification de la présence de `user_email` dans la session
- ✅ Validation du format email dans la session
- ✅ Nettoyage automatique des sessions invalides
- ✅ Régénération de la session après connexion réussie

## 🛡️ Validation des Entrées

### Validation des Paramètres
- ✅ Validation stricte de l'année (1900-2100)
- ✅ Validation de type pour tous les paramètres
- ✅ Limitation de la taille des payloads :
  - Données d'année : 1MB maximum
  - Données globales : 500KB maximum

### Protection contre les Injections
- ✅ Sanitisation de l'email pour les noms de fichiers
- ✅ Validation regex stricte pour les emails
- ✅ Limitation de la longueur des champs (email: 254 chars, password: 500 chars)
- ✅ Validation de type avant traitement

## 🔐 Décorateur `require_auth`

Le décorateur `@require_auth` implémente :
- ✅ Vérification de la présence de la session
- ✅ Validation du format email dans la session
- ✅ Nettoyage automatique des sessions invalides
- ✅ Retour d'erreur 401 avec message approprié

## 📝 Gestion des Erreurs

### Messages d'Erreur Sécurisés
- ✅ Messages génériques pour les erreurs d'authentification
- ✅ Pas de révélations d'informations sensibles dans les messages
- ✅ Codes d'erreur HTTP appropriés (400, 401, 429, 500)

## ⚠️ Limitations Actuelles

### Ce qui pourrait être amélioré (futures versions)
- [ ] Hashage des mots de passe avec bcrypt ou werkzeug
- [ ] Support multi-utilisateurs avec base de données
- [ ] Token JWT pour les sessions
- [ ] Rate limiting avec Redis pour la persistance
- [ ] Logging des tentatives de connexion échouées
- [ ] 2FA (Authentification à deux facteurs)

## 🚀 Utilisation

### Variables d'Environnement

```bash
# Email de l'administrateur
ADMIN_EMAIL=dev@delhomme.ovh

# Mot de passe de l'administrateur (doit être fort)
ADMIN_PASSWORD=5n!B@#c*ymgEBYXrWdKE

# Clé secrète Flask (générer une clé aléatoire en production)
SECRET_KEY=budget-annuel-secret-key-change-in-production

# Environnement (production active HTTPS pour les cookies)
FLASK_ENV=production
```

### Configuration du Rate Limiting

Les valeurs par défaut peuvent être modifiées dans `backend/app.py` :
- `MAX_LOGIN_ATTEMPTS = 5` : Nombre maximum de tentatives
- `LOCKOUT_DURATION = 900` : Durée du blocage en secondes (15 minutes)
- `RATE_LIMIT_WINDOW = 60` : Fenêtre de temps en secondes

## 📚 Références

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/latest/security/)
- [RFC 5321 - Email Address Format](https://tools.ietf.org/html/rfc5321)

