# 🔧 Gestion des Erreurs - Explication

## Erreurs Normales au Démarrage

Lors du redémarrage de l'application, il est **normal** de voir certaines erreurs qui sont automatiquement gérées :

### ✅ Erreurs 401 (Non authentifié)

Ces erreurs apparaissent quand :
- L'utilisateur n'est pas encore connecté
- La session a expiré
- La page vient de charger

**Pourquoi c'est normal ?**
- L'application vérifie automatiquement si l'utilisateur est connecté au démarrage
- Si l'utilisateur n'est pas connecté, les requêtes API retournent une erreur 401
- C'est le comportement attendu - l'application affiche alors la page de login

**Ces erreurs sont automatiquement filtrées** par le système de gestion silencieuse pour ne pas polluer la console.

### ✅ Erreurs GET au Démarrage

Lors du chargement de la page de login, l'application peut essayer de :
- Vérifier la session (`/api/session-check`)
- Charger les années (`/api/years`)
- Charger les données globales (`/api/global`)

Si l'utilisateur n'est pas connecté, ces requêtes retournent 401, ce qui est **normal et attendu**.

## Gestion Automatique

### Système de Filtrage Silencieux

Le fichier `client/src/utils/silentErrorHandler.ts` intercepte automatiquement :
- ✅ Erreurs 401 (utilisateur non authentifié)
- ✅ Erreurs WebSocket (connexion HMR/Vite)
- ✅ Erreurs GET normales au démarrage

Ces erreurs ne sont **pas affichées dans la console** car elles sont normales.

### Code de Gestion

Les erreurs sont marquées comme :
- `silent: true` - Ne pas afficher dans la console
- `expected: true` - Erreur attendue (comme 401 au démarrage)

## Messages Console

Si une erreur réelle survient (pas une erreur normale), elle sera affichée avec un message clair.

## Dépannage

### Si vous voyez des erreurs au démarrage :

1. **Erreur 401** → Normal si vous n'êtes pas connecté
2. **Erreur GET /api/years** → Normal si vous n'êtes pas connecté
3. **Erreur GET /api/global** → Normal si vous n'êtes pas connecté

### Vraies erreurs à surveiller :

- ❌ Erreur 500 (erreur serveur)
- ❌ Erreur réseau (backend non disponible)
- ❌ Erreurs JavaScript (erreurs de code)

## Conclusion

Les erreurs GET au démarrage sont **normales** et **gérées automatiquement**. 
Le système filtre les erreurs attendues pour garder la console propre.

Si vous voyez toujours des erreurs, c'est peut-être une vraie erreur à investiguer.

