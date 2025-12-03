# Checklist de Production

Checklist complète pour préparer et déployer l'application en production.

## 🔐 Sécurité

### Configuration
- [ ] `SECRET_KEY` générée et unique (minimum 32 caractères)
- [ ] `ADMIN_PASSWORD` fort (minimum 16 caractères, caractères spéciaux)
- [ ] Variables d'environnement stockées dans `.env.production` (non versionnées)
- [ ] `.env.production` ajouté à `.gitignore`
- [ ] `DEBUG=False` en production
- [ ] `FORCE_HTTPS=true` configuré

### Certificats SSL/TLS
- [ ] Certificat SSL/TLS valide configuré
- [ ] Certificat placé dans `nginx/ssl/`
- [ ] Renouvellement automatique configuré (Let's Encrypt)

### Headers de sécurité
- [ ] HTTPS forcé (HSTS)
- [ ] Cookies sécurisés (Secure, HttpOnly, SameSite)
- [ ] Headers CORS configurés correctement
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection activé
- [ ] Content-Security-Policy configuré

### Authentification
- [ ] Rate limiting activé sur `/api/login`
- [ ] Protection brute force activée
- [ ] Sessions avec expiration
- [ ] CSRF tokens activés

## 🌐 Configuration réseau

### DNS
- [ ] Domaine configuré
- [ ] Sous-domaines configurés si nécessaire
- [ ] DNS records pointent vers le serveur

### Firewall
- [ ] Ports ouverts uniquement (80, 443)
- [ ] Ports backend/frontend non exposés publiquement
- [ ] SSH configuré avec clés (pas de mots de passe)

### CORS
- [ ] Origines autorisées limitées
- [ ] Credentials configurés correctement
- [ ] Headers CORS testés

## 📦 Déploiement

### Docker
- [ ] Images construites avec `docker-compose.prod.yml`
- [ ] Dockerfiles de production utilisés
- [ ] Volumes configurés correctement
- [ ] Healthchecks configurés

### Gunicorn
- [ ] Nombre de workers configuré (`GUNICORN_WORKERS`)
- [ ] Timeout configuré
- [ ] Logs configurés
- [ ] Workers testés sous charge

### Nginx
- [ ] Configuration de production créée
- [ ] Proxy vers backend configuré
- [ ] Compression activée
- [ ] Cache configuré pour assets statiques
- [ ] Logs configurés

## 💾 Données

### Sauvegardes
- [ ] Backups automatiques activés
- [ ] Fréquence de backup configurée
- [ ] Rétention des backups configurée
- [ ] Test de restauration effectué
- [ ] Backups stockés hors serveur

### Stockage
- [ ] Volumes Docker persistants configurés
- [ ] Permissions de fichiers correctes
- [ ] Quotas de disque vérifiés

## 📊 Monitoring

### Logs
- [ ] Logs centralisés configurés
- [ ] Rotation des logs configurée
- [ ] Niveaux de log appropriés (INFO en prod)
- [ ] Logs de sécurité activés

### Métriques
- [ ] Health check endpoint fonctionnel (`/api/health`)
- [ ] Métriques système collectées
- [ ] Alertes configurées (optionnel)

### Surveillance
- [ ] Uptime monitoring configuré
- [ ] Alertes email/SMS configurées (optionnel)

## 🧪 Tests

### Tests automatisés
- [ ] Tests backend passent
- [ ] Tests frontend passent
- [ ] Tests E2E passent
- [ ] Tests de sécurité passent

### Tests manuels
- [ ] Login/Logout fonctionne
- [ ] Toutes les fonctionnalités testées
- [ ] Responsive design vérifié
- [ ] Performance acceptable

## ⚡ Performance

### Optimisation
- [ ] Frontend build optimisé (minification, etc.)
- [ ] Assets compressés
- [ ] Cache configuré
- [ ] Lazy loading activé

### Ressources
- [ ] CPU/Memory suffisants
- [ ] Disque suffisant
- [ ] Bandwidth suffisant

## 📝 Documentation

### Utilisateur
- [ ] README.md à jour
- [ ] Guide de déploiement (`DEPLOYMENT.md`)
- [ ] Instructions d'utilisation

### Technique
- [ ] Architecture documentée
- [ ] Variables d'environnement documentées
- [ ] Procédures de maintenance documentées

## 🔄 Maintenance

### Mises à jour
- [ ] Processus de mise à jour documenté
- [ ] Procédure de rollback préparée
- [ ] Fenêtres de maintenance planifiées

### Support
- [ ] Contacts de support identifiés
- [ ] Procédures d'urgence préparées

## ✅ Post-déploiement

### Vérifications
- [ ] Application accessible via HTTPS
- [ ] Tous les endpoints fonctionnent
- [ ] Pas d'erreurs dans les logs
- [ ] Performance acceptable
- [ ] Sécurité vérifiée (outils automatisés)

### Communication
- [ ] Utilisateurs notifiés du déploiement
- [ ] Documentation mise à jour
- [ ] Support prêt

## 🚨 Rollback

### Préparation
- [ ] Images Docker taguées
- [ ] Backups récents disponibles
- [ ] Procédure de rollback testée
- [ ] Temps de rollback estimé

---

**Date de déploiement prévu :** _______________
**Responsable :** _______________
**Signature :** _______________

