# Guide de Déploiement en Production

Ce guide explique comment déployer l'application Budget Annuel en production de manière sécurisée.

## Prérequis

- Docker et Docker Compose installés
- Domaine avec certificat SSL/TLS (Let's Encrypt recommandé)
- Variables d'environnement configurées
- Backups configurés

## 1. Configuration de l'environnement

### Créer le fichier `.env.production`

```bash
cp .env.production.example .env.production
```

### Générer une clé secrète sécurisée

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Configurer les variables d'environnement

Éditez `.env.production` et configurez :

- `SECRET_KEY` : Clé secrète aléatoire (minimum 32 caractères)
- `ADMIN_EMAIL` : Email administrateur
- `ADMIN_PASSWORD` : Mot de passe fort (minimum 16 caractères)
- `VITE_API_URL` : URL de l'API en production
- `CORS_ORIGINS` : Domaines autorisés pour CORS

## 2. Configuration de la sécurité

### Certificat SSL/TLS

Placez vos certificats SSL dans `./nginx/ssl/` :

```bash
mkdir -p nginx/ssl
# Copier certificat.pem et certificat.key
```

### Configuration Nginx

Créez `nginx/nginx.prod.conf` avec la configuration appropriée pour votre domaine.

## 3. Construction des images Docker

```bash
# Backend
docker build -t budget-web-backend:prod -f backend/Dockerfile.prod ./backend

# Frontend
docker build -t budget-web-frontend:prod -f client/Dockerfile.prod ./client
```

## 4. Déploiement

### Avec Docker Compose

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Vérifier le statut

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 5. Vérifications post-déploiement

### Health Check

```bash
curl https://votre-domaine.com/api/health
```

### Tests de sécurité

- Vérifier HTTPS
- Vérifier les headers de sécurité
- Vérifier CORS
- Vérifier les cookies sécurisés

## 6. Sauvegardes

### Configuration automatique

Les sauvegardes sont automatiques si `BACKUP_ENABLED=true`.

### Sauvegarde manuelle

```bash
docker-compose -f docker-compose.prod.yml exec backend python -m api.backup_service backup
```

### Restauration

```bash
docker-compose -f docker-compose.prod.yml exec backend python -m api.backup_service restore <backup_file>
```

## 7. Monitoring

### Logs

```bash
# Backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Métriques

- Health check endpoint : `/api/health`
- Métriques système : Via logs structurés JSON

## 8. Mises à jour

### Processus de mise à jour

1. Sauvegarder les données
2. Pull les dernières modifications
3. Rebuild les images
4. Redémarrer les services

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec backend python -m api.backup_service backup

# Mise à jour
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## 9. Sécurité en production

### Checklist de sécurité

- [ ] SECRET_KEY unique et fort
- [ ] ADMIN_PASSWORD fort
- [ ] HTTPS activé
- [ ] Cookies sécurisés (Secure, HttpOnly, SameSite)
- [ ] CORS configuré correctement
- [ ] Rate limiting activé
- [ ] Logs de sécurité activés
- [ ] Backups automatiques
- [ ] Monitoring actif
- [ ] Firewall configuré
- [ ] Mises à jour régulières

### Hardening

- Désactiver les ports inutiles
- Limiter l'accès SSH
- Utiliser un firewall
- Surveiller les logs de sécurité
- Mettre à jour régulièrement

## 10. Troubleshooting

### Problèmes courants

#### Service ne démarre pas

```bash
docker-compose -f docker-compose.prod.yml logs backend
```

#### Erreurs de connexion

Vérifier :
- Variables d'environnement
- Ports exposés
- Firewall
- CORS configuration

#### Problèmes de performance

- Augmenter `GUNICORN_WORKERS`
- Vérifier les ressources système
- Analyser les logs

## Support

Pour toute question ou problème, consulter les logs et la documentation.

