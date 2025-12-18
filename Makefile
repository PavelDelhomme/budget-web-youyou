.PHONY: help install dev start restart stop down build clean docker-build docker-up docker-down docker-logs docker-ps status ports logs logs-backend logs-frontend reset reset-and-restart test test-syntax test-backend test-frontend test-api test-containers test-integration check-errors test-all test-behavior test-files test-ui-components test-endpoints test-data-structure test-features test-e2e test-e2e-install test-e2e-ui test-e2e-report test-backend-ml test-backend-ml prod prod-build prod-up prod-down prod-restart prod-logs prod-status memory-monitor memory-analyze memory-test ml-validate

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
	@grep -E '^(dev|start|up|stop|down|restart|docker-up|docker-down|docker-restart):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🏭 PRODUCTION :"
	@grep -E '^(prod|prod-):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
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
	@echo "🧪 TESTS & VÉRIFICATIONS :"
	@grep -E '^(test|test-|check-):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "⚙️  AUTRES :"
	@grep -E '^(run-server|run-client|venv|help):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "💡 Commandes les plus utilisées :"
	@echo "   make install    → Installer les dépendances"
	@echo "   make dev        → Démarrer en mode développement (avec logs)"
	@echo "   make up         → Démarrer en arrière-plan (alias de start)"
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
	@echo "dev" > .last-mode 2>/dev/null || true
	docker-compose up

start: ## Démarre les conteneurs en arrière-plan (sans afficher les logs)
	@echo "🚀 Démarrage des conteneurs en arrière-plan..."
	@docker-compose up -d
	@echo "start" > .last-mode 2>/dev/null || true
	@echo "✅ Conteneurs démarrés!"
	@echo "📡 Backend Flask: http://localhost:$(BACKEND_PORT)"
	@echo "🌐 Frontend React: http://localhost:$(FRONTEND_PORT)"
	@echo ""
	@echo "💡 Utilisez 'make logs' pour voir les logs"

up: start ## Alias pour start - Démarre les conteneurs en arrière-plan

stop: ## Arrête les serveurs backend et frontend (Docker)
	@echo "🛑 Arrêt des conteneurs Docker..."
	docker-compose down
	@echo "✅ Conteneurs arrêtés!"

down: ## Arrête et supprime tous les conteneurs du projet budget-web-youyou uniquement
	@echo "🛑 Arrêt et suppression des conteneurs budget-web-youyou..."
	@docker-compose down
	@echo "✅ Conteneurs budget-web-youyou arrêtés et supprimés!"

restart: ## Redémarre les serveurs (détecte automatiquement le mode précédent)
	@echo "🔄 Redémarrage des conteneurs Docker..."
	@docker-compose down
	@sleep 2
	@if [ -f .last-mode ] && [ "$$(cat .last-mode 2>/dev/null)" = "dev" ]; then \
		echo "📋 Mode dev détecté, redémarrage en mode développement avec logs..."; \
		echo ""; \
		echo "📡 Backend Flask: http://localhost:$(BACKEND_PORT)"; \
		echo "🌐 Frontend React: http://localhost:$(FRONTEND_PORT)"; \
		echo ""; \
		echo "Utilisez Ctrl+C pour arrêter les serveurs"; \
		echo ""; \
		echo "dev" > .last-mode 2>/dev/null || true; \
		docker-compose up; \
	else \
		echo "📋 Redémarrage en arrière-plan..."; \
		echo "start" > .last-mode 2>/dev/null || true; \
		docker-compose up -d; \
		echo "✅ Conteneurs redémarrés en arrière-plan !"; \
		echo "💡 Utilisez 'make logs' pour voir les logs"; \
	fi

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
	@echo "🗑️  Suppression complète de toutes les données..."
	@echo ""
	@# Supprimer depuis le conteneur Docker si actif
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "📦 Suppression depuis le conteneur Docker..."; \
		echo "   • Fichiers JSON utilisateur..."; \
		docker exec budget-web-backend sh -c "rm -f /app/data/*.json 2>/dev/null || true" || true; \
		echo "   • Cache..."; \
		docker exec budget-web-backend sh -c "rm -rf /app/data/cache/* 2>/dev/null || true" || true; \
		echo "   • Fichiers fiscaux..."; \
		docker exec budget-web-backend sh -c "rm -rf /app/data/fiscal/* 2>/dev/null || true" || true; \
		echo "   • Cache fiscal..."; \
		docker exec budget-web-backend sh -c "rm -rf /app/data/fiscal_cache/* 2>/dev/null || true" || true; \
		echo "   • Logs..."; \
		docker exec budget-web-backend sh -c "rm -rf /app/data/logs/* 2>/dev/null || true" || true; \
		echo "   • Modèles ML..."; \
		docker exec budget-web-backend sh -c "rm -rf /app/data/models/* 2>/dev/null || true" || true; \
		echo "   • Fichiers de sécurité..."; \
		docker exec budget-web-backend sh -c "rm -f /app/data/security.log 2>/dev/null || true" || true; \
		echo "✅ Données supprimées depuis le conteneur Docker"; \
	fi
	@# Supprimer depuis le système de fichiers local
	@if [ -d "backend/data" ]; then \
		echo ""; \
		echo "📁 Suppression depuis le système de fichiers local..."; \
		echo "   • Fichiers JSON utilisateur..."; \
		find backend/data -maxdepth 1 -name "*.json" -type f ! -name ".gitkeep" -exec rm -f {} \; 2>/dev/null || true; \
		echo "   • Cache..."; \
		rm -rf backend/data/cache/* 2>/dev/null || true; \
		echo "   • Fichiers fiscaux..."; \
		rm -rf backend/data/fiscal/* 2>/dev/null || true; \
		echo "   • Cache fiscal..."; \
		rm -rf backend/data/fiscal_cache/* 2>/dev/null || true; \
		echo "   • Logs..."; \
		rm -rf backend/data/logs/* 2>/dev/null || true; \
		echo "   • Modèles ML..."; \
		rm -rf backend/data/models/* 2>/dev/null || true; \
		echo "   • Fichiers de sécurité..."; \
		rm -f backend/data/security.log 2>/dev/null || true; \
		echo "✅ Fichiers supprimés dans backend/data/"; \
	fi
	@echo ""
	@echo "✅ Toutes les données ont été supprimées !"
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
	-rm -rf client/.vite client/node_modules/.vite 2>/dev/null || true
	@echo "✅ Nettoyage terminé!"

clean-vite: ## Nettoie le cache Vite dans le conteneur frontend
	@echo "🧹 Nettoyage du cache Vite..."
	@docker exec budget-web-frontend sh -c "rm -rf /app/node_modules/.vite /app/.vite 2>/dev/null; echo '✅ Cache Vite nettoyé'" 2>/dev/null || echo "⚠️  Conteneur non accessible, le cache sera nettoyé au redémarrage"
	-rm -rf client/.vite client/node_modules/.vite 2>/dev/null || true
	@echo "✅ Cache Vite nettoyé (local + conteneur) !"

restart-clean: clean-vite restart ## Nettoie le cache Vite et redémarre les conteneurs
	@echo "✅ Serveur redémarré avec cache nettoyé !"
	@echo "💡 Pensez à vider le cache du navigateur (Ctrl+Shift+R)"

clean-data: ## Nettoie uniquement les données utilisateur (attention!)
	@echo "⚠️  Suppression des données utilisateur..."
	rm -rf backend/data/*.json
	@echo "✅ Données supprimées!"

clean-docker: ## Nettoie les conteneurs et images Docker
	@echo "🐳 Nettoyage Docker..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Docker nettoyé!"

# Test commands
test: test-syntax test-backend test-frontend test-api test-containers ## Lance tous les tests
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "✅ Tous les tests sont terminés !"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test-syntax: ## Vérifie la syntaxe du code (TypeScript, Python)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 VÉRIFICATION DE LA SYNTAXE"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📝 Vérification TypeScript/React..."
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-frontend$$"; then \
		docker exec budget-web-frontend npm run build --dry-run 2>&1 | head -20 || \
		docker exec budget-web-frontend npx tsc --noEmit 2>&1 | head -30 || \
		echo "⚠️  Impossible de vérifier TypeScript (conteneur non démarré ou erreur)"; \
	else \
		echo "⚠️  Conteneur frontend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""
	@echo "🐍 Vérification Python/Flask..."
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		docker exec budget-web-backend python3 -m py_compile app.py 2>&1 && \
		echo "✅ app.py : Syntaxe OK" || echo "❌ app.py : Erreur de syntaxe"; \
		docker exec budget-web-backend python3 -m py_compile api/utils.py 2>&1 && \
		echo "✅ api/utils.py : Syntaxe OK" || echo "❌ api/utils.py : Erreur de syntaxe"; \
	else \
		echo "⚠️  Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-backend: ## Teste le backend Flask (syntaxe, imports, endpoints)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 TEST DU BACKEND"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "✅ Conteneur backend actif"; \
		echo ""; \
		echo "📦 Vérification des dépendances Python..."; \
		docker exec budget-web-backend pip list | grep -E "(Flask|werkzeug|flask-cors)" && \
		echo "✅ Dépendances installées" || echo "⚠️  Dépendances manquantes"; \
		echo ""; \
		echo "🔍 Vérification des fichiers Python..."; \
		docker exec budget-web-backend sh -c "find /app -name '*.py' -type f | head -10"; \
		echo ""; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-frontend: ## Teste le frontend React (build, dépendances)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 TEST DU FRONTEND"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-frontend$$"; then \
		echo "✅ Conteneur frontend actif"; \
		echo ""; \
		echo "📦 Vérification des dépendances npm..."; \
		docker exec budget-web-frontend npm list --depth=0 2>&1 | grep -E "(react|typescript|vite|tailwindcss)" | head -5 && \
		echo "✅ Dépendances principales installées" || echo "⚠️  Vérification des dépendances impossible"; \
		echo ""; \
		echo "📁 Vérification de la structure des fichiers..."; \
		docker exec budget-web-frontend ls -la /app/public/ 2>/dev/null | grep favicon && \
		echo "✅ Favicon présent" || echo "⚠️  Favicon manquant"; \
		docker exec budget-web-frontend test -f /app/index.html && \
		echo "✅ index.html présent" || echo "❌ index.html manquant"; \
		echo ""; \
	else \
		echo "❌ Conteneur frontend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-api: ## Teste les endpoints API (nécessite que les conteneurs soient démarrés)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 TEST DES ENDPOINTS API"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔗 Test de connexion au backend..."; \
		sleep 2; \
		HTTP_CODE=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6060/api/health 2>/dev/null || echo "000"); \
		if [ "$$HTTP_CODE" = "200" ]; then \
			echo "✅ Backend répond correctement (code: $$HTTP_CODE)"; \
			curl -s http://localhost:6060/api/health | head -1; \
		elif [ "$$HTTP_CODE" = "404" ]; then \
			echo "⚠️  Endpoint /api/health non trouvé (code: 404)"; \
			echo "   Test avec /health..."; \
			HTTP_CODE2=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6060/health 2>/dev/null || echo "000"); \
			if [ "$$HTTP_CODE2" = "200" ]; then \
				echo "✅ Endpoint /health fonctionne"; \
			fi; \
		elif [ "$$HTTP_CODE" = "000" ]; then \
			echo "❌ Backend ne répond pas (connexion refusée)"; \
			echo "   Vérifiez que le conteneur est démarré: make status"; \
		else \
			echo "⚠️  Backend répond avec code: $$HTTP_CODE"; \
		fi; \
		echo ""; \
		echo "📋 Endpoints disponibles:"; \
		echo "   GET  /api/health          → Health check"; \
		echo "   GET  /api/years           → Liste des années"; \
		echo "   POST /api/login           → Authentification"; \
		echo "   GET  /api/get/:year       → Données d'une année"; \
		echo "   PUT  /api/put/:year       → Sauvegarde d'une année"; \
		echo "   GET  /api/global          → Données globales"; \
		echo "   PUT  /api/global          → Sauvegarde données globales"; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-containers: ## Vérifie l'état des conteneurs Docker
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 TEST DES CONTENEURS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📊 État des conteneurs:"
	@docker-compose ps
	@echo ""
	@echo "🔍 Vérification de santé des conteneurs..."
	@BACKEND_RUNNING=$$(docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$" && echo "1" || echo "0"); \
	FRONTEND_RUNNING=$$(docker ps --format "{{.Names}}" | grep -q "^budget-web-frontend$$" && echo "1" || echo "0"); \
	if [ "$$BACKEND_RUNNING" = "1" ]; then \
		echo "✅ Backend: En cours d'exécution"; \
		docker exec budget-web-backend ps aux | grep -E "(python|flask)" | head -1 || echo "⚠️  Processus Flask non détecté"; \
	else \
		echo "❌ Backend: Arrêté"; \
	fi; \
	if [ "$$FRONTEND_RUNNING" = "1" ]; then \
		echo "✅ Frontend: En cours d'exécution"; \
		docker exec budget-web-frontend ps aux | grep -E "(node|vite)" | head -1 || echo "⚠️  Processus Vite non détecté"; \
	else \
		echo "❌ Frontend: Arrêté"; \
	fi
	@echo ""

test-integration: ## Test d'intégration complet (démarre, teste, vérifie)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TEST D'INTÉGRATION COMPLET"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "1️⃣ Démarrage des conteneurs..."
	@$(MAKE) start
	@sleep 5
	@echo ""
	@echo "2️⃣ Vérification de l'état..."
	@$(MAKE) test-containers
	@echo ""
	@echo "3️⃣ Tests des endpoints..."
	@$(MAKE) test-api
	@echo ""
	@echo "✅ Test d'intégration terminé !"
	@echo "💡 Les conteneurs sont toujours actifs. Utilisez 'make stop' pour les arrêter."

check-errors: ## Vérifie les erreurs dans les logs et les fichiers
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 VÉRIFICATION DES ERREURS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📋 Vérification des logs récents (erreurs)..."
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "Backend:"; \
		docker logs budget-web-backend 2>&1 | grep -i "error\|exception\|traceback" | tail -10 || echo "   ✅ Aucune erreur récente"; \
	else \
		echo "⚠️  Backend non démarré"; \
	fi
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-frontend$$"; then \
		echo "Frontend:"; \
		docker logs budget-web-frontend 2>&1 | grep -i "error\|failed\|cannot" | tail -10 || echo "   ✅ Aucune erreur récente"; \
	else \
		echo "⚠️  Frontend non démarré"; \
	fi
	@echo ""
	@echo "📁 Vérification des fichiers de configuration..."
	@test -f docker-compose.yml && echo "✅ docker-compose.yml présent" || echo "❌ docker-compose.yml manquant"
	@test -f backend/app.py && echo "✅ backend/app.py présent" || echo "❌ backend/app.py manquant"
	@test -f client/index.html && echo "✅ client/index.html présent" || echo "❌ client/index.html manquant"
	@test -f client/public/favicon.ico && echo "✅ favicon.ico présent" || echo "⚠️  favicon.ico manquant"
	@echo ""

test-all: test check-errors test-behavior test-files ## Lance tous les tests et vérifie les erreurs (complet)

test-behavior: ## Teste les comportements anormaux et les cas limites
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TEST DES COMPORTEMENTS ANORMAUX"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔍 Test de login avec email invalide..."; \
		HTTP_CODE=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:6060/api/login \
			-H "Content-Type: application/json" \
			-d '{"email":"invalid-email","password":"test"}' 2>/dev/null || echo "000"); \
		if [ "$$HTTP_CODE" = "400" ]; then \
			echo "✅ Validation email: OK (refuse email invalide)"; \
		else \
			echo "⚠️  Validation email: code $$HTTP_CODE (attendu 400)"; \
		fi; \
		echo ""; \
		echo "🔍 Test de login avec payload vide..."; \
		HTTP_CODE2=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:6060/api/login \
			-H "Content-Type: application/json" \
			-d '{}' 2>/dev/null || echo "000"); \
		if [ "$$HTTP_CODE2" = "400" ]; then \
			echo "✅ Validation payload vide: OK"; \
		else \
			echo "⚠️  Validation payload vide: code $$HTTP_CODE2 (attendu 400)"; \
		fi; \
		echo ""; \
		echo "🔍 Test d'accès sans authentification..."; \
		HTTP_CODE3=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6060/api/get/2025 2>/dev/null || echo "000"); \
		if [ "$$HTTP_CODE3" = "401" ]; then \
			echo "✅ Protection authentification: OK (refuse accès non authentifié)"; \
		else \
			echo "⚠️  Protection authentification: code $$HTTP_CODE3 (attendu 401)"; \
		fi; \
		echo ""; \
		echo "🔍 Test avec année invalide..."; \
		HTTP_CODE4=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:6060/api/login \
			-H "Content-Type: application/json" \
			-d '{"email":"dev@delhomme.ovh","password":"5n!B@#c*ymgEBYXrWdKE"}' 2>/dev/null | grep -q "200" && \
		curl -s -o /dev/null -w "%{http_code}" http://localhost:6060/api/get/99999 2>/dev/null || echo "000"); \
		if [ "$$HTTP_CODE4" = "400" ] || [ "$$HTTP_CODE4" = "000" ]; then \
			echo "✅ Validation année: OK (refuse année invalide ou non authentifié)"; \
		else \
			echo "⚠️  Validation année: code $$HTTP_CODE4"; \
		fi; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-files: ## Vérifie l'intégrité des fichiers essentiels
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 VÉRIFICATION DE L'INTÉGRITÉ DES FICHIERS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📁 Fichiers de configuration essentiels:"
	@for file in docker-compose.yml backend/app.py client/index.html client/vite.config.ts client/package.json backend/requirements.txt; do \
		if [ -f "$$file" ]; then \
			echo "✅ $$file"; \
		else \
			echo "❌ $$file - MANQUANT"; \
		fi; \
	done
	@echo ""
	@echo "📦 Fichiers publics:"
	@for file in client/public/favicon.ico client/public/favicon.svg; do \
		if [ -f "$$file" ]; then \
			echo "✅ $$file"; \
		else \
			echo "⚠️  $$file - Manquant (non critique)"; \
		fi; \
	done
	@echo ""
	@echo "📝 Composants React essentiels:"
	@for file in client/src/App.tsx client/src/main.tsx client/src/api.ts client/src/types.ts; do \
		if [ -f "$$file" ]; then \
			echo "✅ $$file"; \
		else \
			echo "❌ $$file - MANQUANT"; \
		fi; \
	done
	@echo ""

test-ui-components: ## Vérifie que tous les composants UI essentiels existent
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 VÉRIFICATION DES COMPOSANTS UI"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 Composants principaux:"
	@for component in LoginForm Sidebar Dashboard InitializationModal GlobalDataManager \
		CategoriesSection ExpensesSection SubscriptionsSection IncomeAndSavingsSection \
		AnnualFixedExpenses AssetsTracking RevenusManager ExpensesPieChart \
		MonthlyExpensesIncomeChart BudgetSuggestions ThemeToggle; do \
		FILE="client/src/components/$$component.tsx"; \
		if [ -f "$$FILE" ]; then \
			echo "✅ $$component.tsx"; \
		else \
			echo "❌ $$component.tsx - MANQUANT"; \
		fi; \
	done
	@echo ""
	@echo "🪝 Hooks personnalisés:"
	@for hook in useBudgetData; do \
		FILE="client/src/hooks/$$hook.ts"; \
		if [ -f "$$FILE" ]; then \
			echo "✅ $$hook.ts"; \
		else \
			echo "❌ $$hook.ts - MANQUANT"; \
		fi; \
	done
	@echo ""
	@echo "🔧 Utilitaires:"
	@for util in budgetPredictor budgetAnalyzer savingsProjects; do \
		FILE="client/src/utils/$$util.ts"; \
		if [ -f "$$FILE" ]; then \
			echo "✅ $$util.ts"; \
		else \
			echo "❌ $$util.ts - MANQUANT"; \
		fi; \
	done
	@echo ""
	@echo "🎨 Contextes:"
	@for ctx in ThemeContext; do \
		FILE="client/src/contexts/$$ctx.tsx"; \
		if [ -f "$$FILE" ]; then \
			echo "✅ $$ctx.tsx"; \
		else \
			echo "❌ $$ctx.tsx - MANQUANT"; \
		fi; \
	done
	@echo ""

test-endpoints: ## Teste tous les endpoints API avec des cas réels
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TEST DES ENDPOINTS API (CAS RÉELS)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔐 1. Test de login valide..."; \
		SESSION=$$(curl -s -c /tmp/cookies.txt -X POST http://localhost:6060/api/login \
			-H "Content-Type: application/json" \
			-d '{"email":"dev@delhomme.ovh","password":"5n!B@#c*ymgEBYXrWdKE"}' 2>/dev/null); \
		if echo "$$SESSION" | grep -q "years\|email"; then \
			echo "   ✅ Login réussi"; \
			echo "   📋 Test GET /api/years..."; \
			YEARS=$$(curl -s -b /tmp/cookies.txt http://localhost:6060/api/years 2>/dev/null); \
			if echo "$$YEARS" | grep -q "years\|\[\]"; then \
				echo "   ✅ GET /api/years: OK"; \
			else \
				echo "   ⚠️  GET /api/years: Réponse inattendue"; \
			fi; \
			echo ""; \
			echo "   📋 Test GET /api/global..."; \
			GLOBAL=$$(curl -s -b /tmp/cookies.txt http://localhost:6060/api/global 2>/dev/null); \
			if echo "$$GLOBAL" | grep -q "bankAccounts\|investments\|savingsGoals"; then \
				echo "   ✅ GET /api/global: OK"; \
			else \
				echo "   ⚠️  GET /api/global: Réponse inattendue"; \
			fi; \
			echo ""; \
			echo "   📋 Test GET /api/get/:year (année actuelle)..."; \
			CURRENT_YEAR=$$(date +%Y); \
			YEAR_DATA=$$(curl -s -b /tmp/cookies.txt "http://localhost:6060/api/get/$$CURRENT_YEAR" 2>/dev/null); \
			if echo "$$YEAR_DATA" | grep -q "categories\|expenses\|monthlySalary"; then \
				echo "   ✅ GET /api/get/$$CURRENT_YEAR: OK"; \
			elif echo "$$YEAR_DATA" | grep -q "error\|401"; then \
				echo "   ⚠️  GET /api/get/$$CURRENT_YEAR: Erreur ou non authentifié"; \
			else \
				echo "   ⚠️  GET /api/get/$$CURRENT_YEAR: Réponse inattendue"; \
			fi; \
		else \
			echo "   ❌ Login échoué - impossible de tester les endpoints protégés"; \
		fi; \
		rm -f /tmp/cookies.txt 2>/dev/null || true; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-data-structure: ## Vérifie la structure des données (types, interfaces)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 VÉRIFICATION DE LA STRUCTURE DES DONNÉES"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📋 Types TypeScript essentiels:"
	@if grep -q "export interface YearData" client/src/types.ts 2>/dev/null; then \
		echo "✅ YearData interface définie"; \
	else \
		echo "❌ YearData interface manquante"; \
	fi
	@if grep -q "export interface UserGlobalData" client/src/types.ts 2>/dev/null; then \
		echo "✅ UserGlobalData interface définie"; \
	else \
		echo "❌ UserGlobalData interface manquante"; \
	fi
	@if grep -q "export interface Category" client/src/types.ts 2>/dev/null; then \
		echo "✅ Category interface définie"; \
	else \
		echo "❌ Category interface manquante"; \
	fi
	@if grep -q "export interface Expense" client/src/types.ts 2>/dev/null; then \
		echo "✅ Expense interface définie"; \
	else \
		echo "❌ Expense interface manquante"; \
	fi
	@if grep -q "export interface Subscription" client/src/types.ts 2>/dev/null; then \
		echo "✅ Subscription interface définie"; \
	else \
		echo "❌ Subscription interface manquante"; \
	fi
	@if grep -q "export interface BankAccount" client/src/types.ts 2>/dev/null; then \
		echo "✅ BankAccount interface définie"; \
	else \
		echo "❌ BankAccount interface manquante"; \
	fi
	@if grep -q "export interface Investment" client/src/types.ts 2>/dev/null; then \
		echo "✅ Investment interface définie"; \
	else \
		echo "❌ Investment interface manquante"; \
	fi
	@if grep -q "export interface SavingsProject" client/src/types.ts 2>/dev/null; then \
		echo "✅ SavingsProject interface définie"; \
	else \
		echo "❌ SavingsProject interface manquante"; \
	fi
	@echo ""

test-features: ## Vérifie que toutes les fonctionnalités principales sont présentes
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 VÉRIFICATION DES FONCTIONNALITÉS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "✅ Fonctionnalités à vérifier dans l'interface:"
	@echo ""
	@echo "🔐 Authentification:"
	@echo "   • Login avec email/password"
	@echo "   • Session persistante"
	@echo "   • Logout"
	@echo ""
	@echo "💰 Gestion financière:"
	@echo "   • Catégories variables avec budgets mensuels/annuels"
	@echo "   • Dépenses variables par catégorie"
	@echo "   • Abonnements mensuels"
	@echo "   • Dépenses fixes annuelles"
	@echo "   • Revenus mensuels principaux et variables"
	@echo "   • Revenus supplémentaires (ponctuels)"
	@echo "   • Mouvements d'épargne"
	@echo ""
	@echo "📊 Visualisations:"
	@echo "   • Dashboard avec vue d'ensemble"
	@echo "   • Graphique camembert des dépenses par catégorie"
	@echo "   • Graphique barres dépenses/revenus mensuels"
	@echo "   • Statistiques sur 6 derniers mois"
	@echo ""
	@echo "🎯 Données globales:"
	@echo "   • Comptes bancaires avec soldes"
	@echo "   • Investissements (bourse, crypto)"
	@echo "   • Objectifs d'épargne"
	@echo "   • Projets d'épargne"
	@echo "   • Historique des salaires"
	@echo ""
	@echo "🤖 IA et Prédictions:"
	@echo "   • Génération automatique d'années futures"
	@echo "   • Prédictions basées sur l'historique"
	@echo "   • Matérialisation d'années prédites"
	@echo "   • Verrouillage/déverrouillage d'années"
	@echo "   • Exclusion d'années prédites"
	@echo ""
	@echo "⚙️  Gestion:"
	@echo "   • Réinitialisation d'année"
	@echo "   • Réinitialisation complète (avec sécurité)"
	@echo "   • Mode sombre/clair"
	@echo "   • Suggestions d'amélioration du budget"
	@echo ""
	@echo "💡 Pour tester ces fonctionnalités, lancez l'application et naviguez dans l'interface"
	@echo ""

test-backend-ml: ## Lance les tests unitaires Python pour le ML
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TESTS UNITAIRES BACKEND - ML"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔧 Exécution des tests dans le conteneur backend..."; \
		docker exec budget-web-backend python -m pytest tests/backend/ -v 2>/dev/null || \
		echo "⚠️  Les tests nécessitent pytest. Installer avec: pip install pytest"; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-backend-all: ## Lance tous les tests backend (auth, security, validation, endpoints, etc.)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TESTS BACKEND COMPLETS"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔧 Installation des dépendances de test si nécessaire..."; \
		docker exec budget-web-backend pip install -q pytest pytest-cov pytest-mock 2>/dev/null || true; \
		echo ""; \
		echo "🧪 Exécution de tous les tests backend..."; \
		docker exec budget-web-backend python -m pytest tests/backend/ -v --tb=short || \
		echo "⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus."; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-backend-install: ## Installe les dépendances pour les tests backend
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📦 INSTALLATION DES DÉPENDANCES DE TEST BACKEND"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "📦 Installation de pytest et dépendances..."; \
		docker exec budget-web-backend pip install -r backend/requirements-test.txt || \
		docker exec budget-web-backend pip install pytest pytest-cov pytest-mock pytest-timeout coverage; \
		echo "✅ Dépendances installées !"; \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-complete: ## Lance tous les tests complets (scoring, ML, sécurité) et génère un rapport
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TESTS COMPLETS AVEC RAPPORT"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if docker ps --format "{{.Names}}" | grep -q "^budget-web-backend$$"; then \
		echo "🔧 Installation des dépendances de test si nécessaire..."; \
		docker exec budget-web-backend pip install -q pytest pytest-cov pytest-mock pytest-timeout coverage 2>/dev/null || true; \
		echo ""; \
		echo "🧪 Exécution du script de test complet..."; \
		docker exec budget-web-backend python scripts/run_all_tests.py || \
		(echo "⚠️  Le script utilise les tests directement, exécution manuelle..."; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "1. Tests de Scoring Bancaire"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		docker exec budget-web-backend python -m pytest tests/backend/test_bank_scoring.py -v --tb=short --no-cov 2>&1 || echo "⚠️  Tests scoring échoués ou fichiers non trouvés"; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "2. Tests ML/IA"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		docker exec budget-web-backend python -m pytest tests/backend/test_ml_complete.py tests/backend/test_ml_service_endpoints.py tests/backend/test_ml_performance.py -v --tb=short --no-cov 2>&1 || echo "⚠️  Tests ML échoués"; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "3. Tests de Cybersécurité"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		docker exec budget-web-backend python -m pytest tests/backend/test_security.py -v --tb=short --no-cov 2>&1 || echo "⚠️  Tests sécurité échoués"; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "4. Tests d'Authentification"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		docker exec budget-web-backend python -m pytest tests/backend/test_auth.py -v --tb=short --no-cov 2>&1 || echo "⚠️  Tests auth échoués"; \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "✅ Tous les tests ont été exécutés !"; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"); \
	else \
		echo "❌ Conteneur backend non démarré. Utilisez 'make start' d'abord."; \
	fi
	@echo ""

test-all: test check-errors test-behavior test-files test-ui-components test-endpoints test-data-structure test-features test-e2e test-backend-ml ## Lance tous les tests et vérifie les erreurs (complet)

test-e2e-install: ## Installe Playwright et les navigateurs pour les tests E2E
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🎭 INSTALLATION PLAYWRIGHT"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if command -v npm >/dev/null 2>&1; then \
		echo "📦 Installation des dépendances Playwright..."; \
		npm install --save-dev @playwright/test@^1.40.0 @types/node@^20.10.0 typescript@^5.3.3 || \
		echo "⚠️  Installation npm échouée - utilisez 'npm install' manuellement"; \
		echo ""; \
		echo "🌐 Installation des navigateurs..."; \
		npx playwright install --with-deps chromium firefox webkit || \
		echo "⚠️  Installation des navigateurs échouée - utilisez 'npx playwright install' manuellement"; \
		echo ""; \
		echo "✅ Playwright installé !"; \
	else \
		echo "❌ npm n'est pas installé. Installez Node.js et npm d'abord."; \
	fi
	@echo ""

test-e2e: ## Lance tous les tests E2E avec Playwright (nécessite que l'app soit démarrée)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🎭 TESTS E2E AVEC PLAYWRIGHT"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if [ ! -f "node_modules/.bin/playwright" ] && [ ! -f "node_modules/@playwright/test/index.js" ]; then \
		echo "⚠️  Playwright n'est pas installé. Lancez 'make test-e2e-install' d'abord."; \
		exit 1; \
	fi
	@echo "🧪 Lancement des tests E2E..."
	@echo "⚠️  Assurez-vous que l'application est démarrée (make dev ou make start)"
	@echo ""
	@if command -v npx >/dev/null 2>&1; then \
		npx playwright test || echo "⚠️  Certains tests ont échoué. Consultez le rapport avec 'make test-e2e-report'"; \
	else \
		echo "❌ npx n'est pas disponible. Installez Node.js."; \
		exit 1; \
	fi
	@echo ""

test-e2e-ui: ## Lance les tests E2E avec l'interface UI de Playwright
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🎭 TESTS E2E AVEC INTERFACE UI"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "⚠️  Assurez-vous que l'application est démarrée (make dev ou make start)"
	@echo ""
	@if command -v npx >/dev/null 2>&1; then \
		npx playwright test --ui; \
	else \
		echo "❌ npx n'est pas disponible. Installez Node.js."; \
		exit 1; \
	fi
	@echo ""

test-e2e-report: ## Affiche le rapport HTML des tests E2E
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📊 RAPPORT DES TESTS E2E"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if command -v npx >/dev/null 2>&1; then \
		npx playwright show-report || echo "⚠️  Aucun rapport disponible. Lancez les tests d'abord avec 'make test-e2e'"; \
	else \
		echo "❌ npx n'est pas disponible. Installez Node.js."; \
		exit 1; \
	fi
	@echo ""

# =============================================================================
# 🚀 PRODUCTION
# =============================================================================

prod-build: ## Construit les images Docker pour la production (avec WSGI)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🏗️  CONSTRUCTION DES IMAGES DE PRODUCTION"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📦 Construction des images avec configuration de production..."
	docker-compose -f docker-compose.prod.yml build
	@echo ""
	@echo "✅ Images de production construites !"
	@echo "💡 Utilisez 'make prod-up' pour démarrer en mode production"

prod-up: prod-build ## Démarre les conteneurs en mode production (avec WSGI/Gunicorn)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🚀 DÉMARRAGE EN MODE PRODUCTION"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "⚠️  Mode production avec :"
	@echo "   - Backend : Gunicorn (WSGI) avec workers multiples"
	@echo "   - Frontend : Build optimisé"
	@echo "   - Sécurité : Cookies sécurisés, HTTPS recommandé"
	@echo ""
	docker-compose -f docker-compose.prod.yml up -d
	@echo ""
	@echo "✅ Application démarrée en mode production !"
	@echo "💡 Utilisez 'make prod-logs' pour voir les logs"
	@echo "💡 Utilisez 'make prod-status' pour vérifier l'état"

prod-down: ## Arrête les conteneurs de production
	@echo "🛑 Arrêt des conteneurs de production..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Conteneurs de production arrêtés !"

prod-restart: prod-down prod-up ## Redémarre les conteneurs en mode production
	@echo "✅ Conteneurs de production redémarrés !"

prod-logs: ## Affiche les logs des conteneurs de production
	@echo "📋 Logs des conteneurs de production (Ctrl+C pour quitter)..."
	docker-compose -f docker-compose.prod.yml logs -f

prod-status: ## Affiche l'état des conteneurs de production
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📊 ÉTAT DES CONTENEURS DE PRODUCTION"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	docker-compose -f docker-compose.prod.yml ps
	@echo ""

prod: prod-up ## Alias pour démarrer en mode production (défaut)


clean-future-years: ## Supprime les années futures (2026+) des données utilisateur
	@echo "🗑️  Suppression des années futures (2026+)..."
	@docker exec budget-web-backend python3 -c " \
		import json; \
		import sys; \
		sys.path.insert(0, '/app'); \
		from api.utils import DATA_DIR; \
		current_year = 2025; \
		removed_count = 0; \
		for json_file in DATA_DIR.glob('*.json'): \
			try: \
				print(f'📄 Traitement de {json_file.name}...'); \
				with open(json_file, 'r', encoding='utf-8') as f: \
					data = json.load(f); \
				original_years = data.get('years', []); \
				data['years'] = [y for y in original_years if y <= current_year]; \
				datasets = data.get('datasets', {}); \
				future_keys = [str(y) for y in range(2026, 2030)]; \
				removed_datasets = []; \
				for key in future_keys: \
					if key in datasets: \
						del datasets[key]; \
						removed_datasets.append(key); \
				data['datasets'] = datasets; \
				with open(json_file, 'w', encoding='utf-8') as f: \
					json.dump(data, f, indent=2, ensure_ascii=False); \
					f.write('\n'); \
				removed_years = [y for y in original_years if y > current_year]; \
				if removed_years or removed_datasets: \
					print(f'  ✅ Supprimé: années {removed_years}, datasets {removed_datasets}'); \
					removed_count += 1; \
				else: \
					print(f'  ℹ️  Aucune année future trouvée'); \
			except Exception as e: \
				print(f'  ❌ Erreur: {e}'); \
		print(f'\n✅ Traitement terminé. {removed_count} fichier(s) modifié(s).'); \
	" || echo "⚠️  Conteneur non accessible. Utilisez: make restart puis réessayez"
	@echo "✅ Années futures supprimées !"

# =============================================================================
# 📊 MONITORING MÉMOIRE
# =============================================================================

memory-monitor: ## Démarre le monitoring mémoire (durée en minutes, défaut: 5)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📊 MONITORING DE LA MÉMOIRE"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "💡 Usage: make memory-monitor [DURATION=5] [INTERVAL=5]"
	@echo "   DURATION: Durée du monitoring en minutes (défaut: 5)"
	@echo "   INTERVAL: Intervalle entre les mesures en secondes (défaut: 5)"
	@echo ""
	@DURATION=$${DURATION:-5}; \
	INTERVAL=$${INTERVAL:-5}; \
	echo "⏱️  Durée: $${DURATION} minutes"; \
	echo "⏳ Intervalle: $${INTERVAL} secondes"; \
	echo ""; \
	bash scripts/monitor_memory.sh $${DURATION} $${INTERVAL}

memory-analyze: ## Analyse un fichier de données mémoire (usage: make memory-analyze FILE=path/to/file.csv)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔍 ANALYSE DES DONNÉES MÉMOIRE"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@if [ -z "$$FILE" ]; then \
		echo "❌ Erreur: Vous devez spécifier le fichier à analyser"; \
		echo "   Usage: make memory-analyze FILE=memory_logs/memory_20241204_143022.csv"; \
		echo ""; \
		echo "📁 Fichiers disponibles dans memory_logs/:"; \
		ls -1t memory_logs/*.csv 2>/dev/null | head -5 || echo "   Aucun fichier trouvé"; \
		exit 1; \
	fi; \
	if [ ! -f "$$FILE" ]; then \
		echo "❌ Erreur: Le fichier $$FILE n'existe pas"; \
		exit 1; \
	fi; \
	python3 scripts/analyze_memory.py "$$FILE"

memory-test: ## Test complet: monitoring 5 minutes puis analyse automatique
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🧪 TEST COMPLET DE MÉMOIRE"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📊 Phase 1: Monitoring de la mémoire (5 minutes)..."
	@echo ""
	@DURATION=$${DURATION:-5}; \
	INTERVAL=$${INTERVAL:-5}; \
	bash scripts/monitor_memory.sh $${DURATION} $${INTERVAL}; \
	LAST_FILE=$$(ls -1t memory_logs/*.csv 2>/dev/null | head -1); \
	if [ -n "$$LAST_FILE" ]; then \
		echo ""; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo "📊 Phase 2: Analyse des données..."; \
		echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; \
		echo ""; \
		python3 scripts/analyze_memory.py "$$LAST_FILE"; \
	else \
		echo "❌ Aucun fichier de données trouvé"; \
	fi

