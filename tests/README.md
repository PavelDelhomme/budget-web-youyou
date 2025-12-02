# Tests E2E avec Playwright

## 📋 Vue d'ensemble

Cette suite de tests E2E utilise Playwright pour tester toutes les fonctionnalités de l'application Budget Web, simulant une utilisation complète d'un utilisateur lambda.

## 🚀 Installation

### 1. Installer Playwright et les navigateurs

```bash
make test-e2e-install
```

Ou manuellement :

```bash
npm install --save-dev @playwright/test @types/node typescript
npx playwright install --with-deps chromium firefox webkit
```

## 🧪 Lancement des tests

### Tous les tests

```bash
# Assurez-vous que l'application est démarrée
make dev
# Ou dans un autre terminal
make start

# Lancez les tests
make test-e2e
```

### Avec interface UI

```bash
make test-e2e-ui
```

### Tests spécifiques

```bash
# Tests d'authentification uniquement
npx playwright test tests/e2e/01-authentication.spec.ts

# Tests de partage par parts
npx playwright test tests/e2e/03-expenses-sharing.spec.ts

# Parcours utilisateur complet
npx playwright test tests/e2e/07-complete-user-flow.spec.ts
```

## 📊 Consulter les rapports

```bash
make test-e2e-report
```

Le rapport HTML s'ouvrira automatiquement dans votre navigateur.

## 📁 Structure des tests

```
tests/e2e/
├── 01-authentication.spec.ts              # Tests d'authentification
├── 02-advanced-signup.spec.ts             # Tests d'inscription avancée
├── 03-expenses-sharing.spec.ts            # Tests des dépenses avec partage
├── 04-annual-fixed-expenses-sharing.spec.ts # Tests dépenses fixes avec partage
├── 05-subscriptions-sharing.spec.ts       # Tests abonnements avec partage
├── 06-dashboard.spec.ts                   # Tests du Dashboard
├── 07-complete-user-flow.spec.ts          # Parcours utilisateur complet
├── 08-error-handling.spec.ts              # Gestion des erreurs
├── 09-edge-cases.spec.ts                  # Cas limites et comportements imprévus
├── 10-responsive.spec.ts                  # Tests responsive
├── 11-categories.spec.ts                  # Tests de gestion des catégories
├── 12-income-savings.spec.ts              # Tests revenus et épargne
├── 13-ml-ai.spec.ts                       # Tests fonctionnalités IA/ML
├── 14-tax-manager.spec.ts                 # Tests gestionnaire fiscal
├── fixtures/
│   └── auth.ts                            # Fixtures d'authentification
└── helpers/
    └── test-helpers.ts                    # Helpers pour les tests
```

## ✅ Fonctionnalités testées

### Authentification
- ✅ Affichage du formulaire de connexion
- ✅ Connexion avec identifiants valides
- ✅ Gestion des erreurs (email/password invalides)
- ✅ Toggle de visibilité du mot de passe
- ✅ Mode inscription
- ✅ Déconnexion

### Gestion du budget
- ✅ Ajout/modification/suppression de dépenses variables
- ✅ Ajout/modification/suppression de dépenses fixes annuelles
- ✅ Ajout/modification/suppression d'abonnements
- ✅ Gestion des catégories

### Partage par parts
- ✅ Dépenses avec partage (ex: 1/2 du loyer)
- ✅ Dépenses fixes annuelles avec partage
- ✅ Abonnements avec partage
- ✅ Calcul automatique du montant réellement payé
- ✅ Affichage des informations de partage

### Dashboard
- ✅ Affichage par défaut
- ✅ Cartes de résumé
- ✅ Graphiques (camembert, mensuel)
- ✅ Objectifs d'épargne sans débordement

### Fonctionnalités avancées
- ✅ Revenus multiples (intérim, plusieurs emplois)
- ✅ Interface d'entraînement IA
- ✅ Gestionnaire fiscal
- ✅ Responsive design

### Gestion des erreurs
- ✅ Erreurs réseau
- ✅ Erreurs 401/404/403
- ✅ Entrées invalides
- ✅ État vide

### Cas limites
- ✅ Montants très grands
- ✅ Montants négatifs
- ✅ Partage avec 0 parts
- ✅ Partage avec plus de parts que le total
- ✅ Clics rapides multiples
- ✅ Navigation navigateur (back/forward)

### Responsive
- ✅ Mobile (375px)
- ✅ Tablet (768px)
- ✅ Desktop
- ✅ Changement d'orientation

## 🎯 Parcours utilisateur complet

Le fichier `07-complete-user-flow.spec.ts` simule un parcours utilisateur complet :

1. Connexion
2. Consultation du Dashboard
3. Navigation vers une année
4. Ajout d'une dépense fixe annuelle avec partage (loyer)
5. Ajout d'une dépense variable
6. Ajout d'un abonnement avec partage
7. Retour au Dashboard
8. Vérification des données mises à jour

## 🔧 Configuration

La configuration Playwright se trouve dans `playwright.config.ts` :

- **Base URL** : `http://localhost:6061`
- **Timeout** : 60 secondes par test
- **Retry** : 2 fois en CI, 0 en local
- **Workers** : 1 en CI, parallèle en local
- **Navigateurs** : Chromium, Firefox, WebKit + Mobile

## 📝 Notes importantes

1. **L'application doit être démarrée** avant de lancer les tests
2. **Les identifiants de test** sont définis dans `tests/e2e/helpers/test-helpers.ts`
3. **Les tests sont idempotents** : ils peuvent être relancés plusieurs fois
4. **Les screenshots et vidéos** sont générés en cas d'échec

## 🐛 Débogage

### Mode debug

```bash
npx playwright test --debug
```

### Mode headed (voir le navigateur)

```bash
npx playwright test --headed
```

### Test spécifique en debug

```bash
npx playwright test tests/e2e/01-authentication.spec.ts --debug
```

## 📈 Améliorations futures

- [ ] Tests de performance
- [ ] Tests d'accessibilité (a11y)
- [ ] Tests de charge
- [ ] Tests de sécurité (XSS, CSRF)
- [ ] Tests cross-browser automatiques
- [ ] Intégration CI/CD

