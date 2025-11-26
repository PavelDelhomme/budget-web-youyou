# Budget Annuel - Application Web

Application web pour la gestion de budget annuel, avec backend Flask et frontend React.

## 🐳 Développement avec Docker (Recommandé)

Tout est configuré pour fonctionner avec Docker. **Aucune installation locale n'est nécessaire.**

### Prérequis

- Docker
- Docker Compose

### Commandes principales

```bash
# Installer les dépendances (construire les images Docker)
make install

# Démarrer le projet en mode développement
make dev

# Redémarrer le projet
make restart

# Arrêter le projet
make stop

# Voir les logs
make docker-logs

# Voir l'état des conteneurs
make docker-ps
```

### Première utilisation

```bash
# 1. Construire les images Docker
make docker-build

# 2. Démarrer les services
make dev

# Ou en une seule commande:
make install && make dev
```

Le projet sera accessible sur :
- **Frontend** : http://localhost:6061
- **Backend** : http://localhost:6060

### Connexion

- **Email** : `dev@delhomme.ovh`
- **Mot de passe** : `5n!B@#c*ymgEBYXrWdKE`

## 📦 Structure du projet

```
.
├── backend/          # Backend Flask
│   ├── app.py       # Application principale
│   ├── api/         # Utilitaires API
│   ├── data/        # Données utilisateur (JSON)
│   └── Dockerfile
├── client/          # Frontend React + Vite
│   ├── src/         # Code source React
│   ├── public/      # Fichiers statiques
│   └── Dockerfile
└── docker-compose.yml
```

## 🔧 Commandes Make disponibles

| Commande | Description |
|----------|-------------|
| `make help` | Affiche toutes les commandes disponibles |
| `make install` | Installe les dépendances via Docker |
| `make dev` | Démarre le projet en mode développement |
| `make start` | Alias pour `make dev` |
| `make restart` | Redémarre les conteneurs |
| `make stop` | Arrête les conteneurs |
| `make build` | Compile le frontend pour la production |
| `make docker-build` | Construit les images Docker |
| `make docker-up` | Démarre les conteneurs en arrière-plan |
| `make docker-down` | Arrête les conteneurs |
| `make docker-logs` | Affiche les logs des conteneurs |
| `make docker-ps` | Affiche l'état des conteneurs |
| `make docker-restart` | Redémarre les conteneurs Docker |
| `make reset-data` | Réinitialise les données utilisateur (avec confirmation) |
| `make reset-and-restart` | Réinitialise les données ET redémarre l'application |
| `make clean` | Nettoie les fichiers de build locaux |
| `make clean-docker` | Nettoie les conteneurs et images Docker |
| `make status` | Affiche l'état des conteneurs Docker |
| `make ports` | Affiche les ports utilisés par les conteneurs |
| `make logs` | Affiche les logs en temps réel |

## 🔍 Dépannage

### Erreur de permissions sur node_modules

Si vous avez des erreurs de permissions, nettoyez les fichiers locaux :

```bash
make clean
make docker-down
make docker-build
make dev
```

### Port déjà utilisé

Si les ports 6061 ou 6060 sont déjà utilisés :

```bash
make stop
# Attendre quelques secondes
make dev
```

### Reconstruire les images Docker

Si vous modifiez les dépendances (package.json, requirements.txt) :

```bash
make docker-build
make dev
```

## 📝 Notes importantes

- Toutes les dépendances sont installées dans les conteneurs Docker
- Les données utilisateur sont stockées dans `backend/data/` et persistées via un volume Docker
- Le frontend utilise Vite avec proxy vers le backend
- Tailwind CSS est installé localement (pas de CDN)

## 🔐 Configuration

Les variables d'environnement peuvent être définies dans un fichier `.env` à la racine :

```env
SECRET_KEY=your-secret-key
ADMIN_EMAIL=dev@delhomme.ovh
ADMIN_PASSWORD=your-password
DEBUG=False
```

## 🚀 Production

Pour la production, utilisez :

```bash
make build
make docker-up
```

Les conteneurs seront démarrés en arrière-plan et redémarreront automatiquement en cas de problème.
