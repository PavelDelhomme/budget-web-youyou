# Système d'Inscription Avancé avec Génération de Budget

## 📋 Vue d'ensemble

Ce document décrit le système d'inscription avancé qui permet de :
1. Collecter des informations détaillées sur le profil utilisateur (CSP, situation personnelle, etc.)
2. Générer automatiquement un budget initial basé sur les statistiques gouvernementales
3. Pré-entraîner l'IA avec des données statistiques avant d'utiliser les données réelles des utilisateurs

## 📁 Fichiers créés

### Backend

1. **`backend/api/statistical_budget_generator.py`**
   - `StatisticalBudgetGenerator` : Génère des budgets basés sur les statistiques CSP
   - `StatisticalTrainingDataGenerator` : Génère des données d'entraînement statistiques
   - Contient les revenus moyens par CSP et distributions de dépenses

2. **`backend/api/statistical_service.py`**
   - Routes API pour générer des budgets statistiques
   - Route pour générer des données d'entraînement

### Frontend

3. **`client/src/components/AdvancedSignupForm.tsx`**
   - Formulaire d'inscription avancé en 6 étapes
   - Collecte : CSP, situation personnelle, revenus, parcours professionnel, logement
   - Génère un budget automatique à la fin

## 🔧 Modifications nécessaires

### 1. Intégration dans App.tsx

Ajouter dans `client/src/App.tsx` :

```typescript
import { AdvancedSignupForm, UserProfile } from './components/AdvancedSignupForm';

// Ajouter un état pour le formulaire avancé
const [isAdvancedSignupOpen, setIsAdvancedSignupOpen] = useState(false);
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [generatedBudget, setGeneratedBudget] = useState<any>(null);

// Dans la fonction onLogin, après le login réussi, vérifier si c'est un nouvel utilisateur
// Si globalData.initializationComplete === false, afficher d'abord AdvancedSignupForm
// Puis après, InitializationModal avec les données générées
```

### 2. Pré-remplissage du budget généré

Lorsque le budget est généré :
- Pré-remplir l'année courante avec les catégories et dépenses
- Utiliser le salaire mensuel généré dans InitializationModal
- Pré-remplir les abonnements et dépenses fixes

### 3. Pré-entraînement de l'IA

Créer un script ou une route admin pour :
1. Générer des données statistiques avec `StatisticalTrainingDataGenerator`
2. Entraîner le modèle ML avec ces données
3. Sauvegarder le modèle pré-entraîné
4. Les utilisateurs bénéficieront d'un modèle déjà entraîné

## 🚀 Utilisation

### Pour l'utilisateur

1. **Inscription** : Remplir le formulaire avancé (CSP, situation, etc.)
2. **Génération** : Le système génère un budget initial basé sur les statistiques
3. **Configuration** : Compléter/ajuster dans InitializationModal
4. **Utilisation** : Le budget est déjà pré-rempli dans l'année courante

### Pour l'administration

1. **Génération des données d'entraînement** :
   ```bash
   POST /api/statistical/generate-training-data
   {
     "num_years": 5
   }
   ```

2. **Entraînement initial du modèle** :
   - Utiliser les données statistiques générées
   - Entraîner le modèle ML
   - Le modèle sera utilisé comme base pour tous les utilisateurs

## 📊 Statistiques utilisées

### Revenus moyens par CSP (net mensuel)
- Cadre supérieur : 5000€
- Cadre : 3800€
- Profession intermédiaire : 2800€
- Employé : 1900€
- Ouvrier : 2100€
- Retraité : 1800€
- Chômeur : 1200€
- Étudiant : 600€
- etc.

### Distribution des dépenses
- Logement : 30%
- Alimentation : 18%
- Transport : 12%
- Loisirs : 8%
- Santé : 5%
- Télécommunications : 3%
- Autres : 24%

## 🔄 Flux d'inscription

```
1. Login/Signup
   ↓
2. AdvancedSignupForm (nouveaux utilisateurs)
   - Collecte profil CSP, situation, etc.
   - Génère budget statistique
   ↓
3. InitializationModal
   - Pré-rempli avec budget généré
   - Configuration complémentaire
   ↓
4. Interface principale
   - Budget de l'année courante pré-rempli
   - Prêt à l'utilisation
```

## 📝 Prochaines étapes

1. ✅ Créer le générateur de budget statistique
2. ✅ Créer le formulaire d'inscription avancé
3. ⏳ Intégrer dans le flux d'inscription (App.tsx)
4. ⏳ Pré-remplissage du budget dans l'année courante
5. ⏳ Système de pré-entraînement de l'IA
6. ⏳ Tests et validation

## 🎯 Avantages

- **Expérience utilisateur** : Budget pré-rempli dès l'inscription
- **Qualité des données** : Basé sur des statistiques réelles
- **IA performante** : Modèle pré-entraîné sur données statistiques
- **Personnalisation** : Budget adapté à la CSP et situation
- **Rapidité** : Utilisateur opérationnel en quelques minutes

