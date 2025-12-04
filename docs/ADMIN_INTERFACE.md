# 🔐 Interface d'Administration - Budget Web Youyou

## 📋 Vue d'ensemble

L'interface d'administration permet de gérer et surveiller l'application de manière sécurisée. Elle est accessible uniquement par l'administrateur configuré dans les variables d'environnement.

## 🔒 Sécurité

### Authentification

- ✅ **Email administrateur vérifié** : Seul l'email configuré dans `ADMIN_EMAIL` peut accéder
- ✅ **Sessions sécurisées** : Cookies HttpOnly, Secure, SameSite
- ✅ **CSRF Protection** : Toutes les actions nécessitent un token CSRF
- ✅ **Rate Limiting** : Limitation stricte des requêtes admin
- ✅ **Logs d'audit** : Toutes les actions sont enregistrées

### Routes Protégées

Toutes les routes d'administration nécessitent :
1. Authentification (session valide)
2. Email correspondant à `ADMIN_EMAIL`
3. Token CSRF pour les actions modifiant l'état

## 🎯 Fonctionnalités

### 1. Statistiques WAF

**Route** : `GET /api/waf/stats`

Affiche :
- Nombre total de menaces détectées
- Nombre d'IPs bloquées
- Répartition par type de menace
- Top 10 des IPs les plus menaçantes

### 2. Gestion des IPs Bloquées

**Route** : `GET /api/waf/blocked-ips`

Affiche :
- Liste des IPs actuellement bloquées
- Durée de blocage restante
- Date/heure de fin de blocage

### 3. Détails des Menaces

**Route** : `GET /api/waf/threats?limit=50`

Affiche :
- Liste des menaces récentes
- Type de menace (SQL Injection, XSS, etc.)
- IP source
- Date/heure
- Détails de la menace

## 📝 Documentation Complète

La documentation complète de l'interface d'administration sera disponible après l'implémentation dans le frontend.

**Voir aussi** :
- `DEPLOYMENT.md` : Guide de déploiement complet
- `docs/DMZ_WAF_CONFIGURATION.md` : Configuration WAF et DMZ
- `SECURITY.md` : Mesures de sécurité

