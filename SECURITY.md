# Sécurisation de l'Application Budget

Ce document décrit toutes les mesures de sécurité mises en place dans l'application.

## 🔒 Protection des Cookies et Sessions

### Configuration des Cookies
- **HttpOnly** : Les cookies ne sont pas accessibles via JavaScript (protection contre XSS)
- **Secure** : Les cookies sont envoyés uniquement en HTTPS en production
- **SameSite=Lax** : Protection contre les attaques CSRF tout en permettant la navigation normale
- **Nom personnalisé** : `budget_session` pour éviter les collisions
- **Durée de vie limitée** : 30 jours maximum
- **Domain restreint** : Ne pas partager entre sous-domaines

### Protection contre la Session Fixation
- Régénération de l'ID de session après chaque authentification réussie
- Nettoyage complet de l'ancienne session avant création d'une nouvelle

### Clé Secrète
- Génération automatique d'une clé secrète sécurisée si la valeur par défaut est utilisée
- Utilisation de `secrets.token_hex(32)` pour générer des clés cryptographiquement sûres

## 🛡️ Headers de Sécurité HTTP

Tous les headers de sécurité suivants sont ajoutés automatiquement à toutes les réponses :

- **X-Content-Type-Options: nosniff** : Empêche le sniffing de type MIME
- **X-Frame-Options: DENY** : Empêche le clickjacking
- **X-XSS-Protection: 1; mode=block** : Protection XSS (navigateurs anciens)
- **Strict-Transport-Security (HSTS)** : Force HTTPS pendant 1 an
- **Referrer-Policy** : Contrôle les informations envoyées dans le Referer
- **Permissions-Policy** : Désactive les fonctionnalités sensibles (géolocalisation, microphone, caméra)
- **Content-Security-Policy (CSP)** : Restreint les sources autorisées pour scripts, styles, images, etc.

## 🔐 Protection CSRF (Cross-Site Request Forgery)

### Token CSRF
- Génération d'un token unique par session
- Token requis pour toutes les opérations modifiant l'état (POST, PUT, DELETE)
- Validation du token à chaque requête
- Token disponible via l'endpoint `/api/csrf-token` pour les utilisateurs authentifiés

### Endpoints Protégés
Toutes les routes modifiant les données nécessitent un token CSRF :
- `POST /api/years` - Ajouter une année
- `DELETE /api/years` - Supprimer une année
- `PUT /api/put` - Modifier les données d'une année
- `PUT /api/global` - Modifier les données globales

## 🚦 Rate Limiting (Limitation de Débit)

### Protection contre les Attaques par Force Brute
- **Login** : Maximum 5 tentatives par 60 secondes
- **Blocage** : 15 minutes après 5 tentatives échouées
- **Compteur par IP** : Chaque adresse IP est suivie indépendamment

### Rate Limiting Généralisé
- **Routes normales** : 100 requêtes par 60 secondes par IP
- **Routes sensibles** : Limites plus strictes
  - Login : 5 requêtes/minute
  - Écriture de données : 20-50 requêtes/minute
- **Nettoyage automatique** : Suppression des anciennes entrées

## ✅ Validation et Sanitization des Données

### Module de Sécurité (`backend/api/security.py`)
Toutes les données entrantes sont validées et nettoyées :

- **Emails** : Validation du format, longueur max 254 caractères
- **Montants** : Validation des nombres, limites min/max, arrondi à 2 décimales
- **Années** : Validation entre 1900 et 2100
- **Chaînes** : Longueur maximale, nettoyage des espaces
- **IDs** : Validation alphanumérique uniquement
- **Dates** : Format ISO strict (YYYY-MM-DD)

### Limites de Taille
- **Payload maximum** : 1MB pour les données d'année, 500KB pour les données globales
- **Listes** : Nombre maximum d'éléments (100 catégories, 10000 dépenses, etc.)

## 📝 Logs de Sécurité

### Événements Loggés
- **LOGIN_SUCCESS** : Connexions réussies
- **LOGIN_FAILED** : Tentatives de connexion échouées
- **LOGOUT** : Déconnexions

### Informations Enregistrées
- Timestamp
- Type d'événement
- Adresse IP du client
- Détails de l'événement
- Niveau de sévérité (INFO, WARNING, ERROR)

Les logs sont écrits dans `/app/data/security.log` et dans la sortie standard.

## 🔍 Protection XSS (Cross-Site Scripting)

### Content Security Policy (CSP)
- Scripts uniquement depuis `'self'`
- Styles uniquement depuis `'self'` (avec `unsafe-inline` pour le développement)
- Images depuis `'self'`, `data:` et `https:`
- Connexions restreintes à `'self'` et localhost

### Sanitization
- Tous les inputs utilisateur sont nettoyés avant stockage
- Validation stricte des types de données
- Échappement automatique dans les réponses JSON

## 🚫 Protection contre les Injections

### Validation Stricte
- Validation de tous les paramètres d'URL
- Validation de tous les corps de requête JSON
- Pas d'exécution de code dynamique basé sur les inputs utilisateur
- Utilisation de requêtes préparées (si base de données)

### Limites de Taille
- Protection contre les attaques par déni de service (DoS)
- Limites sur la taille des payloads
- Limites sur le nombre d'éléments dans les listes

## 🔐 Authentification

### Vérification de Session
- Validation du format d'email dans la session
- Vérification de la présence de la session avant chaque opération
- Nettoyage automatique des sessions invalides

### Mot de Passe
- Stockage sécurisé dans les variables d'environnement
- Comparaison sécurisée (timing-safe)
- Messages d'erreur génériques (ne révèlent pas si l'email existe)

## 🌐 CORS (Cross-Origin Resource Sharing)

### Configuration Restrictive
- Origines autorisées : uniquement `http://localhost:6061` et `http://127.0.0.1:6061`
- Credentials : support activé pour les cookies de session
- Méthodes autorisées : selon les endpoints
- Headers autorisés : uniquement ceux nécessaires

## 🔄 Meilleures Pratiques

### Secrets et Configuration
- Clés secrètes dans les variables d'environnement
- Valeurs par défaut uniquement pour le développement
- Génération automatique de clés sécurisées si nécessaire

### Gestion des Erreurs
- Messages d'erreur génériques (ne révèlent pas d'informations sensibles)
- Pas d'exposition de stack traces en production
- Logs détaillés côté serveur uniquement

### Mises à Jour de Sécurité
- Utilisation de bibliothèques à jour
- Validation régulière des dépendances
- Monitoring des failles de sécurité connues

## 📋 Checklist de Déploiement

Avant de déployer en production, vérifier :

- [ ] Variable d'environnement `SECRET_KEY` définie avec une valeur forte
- [ ] Variable d'environnement `FLASK_ENV=production` définie
- [ ] HTTPS configuré (certificat SSL valide)
- [ ] `SESSION_COOKIE_SECURE` activé (HTTPS uniquement)
- [ ] Variables d'environnement `ADMIN_EMAIL` et `ADMIN_PASSWORD` configurées
- [ ] CORS configuré avec les bonnes origines en production
- [ ] Logs de sécurité monitorés
- [ ] Sauvegardes régulières des données utilisateur
- [ ] Rate limiting adapté au trafic attendu
- [ ] Headers de sécurité testés (https://securityheaders.com)

## 🤖 Sécurité des Données ML et IA

### Protection des Modèles Entraînés
- **Isolation par utilisateur** : Chaque utilisateur possède ses propres modèles (nom de fichier basé sur email sanitisé)
- **Stockage local uniquement** : Les modèles sont sauvegardés dans `/backend/data/models/` (pas d'envoi externe)
- **Aucune donnée externe** : L'entraînement utilise uniquement les données historiques de l'utilisateur
- **Protection des fichiers** : Les modèles sont stockés avec les mêmes permissions que les données utilisateur

### Validation des Données d'Entraînement
- **Validation stricte** : Toutes les données d'entraînement sont validées avant utilisation
- **Détection d'anomalies** : Le système identifie les données incomplètes ou erronées
- **Recommandations de correction** : Suggestions automatiques pour améliorer la qualité des données

### Sécurité des Recommandations IA
- **Recommandations locales** : Tous les calculs sont effectués localement
- **Pas de transmission externe** : Aucune donnée n'est envoyée à des services externes
- **Confidence scores** : Indication de la confiance dans chaque recommandation

## 🏛️ Sécurité des API Gouvernementales

### API Impôt Particulier (DGFiP)
- **Authentification requise** : Connexion via FranceConnect nécessaire
- **Habilitation obligatoire** : Nécessite une demande d'habilitation à la DGFiP
- **Données sensibles** : Accès aux informations fiscales nécessite une sécurisation maximale
- **Token-based** : Utilisation de tokens d'authentification pour les appels API

### API Mon Entreprise (URSSAF)
- **API publique** : Pas d'authentification requise pour les simulateurs
- **Calculs approximatifs** : Les résultats sont indicatifs uniquement
- **Pas de stockage** : Les données de simulation ne sont pas sauvegardées

### OpenFisca
- **Open Source** : Logiciel libre et transparent
- **Calculs locaux possibles** : Peut être déployé localement pour plus de sécurité
- **Validation des calculs** : Tous les calculs sont traçables et vérifiables

### Bonnes Pratiques
- **Éviter le stockage** : Les données fiscales sensibles ne doivent pas être stockées sans nécessité
- **Chiffrement** : Toutes les communications avec les API gouvernementales doivent être en HTTPS
- **Audit trail** : Traçabilité de tous les accès aux données fiscales
- **Respect RGPD** : Conformité avec le règlement général sur la protection des données

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/2.3.x/security/)
- [API Impôt Particulier - Documentation](https://www.data.gouv.fr/dataservices/api-impot-particulier/)
- [OpenFisca - Documentation](https://www.data.gouv.fr/dataservices/openfisca/)

---

## 🛡️ **WAF (Web Application Firewall) et DMZ**

### WAF Implémenté

L'application dispose maintenant d'un **Web Application Firewall (WAF)** intégré qui protège contre les attaques courantes :

- **Détection SQL Injection** : Bloque les tentatives d'injection SQL
- **Détection XSS** : Bloque les scripts malveillants
- **Détection Command Injection** : Empêche l'exécution de commandes système
- **Détection Path Traversal** : Protège contre l'accès aux fichiers sensibles
- **Blocage automatique d'IP** : Bannit les attaquants après 5 menaces
- **Logs de sécurité** : Toutes les menaces sont enregistrées dans `backend/data/waf.log`

### Configuration DMZ

Une architecture **DMZ (Demilitarized Zone)** est configurée pour la production :

- **Zone DMZ** : Nginx reverse proxy avec WAF comme première couche
- **Réseau privé** : Backend et frontend isolés dans un réseau privé
- **Séparation des couches** : Défense en profondeur avec plusieurs niveaux de sécurité

**Documentation complète** : Voir `docs/DMZ_WAF_CONFIGURATION.md` pour tous les détails de configuration, architecture réseau, et instructions de déploiement.
