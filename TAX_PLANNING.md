# 📋 Planification : Gestion des Déclarations d'Impôts et Optimisation Fiscale

## Vue d'ensemble

Cette fonctionnalité permettra aux utilisateurs de gérer leurs déclarations d'impôts et de bénéficier de suggestions d'optimisation fiscale automatiques.

## Fonctionnalités à implémenter

### 1. Gestion des Déclarations d'Impôts

#### 1.1 Interface de Déclaration
- **Composant** : `TaxDeclaration.tsx`
- **Fonctionnalités** :
  - Saisie des revenus déclarés par année
  - Calcul automatique des revenus totaux (salaire + revenus supplémentaires + investissements)
  - Saisie des charges déductibles (intérêts d'emprunt, frais réels, etc.)
  - Saisie des réductions d'impôts (dons, investissements éligibles, etc.)
  - Calcul automatique de l'impôt sur le revenu (tranches d'imposition française)
  - Export PDF de la déclaration
  - Historique des déclarations par année

#### 1.2 Calcul Automatique des Impôts
- **Fichier** : `client/src/utils/taxCalculator.ts`
- **Logique** :
  - Application du barème progressif français (2024-2025)
  - Prise en compte du quotient familial
  - Calcul des tranches d'imposition
  - Déduction des charges et réductions
  - Calcul de l'impôt net à payer

### 2. Optimisation Fiscale

#### 2.1 Suggestions Automatiques
- **Composant** : `TaxOptimization.tsx`
- **Suggestions** :
  - Dons à des associations (66% déductibles, plafond 20% du revenu)
  - Investissements dans le locatif (déduction des intérêts d'emprunt)
  - Investissements dans l'immobilier (LMNP, Pinel, etc.)
  - Investissements en PEA, Assurance-vie (plafonds exonérés)
  - Frais réels déductibles (si > 10% des revenus salariaux)
  - Crédits d'impôts éligibles (emploi à domicile, transition énergétique, etc.)

#### 2.2 Simulateur d'Optimisation
- **Fonctionnalités** :
  - Simulation de différents scénarios fiscaux
  - Comparaison avant/après optimisation
  - Estimation des économies d'impôts potentielles
  - Calendrier des échéances fiscales

### 3. Intégration dans l'Application

#### 3.1 Menu de Navigation
- Ajouter un onglet "Impôts" dans la sidebar
- Sous-menu avec :
  - Déclarations
  - Optimisations
  - Calendrier fiscal
  - Historique

#### 3.2 Dashboard
- Widget "Impôts de l'année" affichant :
  - Estimation de l'impôt à payer
  - Economies potentielles identifiées
  - Échéances à venir

#### 3.3 Prévisions
- Intégrer les impôts dans les prévisions budgétaires annuelles
- Ajuster les projections de budget en tenant compte des impôts

## Structure de Données

### TaxDeclaration (nouveau type)
```typescript
interface TaxDeclaration {
  id: string;
  year: number;
  totalIncome: number; // Revenus totaux
  deductibleCharges: DeductibleCharge[]; // Charges déductibles
  taxReductions: TaxReduction[]; // Réductions d'impôts
  taxCredits: TaxCredit[]; // Crédits d'impôts
  calculatedTax: number; // Impôt calculé
  paidTax: number; // Impôt déjà payé (précompte)
  balance: number; // Solde (à payer ou à recevoir)
  filingDate?: string; // Date de déclaration
  status: 'draft' | 'filed' | 'paid';
}

interface DeductibleCharge {
  id: string;
  type: 'loan_interest' | 'professional_expenses' | 'alimony' | 'other';
  description: string;
  amount: number;
  proofDocument?: string; // URL ou référence document
}

interface TaxReduction {
  id: string;
  type: 'charity_donation' | 'investment' | 'home_improvement' | 'other';
  description: string;
  amount: number;
  reductionRate: number; // Pourcentage déductible
  maxAmount?: number; // Plafond éventuel
}

interface TaxCredit {
  id: string;
  type: 'domestic_employee' | 'energy_transition' | 'childcare' | 'other';
  description: string;
  amount: number;
  creditRate: number; // Pourcentage crédit
  maxAmount?: number; // Plafond éventuel
}
```

## Backend

### Nouvelle Route API
- `GET /api/tax/declarations` - Liste des déclarations
- `GET /api/tax/declarations/:year` - Déclaration d'une année
- `PUT /api/tax/declarations/:year` - Créer/modifier une déclaration
- `POST /api/tax/calculate` - Calculer l'impôt pour une année
- `GET /api/tax/suggestions` - Obtenir les suggestions d'optimisation

## Priorités d'Implémentation

### Phase 1 (Fonctionnalités de base)
1. ✅ Créer les types TypeScript pour les déclarations fiscales
2. ✅ Créer le composant `TaxDeclaration.tsx`
3. ✅ Créer le calculateur d'impôts basique (barème progressif)
4. ✅ Intégrer dans la sidebar
5. ✅ Sauvegarde des déclarations dans `globalData`

### Phase 2 (Optimisation)
1. ✅ Créer le composant `TaxOptimization.tsx`
2. ✅ Implémenter les suggestions automatiques
3. ✅ Créer le simulateur d'optimisation
4. ✅ Afficher dans le dashboard

### Phase 3 (Avancé)
1. ✅ Export PDF
2. ✅ Calendrier fiscal
3. ✅ Rappels d'échéances
4. ✅ Intégration avec les prévisions

## Notes Techniques

- Le barème d'imposition français sera mis à jour annuellement
- Les plafonds et taux peuvent être paramétrés dans un fichier de configuration
- Les suggestions seront basées sur les données utilisateur (revenus, investissements, etc.)
- La validation des montants sera importante (plafonds, conditions d'éligibilité)

