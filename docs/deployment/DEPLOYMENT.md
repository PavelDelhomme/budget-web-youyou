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

Éditez `.env.production` et configurez toutes les variables nécessaires.

**Utilisez le fichier `env.production.example` comme modèle** :

```bash
cp env.production.example .env.production
```

#### Variables de Sécurité (OBLIGATOIRES)

- `SECRET_KEY` : Clé secrète aléatoire (minimum 64 caractères)
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- `ADMIN_EMAIL` : Email administrateur (ex: `admin@votre-domaine.com`)
- `ADMIN_PASSWORD` : Mot de passe fort (minimum 16 caractères, utiliser des caractères spéciaux)

#### Variables WAF (Web Application Firewall)

- `WAF_BLOCK_MODE` : `true` pour bloquer les menaces, `false` pour log seulement (défaut: `true`)
- `WAF_MAX_THREATS_PER_IP` : Nombre maximum de menaces avant blocage (défaut: `5`)
- `WAF_BLOCK_DURATION` : Durée de blocage en secondes (défaut: `3600` = 1 heure)

#### Variables Application

- `PORT` : Port du backend (défaut: `6060`)
- `DEBUG` : Mode debug (défaut: `false` en production)
- `FLASK_ENV` : Environnement Flask (`production` ou `development`)
- `FORCE_HTTPS` : Forcer HTTPS (défaut: `true` en production)

#### Variables Frontend

- `VITE_API_URL` : URL de l'API en production (ex: `https://votre-domaine.com`)
- `VITE_PROXY_TARGET` : Cible du proxy Vite (développement: `http://backend:6060`)
- `VITE_HMR_DISABLED` : Désactiver HMR en production (défaut: `true`)

#### Variables CORS

- `CORS_ORIGINS` : Origines autorisées, séparées par des virgules (ex: `https://votre-domaine.com,https://www.votre-domaine.com`)

#### Variables Nginx (Production)

- `DOMAIN` : Domaine de l'application (ex: `votre-domaine.com`)

#### Variables Sauvegardes

- `BACKUP_ENABLED` : Activer les sauvegardes automatiques (défaut: `true`)
- `BACKUP_FREQUENCY` : Fréquence (`daily`, `weekly`, `monthly`)
- `BACKUP_RETENTION_DAYS` : Nombre de jours de rétention (défaut: `30`)

## 2. Configuration de la sécurité

### Certificat SSL/TLS

Placez vos certificats SSL dans `./nginx/ssl/` :

```bash
mkdir -p nginx/ssl
# Copier certificat.pem et certificat.key
```

**Option 1 : Certificat auto-signé (développement uniquement)**

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=FR/ST=State/L=City/O=Organization/CN=localhost"
```

**Option 2 : Let's Encrypt (production)**

Utilisez Certbot pour obtenir un certificat gratuit :

```bash
certbot certonly --standalone -d votre-domaine.com
# Copier les certificats dans nginx/ssl/
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem nginx/ssl/key.pem
```

### Configuration Nginx

La configuration Nginx est déjà prête dans `nginx/nginx.prod.conf`. Elle inclut :

- ✅ Redirection HTTP vers HTTPS
- ✅ Configuration SSL/TLS moderne (TLS 1.2/1.3)
- ✅ Rate limiting par route
- ✅ Headers de sécurité (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Proxy vers backend et frontend
- ✅ Support WebSocket

**Personnaliser le domaine** :

Éditez `nginx/nginx.prod.conf` et remplacez `${DOMAIN}` par votre domaine, ou configurez la variable d'environnement `DOMAIN`.

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

- [ ] **SECRET_KEY** unique et fort (minimum 64 caractères)
- [ ] **ADMIN_PASSWORD** fort (minimum 16 caractères avec caractères spéciaux)
- [ ] **HTTPS activé** avec certificat valide
- [ ] **Cookies sécurisés** (Secure, HttpOnly, SameSite)
- [ ] **CORS configuré** correctement (domaines autorisés uniquement)
- [ ] **Rate limiting activé** (Nginx + Flask)
- [ ] **WAF activé** (`WAF_BLOCK_MODE=true`)
- [ ] **Logs de sécurité activés** (waf.log, security.log)
- [ ] **Backups automatiques** configurés
- [ ] **DMZ configurée** (réseaux isolés)
- [ ] **Monitoring actif** (health checks, métriques)
- [ ] **Firewall configuré** (ports minimaux ouverts)
- [ ] **Mises à jour régulières** (sécurité système et Docker)
- [ ] **Variables d'environnement** sécurisées (pas de secrets dans le code)
- [ ] **Certificats SSL** valides et à jour
- [ ] **Headers de sécurité** configurés (HSTS, CSP, etc.)

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

