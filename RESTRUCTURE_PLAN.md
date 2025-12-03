# Plan de Restructuration des Composants

## Structure proposée :

```
client/src/components/
├── layout/           # Composants de mise en page
│   ├── Sidebar.tsx
│   ├── HamburgerMenu.tsx
│   └── Modal.tsx
├── dashboard/        # Composants du dashboard
│   ├── Dashboard.tsx
│   └── SummaryCard.tsx
├── budget/           # Gestion du budget
│   ├── CategoriesSection.tsx
│   ├── ExpensesSection.tsx
│   ├── SubscriptionsSection.tsx
│   ├── AnnualFixedExpenses.tsx
│   └── IncomeAndSavingsSection.tsx
├── charts/           # Graphiques
│   ├── ExpensesPieChart.tsx
│   └── MonthlyExpensesIncomeChart.tsx
├── income/           # Gestion des revenus
│   ├── AdditionalMonthlyIncomes.tsx
│   ├── VariableMonthlyIncomes.tsx
│   ├── MultipleMonthlyIncomes.tsx
│   └── RevenusManager.tsx
├── savings/          # Gestion de l'épargne
│   ├── AdvancedSavings.tsx
│   └── SharedExpensesManager.tsx
├── fiscal/           # Gestion fiscale
│   ├── TaxManager.tsx
│   └── AdvancedFiscalManager.tsx
├── management/       # Gestion des données
│   ├── GlobalDataManager.tsx (à subdiviser)
│   ├── PayrollSlipManager.tsx
│   └── DataExport.tsx
├── ai/               # Intelligence artificielle
│   ├── MLTrainingInterface.tsx
│   └── BudgetSuggestions.tsx
├── auth/             # Authentification
│   └── LoginForm.tsx
├── forms/            # Formulaires
│   ├── AdvancedSignupForm.tsx
│   ├── AddYearModal.tsx
│   └── InitializationModal.tsx
├── ui/               # Composants UI réutilisables
│   ├── ErrorBoundary.tsx
│   ├── ThemeToggle.tsx
│   ├── ExpenseShareInput.tsx
│   └── GeographicSelector.tsx
└── assets/           # Suivi des actifs
    └── AssetsTracking.tsx
```

## Ordre d'exécution :

1. Créer les sous-dossiers
2. Déplacer les fichiers
3. Mettre à jour les imports dans tous les fichiers
4. Subdiviser les gros fichiers (GlobalDataManager, Dashboard, App.tsx)
