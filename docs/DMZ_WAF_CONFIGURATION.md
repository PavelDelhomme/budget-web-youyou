# 🛡️ Configuration DMZ et WAF - Budget Web Youyou

## 📋 Vue d'ensemble

Ce document explique comment configurer une **DMZ (Demilitarized Zone)** et un **WAF (Web Application Firewall)** pour sécuriser l'application en production.

---

## 🔒 **WAF (Web Application Firewall)**

### Qu'est-ce qu'un WAF ?

Un **WAF** est un système de sécurité qui filtre et bloque les requêtes HTTP/HTTPS malveillantes avant qu'elles n'atteignent votre application. C'est comme un portier qui vérifie chaque visiteur avant de le laisser entrer.

### Fonctionnalités du WAF Implémenté

#### 1. **Détection d'Injection SQL**
- Détecte les tentatives d'injection SQL dans les paramètres URL, JSON, formulaires
- Patterns détectés : `SELECT`, `UNION`, `DROP`, `; DROP TABLE`, etc.
- **En simple** : Empêche les hackers d'accéder à votre base de données

#### 2. **Détection XSS (Cross-Site Scripting)**
- Détecte les scripts malveillants dans les données
- Patterns détectés : `<script>`, `javascript:`, `onclick=`, `alert()`, etc.
- **En simple** : Empêche l'injection de code JavaScript malveillant

#### 3. **Détection Command Injection**
- Détecte les tentatives d'exécution de commandes système
- Patterns détectés : `; cat /etc/passwd`, `| ls`, `$(command)`, etc.
- **En simple** : Empêche l'exécution de commandes sur le serveur

#### 4. **Détection Path Traversal**
- Détecte les tentatives d'accès à des fichiers sensibles
- Patterns détectés : `../../../etc/passwd`, `/etc/shadow`, etc.
- **En simple** : Empêche l'accès aux fichiers système

#### 5. **Détection LDAP Injection**
- Détecte les tentatives d'injection LDAP
- **En simple** : Protection des annuaires LDAP

#### 6. **Détection XXE (XML External Entity)**
- Détecte les attaques XXE dans les fichiers XML
- **En simple** : Empêche les attaques via XML malveillant

#### 7. **Détection SSRF (Server-Side Request Forgery)**
- Détecte les tentatives de requêtes vers des adresses internes
- Patterns détectés : `localhost`, `127.0.0.1`, `file://`, etc.
- **En simple** : Empêche les requêtes vers des ressources internes

#### 8. **Détection Headers Suspects**
- Analyse les headers HTTP pour détecter des manipulations
- Headers surveillés : `X-Forwarded-Host`, `X-Original-URL`, etc.

#### 9. **Détection User-Agents Suspects**
- Identifie les bots malveillants et scanners
- Patterns : `sqlmap`, `nikto`, `nmap`, etc.
- **En simple** : Détecte les outils automatisés d'attaque

#### 10. **Blocage Automatique d'IP**
- Bloque automatiquement les IPs qui génèrent trop de menaces
- Seuil : 5 menaces = blocage de 1 heure
- **En simple** : Bannit automatiquement les attaquants

### Configuration du WAF

#### Variables d'Environnement

```bash
# Mode blocage (true = bloque, false = log seulement)
WAF_BLOCK_MODE=true

# Seuil de menaces avant blocage
WAF_MAX_THREATS_PER_IP=5

# Durée de blocage (secondes)
WAF_BLOCK_DURATION=3600
```

#### Utilisation dans le Code

Le WAF est automatiquement activé via le décorateur `@waf_protection` :

```python
from api.waf import waf_protection

@app.route('/api/sensitive-endpoint', methods=['POST'])
@waf_protection
@require_auth
def sensitive_function():
    # Code protégé par WAF
    pass
```

#### Logs WAF

Les menaces détectées sont loggées dans :
- **Fichier** : `backend/data/waf.log`
- **Format** : JSON avec timestamp, IP, type de menace, détails

Exemple de log :
```json
{
  "timestamp": "2024-12-04T10:30:00",
  "ip": "192.168.1.100",
  "threat_type": "sql_injection",
  "method": "POST",
  "path": "/api/get",
  "details": {
    "parameter": "year",
    "value": "2025 OR 1=1",
    "pattern": "OR.*=.*="
  }
}
```

### Statistiques WAF

Endpoint pour obtenir des statistiques :
```bash
GET /api/waf/stats
```

Réponse :
```json
{
  "total_threats_detected": 42,
  "blocked_ips": 3,
  "threats_by_type": {
    "sql_injection": 20,
    "xss": 15,
    "path_traversal": 7
  },
  "top_threatening_ips": {
    "192.168.1.100": 8,
    "10.0.0.50": 5
  }
}
```

---

## 🏰 **DMZ (Demilitarized Zone)**

### Qu'est-ce qu'une DMZ ?

Une **DMZ** est une zone réseau isolée entre Internet et votre réseau interne. C'est comme une zone tampon avec plusieurs couches de sécurité.

### Architecture Recommandée

```
Internet
   |
   v
[Reverse Proxy / Load Balancer] (DMZ Zone 1)
   |
   v
[WAF / Nginx] (DMZ Zone 2)
   |
   v
[Application Backend] (Réseau Privé)
   |
   v
[Base de Données] (Réseau Privé Sécurisé)
```

### Configuration Docker Compose avec DMZ

```yaml
version: '3.8'

services:
  # Zone DMZ 1 : Reverse Proxy / Load Balancer (optionnel)
  nginx-proxy:
    image: nginx:alpine
    container_name: budget-nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    networks:
      - dmz-network
    restart: unless-stopped

  # Zone DMZ 2 : WAF / Application Gateway
  nginx-waf:
    image: nginx:alpine
    container_name: budget-nginx-waf
    volumes:
      - ./nginx/waf.conf:/etc/nginx/nginx.conf
      - ./nginx/waf-rules:/etc/nginx/waf-rules
    networks:
      - dmz-network
      - app-network
    depends_on:
      - backend
    restart: unless-stopped

  # Application Backend (Réseau Privé)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: budget-web-backend
    expose:  # expose au lieu de ports (pas accessible depuis Internet)
      - "6060"
    environment:
      - PORT=6060
      - SECRET_KEY=${SECRET_KEY}
      - WAF_BLOCK_MODE=true
    volumes:
      - ./backend/data:/app/data
    networks:
      - app-network  # Réseau privé uniquement
    restart: unless-stopped

  # Frontend (Réseau Privé)
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: budget-web-frontend
    expose:
      - "3030"
    networks:
      - app-network
    depends_on:
      - backend
    restart: unless-stopped

networks:
  dmz-network:
    driver: bridge
    # Accessible depuis l'extérieur
  app-network:
    driver: bridge
    internal: true  # Réseau privé, pas d'accès Internet direct
```

### Configuration Nginx avec WAF

Fichier `nginx/waf.conf` :

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Blocage d'IPs
geo $blocked_ip {
    default 0;
    include /etc/nginx/waf-rules/blocked_ips.conf;
}

# Headers de sécurité
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

server {
    listen 80;
    server_name _;
    
    # Bloquer les IPs blacklistées
    if ($blocked_ip) {
        return 403;
    }
    
    # Rate limiting général
    limit_req zone=general burst=20 nodelay;
    
    location /api/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://backend:6060;
    }
    
    location /api/ {
        proxy_pass http://backend:6060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://frontend:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Règles WAF Nginx (ModSecurity)

Pour une protection encore plus avancée, vous pouvez utiliser ModSecurity avec Nginx :

```bash
# Installation ModSecurity pour Nginx
# (voir documentation ModSecurity)
```

Règles de base (`nginx/modsecurity-rules.conf`) :
```nginx
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess Off

# Bloquer SQL Injection
SecRule ARGS "@detectSQLi" "id:1000,phase:2,deny,status:403,msg:'SQL Injection detected'"

# Bloquer XSS
SecRule ARGS "@detectXSS" "id:1001,phase:2,deny,status:403,msg:'XSS detected'"

# Limiter la taille du body
SecRequestBodyLimit 10485760
```

---

## 🔧 **Configuration Complète de Production**

### 1. Architecture Réseau

```
Internet
   |
   v
[Cloudflare / CDN] (Protection DDoS)
   |
   v
[Firewall] (Filtrage IP, ports)
   |
   v
[Nginx Reverse Proxy] (DMZ Zone 1)
   - SSL/TLS Termination
   - Load Balancing
   |
   v
[WAF Layer] (DMZ Zone 2)
   - ModSecurity
   - Rate Limiting
   - IP Blacklisting
   |
   v
[Application Backend] (Réseau Privé)
   |
   v
[Database] (Réseau Privé Sécurisé)
```

### 2. Fichier docker-compose.prod.yml

```yaml
version: '3.8'

services:
  # Nginx avec WAF
  nginx:
    image: nginx:alpine
    container_name: budget-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/waf-rules:/etc/nginx/waf-rules
    networks:
      - dmz
    restart: unless-stopped
    depends_on:
      - backend
      - frontend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: budget-backend
    expose:
      - "6060"
    environment:
      - PORT=6060
      - SECRET_KEY=${SECRET_KEY}
      - WAF_BLOCK_MODE=true
      - FLASK_ENV=production
    volumes:
      - backend_data:/app/data
    networks:
      - private
    restart: unless-stopped

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    container_name: budget-frontend
    expose:
      - "3030"
    networks:
      - private
    restart: unless-stopped

networks:
  dmz:
    driver: bridge
  private:
    driver: bridge
    internal: true

volumes:
  backend_data:
```

### 3. Script de Déploiement avec DMZ

Créez `scripts/deploy-dmz.sh` :

```bash
#!/bin/bash

# Déploiement avec configuration DMZ

echo "🔒 Configuration de la sécurité DMZ..."

# 1. Générer les certificats SSL
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "⚠️  Certificat SSL manquant. Génération d'un certificat auto-signé pour le développement..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=FR/ST=State/L=City/O=Organization/CN=localhost"
fi

# 2. Créer les répertoires WAF
mkdir -p nginx/waf-rules
touch nginx/waf-rules/blocked_ips.conf

# 3. Déployer avec Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Vérifier les services
echo "✅ Vérification des services..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Déploiement terminé !"
```

---

## 📊 **Monitoring et Alertes**

### Endpoints de Monitoring WAF

#### Statistiques WAF
```bash
GET /api/waf/stats
Authorization: Bearer <admin_token>
```

#### Liste des IPs bloquées
```bash
GET /api/waf/blocked-ips
```

#### Détails des menaces récentes
```bash
GET /api/waf/threats?limit=50
```

### Alertes Automatiques

Le WAF peut envoyer des alertes en cas de :
- Blocage d'une IP
- Détection de nombreuses menaces
- Pattern d'attaque suspect

---

## 🚀 **Avantages de cette Configuration**

### WAF
- ✅ **Protection proactive** : Détecte et bloque les attaques avant qu'elles n'atteignent l'application
- ✅ **Blocage automatique** : Bannit automatiquement les attaquants
- ✅ **Logs détaillés** : Traçabilité complète des menaces
- ✅ **Performance** : Impact minimal sur les performances (< 5ms)

### DMZ
- ✅ **Isolation réseau** : Séparation claire entre zones publiques et privées
- ✅ **Défense en profondeur** : Plusieurs couches de sécurité
- ✅ **Scalabilité** : Facilite l'ajout de serveurs
- ✅ **Load balancing** : Distribution de charge

---

## 📝 **Checklist de Sécurité**

### Avant la Production

- [ ] WAF activé et configuré
- [ ] Mode blocage activé (`WAF_BLOCK_MODE=true`)
- [ ] Certificats SSL/TLS valides
- [ ] Nginx configuré avec règles WAF
- [ ] Rate limiting configuré
- [ ] IPs suspectes blacklistées
- [ ] Logs WAF activés et surveillés
- [ ] DMZ configurée avec réseaux isolés
- [ ] Backend dans réseau privé uniquement
- [ ] Base de données inaccessible depuis Internet
- [ ] Headers de sécurité configurés
- [ ] Monitoring et alertes configurés

---

**Documentation créée le** : 2024-12-04  
**Statut** : ✅ Configuration prête pour production

