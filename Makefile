.PHONY: help install dev start restart stop build clean docker-build docker-up docker-down docker-logs docker-ps status ports logs logs-backend logs-frontend reset reset-and-restart

# Variables
BACKEND_PORT ?= 6060
FRONTEND_PORT ?= 6061
PYTHON ?= python3
VENV_DIR ?= venv

help: ## Affiche l'aide
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📋 BUDGET WEB - Commandes disponibles"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🚀 DÉMARRAGE / ARRÊT :"
	@grep -E '^(dev|start|stop|restart|docker-up|docker-down|docker-restart):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📦 INSTALLATION / BUILD :"
	@grep -E '^(install|install-all|docker-build|build|build-client):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📊 SURVEILLANCE :"
	@grep -E '^(status|ports|logs|logs-backend|logs-frontend|docker-ps|docker-logs):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🗑️  RÉINITIALISATION / NETTOYAGE :"
	@grep -E '^(reset|reset-and-restart|clean|clean-data|clean-docker):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "⚙️  AUTRES :"
	@grep -E '^(run-server|run-client|venv|help):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "💡 Commandes les plus utilisées :"
	@echo "   make install    → Installer les dépendances"
	@echo "   make dev        → Démarrer en mode développement (avec logs)"
	@echo "   make restart    → Redémarrer en arrière-plan (sans logs)"
	@echo "   make logs       → Voir les logs en continu"
	@echo "   make status     → Vérifier l'état des conteneurs"
	@echo "   make reset → Réinitialiser les données utilisateur"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""

install: docker-build ## Installe toutes les dépendances via Docker
	@echo "✅ Installation via Docker terminée!"

install-all: docker-build ## Alias pour install via Docker

venv: ## Crée l'environnement virtuel Python
	@if [ ! -d "$(VENV_DIR)" ]; then \
		$(PYTHON) -m venv $(VENV_DIR); \
		echo "✅ Environnement virtuel créé. Activez-le avec: source $(VENV_DIR)/bin/activate"; \
	else \
		echo "⚠️  L'environnement virtuel existe déjà"; \
	fi

dev: ## Démarre le serveur de développement via Docker avec affichage des logs
	@echo "🚀 Démarrage du projet en mode développement avec Docker..."
	@echo "📡 Backend Flask: http://localhost:$(BACKEND_PORT)"
	@echo "🌐 Frontend React: http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "Utilisez Ctrl+C pour arrêter les serveurs"
	@echo ""
	docker-compose up

start: ## Démarre les conteneurs en arrière-plan (sans afficher les logs)
	@echo "🚀 Démarrage des conteneurs en arrière-plan..."
	@docker-compose up -d
	@echo "✅ Conteneurs démarrés!"
	@echo "📡 Backend Flask: http://localhost:$(BACKEND_PORT)"
	@echo "🌐 Frontend React: http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "💡 Utilisez 'make logs' pour voir les logs"

stop: ## Arrête les serveurs backend et frontend (Docker)
	@echo "🛑 Arrêt des conteneurs Docker..."
	docker-compose down
	@echo "✅ Conteneurs arrêtés!"

restart: ## Redémarre les serveurs backend et frontend (Docker en arrière-plan)
	@echo "🔄 Redémarrage des conteneurs Docker..."
	docker-compose down
	@sleep 2
	docker-compose up -d
	@echo "✅ Conteneurs redémarrés en arrière-plan !"
	@echo "💡 Utilisez 'make logs' pour voir les logs"

run-server: ## Lance uniquement le serveur backend Flask (Docker)
	@echo "📡 Démarrage du backend Flask via Docker..."
	docker-compose up backend

run-client: ## Lance uniquement le frontend React (Docker)
	@echo "🌐 Démarrage du frontend React via Docker..."
	docker-compose up frontend

build: ## Compile le frontend pour la production (via Docker)
	@echo "🔨 Compilation du frontend via Docker..."
	docker-compose run --rm frontend npm run build
	@echo "✅ Build terminé!"

build-client: build ## Alias pour build

# Docker commands
docker-build: ## Construit les images Docker
	@echo "🐳 Construction des images Docker..."
	docker-compose build
	@echo "✅ Images construites!"

docker-up: ## Démarre les conteneurs Docker
	@echo "🐳 Démarrage des conteneurs Docker..."
	docker-compose up -d
	@echo "✅ Conteneurs démarrés!"
	@echo "📡 Backend Flask: http://localhost:$(BACKEND_PORT)"
	@echo "🌐 Frontend React: http://localhost:$(FRONTEND_PORT)"

docker-down: ## Arrête les conteneurs Docker
	@echo "🐳 Arrêt des conteneurs Docker..."
	docker-compose down
	@echo "✅ Conteneurs arrêtés!"

docker-logs: logs ## Alias pour logs

logs: ## Affiche les logs des conteneurs (suivi en temps réel)
	@echo "📋 Logs des conteneurs budget-web..."
	@echo "   Utilisez Ctrl+C pour quitter"
	@echo ""
	docker-compose logs -f

logs-backend: ## Affiche les logs du backend uniquement
	@echo "📋 Logs du backend (budget-web-backend)..."
	@echo "   Utilisez Ctrl+C pour quitter"
	@echo ""
	docker-compose logs -f backend

logs-frontend: ## Affiche les logs du frontend uniquement
	@echo "📋 Logs du frontend (budget-web-frontend)..."
	@echo "   Utilisez Ctrl+C pour quitter"
	@echo ""
	docker-compose logs -f frontend

docker-ps: ## Affiche l'état des conteneurs
	docker-compose ps

status: ## Affiche l'état des conteneurs Docker (statique, sans logs)
	@echo "📊 État des conteneurs Docker du projet budget-web :"
	@echo ""
	@if docker-compose ps 2>/dev/null | grep -q "budget-web"; then \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo ""; \
		echo "📋 URLs d'accès :"; \
		echo "   Backend:  http://localhost:6060"; \
		echo "   Frontend: http://localhost:6061"; \
		echo ""; \
		echo "💡 Commandes utiles :"; \
		echo "   make logs        - Voir les logs en temps réel"; \
		echo "   make logs-backend - Logs du backend uniquement"; \
		echo "   make logs-frontend - Logs du frontend uniquement"; \
		echo "   make ports       - Voir les ports utilisés"; \
	else \
		echo "⚠️  Aucun conteneur budget-web trouvé."; \
		echo "   Les conteneurs ne sont pas démarrés."; \
		echo ""; \
		echo "💡 Pour démarrer les conteneurs :"; \
		echo "   make docker-up   - Démarrer en arrière-plan"; \
		echo "   make dev         - Démarrer avec logs affichés"; \
	fi

ports: ## Affiche les ports utilisés par les conteneurs Docker
	@echo "🔌 Ports utilisés par les conteneurs budget-web :"
	@echo ""
	@if docker-compose ps 2>/dev/null | grep -q "budget-web"; then \
		echo "📡 Backend (budget-web-backend):"; \
		BACKEND_PORTS=$$(docker port budget-web-backend 2>/dev/null | grep "6060" || echo ""); \
		if [ -n "$$BACKEND_PORTS" ]; then \
			echo "$$BACKEND_PORTS" | sed 's/^/   /'; \
			echo "   → Accessible sur: http://localhost:6060"; \
		else \
			echo "   ⚠️  Conteneur non démarré"; \
		fi; \
		echo ""; \
		echo "🌐 Frontend (budget-web-frontend):"; \
		FRONTEND_PORTS=$$(docker port budget-web-frontend 2>/dev/null | grep "3030" || echo ""); \
		if [ -n "$$FRONTEND_PORTS" ]; then \
			echo "$$FRONTEND_PORTS" | sed 's/^/   /'; \
			echo "   → Accessible sur: http://localhost:6061"; \
		else \
			echo "   ⚠️  Conteneur non démarré"; \
		fi; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "📋 Résumé des ports mappés sur la machine hôte :"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "   Backend:  http://localhost:6060 (port externe 6060 → port interne 6060)"; \
		echo "   Frontend: http://localhost:6061 (port externe 6061 → port interne 3030)"; \
		echo ""; \
		echo "🔍 Vérification des ports sur la machine :"; \
		if lsof -ti:6060 >/dev/null 2>&1; then \
			echo "   ✅ Port 6060 (backend) - EN COURS D'UTILISATION"; \
			PID=$$(lsof -ti:6060 | head -1); \
			ps -p $$PID -o pid,command --no-headers 2>/dev/null | sed 's/^/      Processus (PID $$PID): /' || echo "      Processus: $$PID"; \
		else \
			echo "   ⚠️  Port 6060 (backend) - LIBRE"; \
		fi; \
		if lsof -ti:6061 >/dev/null 2>&1; then \
			echo "   ✅ Port 6061 (frontend) - EN COURS D'UTILISATION"; \
			PID=$$(lsof -ti:6061 | head -1); \
			ps -p $$PID -o pid,command --no-headers 2>/dev/null | sed 's/^/      Processus (PID $$PID): /' || echo "      Processus: $$PID"; \
		else \
			echo "   ⚠️  Port 6061 (frontend) - LIBRE"; \
		fi; \
	else \
		echo "⚠️  Aucun conteneur budget-web actif."; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "📋 Ports configurés pour ce projet :"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "   Backend:  http://localhost:6060"; \
		echo "   Frontend: http://localhost:6061"; \
		echo ""; \
		echo "💡 Utilisez 'make docker-up' ou 'make dev' pour démarrer les conteneurs."; \
	fi

docker-restart: ## Redémarre les conteneurs Docker
	@echo "🐳 Redémarrage des conteneurs Docker..."
	docker-compose restart
	@echo "✅ Conteneurs redémarrés!"

reset: ## Réinitialise les données utilisateur (supprime tous les fichiers de données)
	@echo "⚠️  ATTENTION : Cette commande va supprimer toutes les données utilisateur !"
	@echo ""
	@read -p "Êtes-vous sûr ? Tapez 'oui' pour confirmer : " confirm && [ "$$confirm" = "oui" ] || (echo "❌ Opération annulée." && exit 1)
	@echo ""
	@echo "🗑️  Suppression des données utilisateur..."
	@echo ""
	@# Supprimer depuis le conteneur Docker si actif (les données sont montées depuis ./backend/data)
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "📦 Suppression depuis le conteneur Docker (budget-web-backend)..."; \
		docker exec budget-web-backend sh -c "rm -f /app/data/*.json 2>/dev/null || true" || true; \
		echo "✅ Données supprimées depuis le conteneur Docker"; \
	fi
	@# Supprimer depuis le système de fichiers local (mount point)
	@if [ -d "backend/data" ]; then \
		echo "📁 Suppression depuis le système de fichiers local..."; \
		rm -f backend/data/*.json 2>/dev/null || true; \
		echo "✅ Fichiers supprimés dans backend/data/"; \
	fi
	@echo ""
	@echo "✅ Réinitialisation terminée !"
	@echo ""
	@echo "💡 Pour relancer l'application avec réinitialisation :"
	@echo "   1. Rafraîchissez votre navigateur (Ctrl+R ou F5)"
	@echo "   2. Le modal d'initialisation devrait apparaître automatiquement"
	@echo "   3. Ou utilisez: make reset-and-restart"

reset-and-restart: ## Réinitialise les données ET redémarre l'application (tout en un)
	@echo "🔄 Réinitialisation complète des données et redémarrage..."
	@echo ""
	@read -p "⚠️  Supprimer toutes les données et redémarrer ? Tapez 'oui' : " confirm && [ "$$confirm" = "oui" ] || (echo "❌ Opération annulée." && exit 1)
	@echo ""
	@echo "🗑️  Suppression des données utilisateur..."
	@# Supprimer depuis le conteneur Docker si actif
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "📦 Suppression depuis le conteneur Docker..."; \
		docker exec budget-web-backend sh -c "rm -f /app/data/*.json 2>/dev/null || true" || true; \
	fi
	@# Supprimer depuis le système de fichiers local
	@if [ -d "backend/data" ]; then \
		rm -f backend/data/*.json 2>/dev/null || true; \
	fi
	@echo "✅ Données supprimées !"
	@echo ""
	@echo "🔄 Redémarrage de l'application..."
	@$(MAKE) restart
	@echo ""
	@echo "✅ Données réinitialisées et application redémarrée !"
	@echo "💡 Le modal d'initialisation devrait apparaître au prochain chargement de la page."

clean: ## Nettoie les fichiers de build et dépendances
	@echo "🧹 Nettoyage..."
	@echo "Suppression des fichiers locaux (ignore les erreurs de permissions)..."
	-rm -rf client/dist client/node_modules client/build node_modules 2>/dev/null || true
	-rm -rf backend/__pycache__ backend/**/__pycache__ backend/*.pyc 2>/dev/null || true
	@echo "✅ Nettoyage terminé!"

clean-data: ## Nettoie uniquement les données utilisateur (attention!)
	@echo "⚠️  Suppression des données utilisateur..."
	rm -rf backend/data/*.json
	@echo "✅ Données supprimées!"

clean-docker: ## Nettoie les conteneurs et images Docker
	@echo "🐳 Nettoyage Docker..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Docker nettoyé!"
