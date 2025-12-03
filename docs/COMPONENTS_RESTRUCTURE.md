# Plan de restructuration des composants

## Structure proposée :

```
client/src/components/
├── layout/
│   ├── Sidebar.tsx
│   ├── HamburgerMenu.tsx
│   └── Modal.tsx
├── dashboard/
│   ├── Dashboard.tsx
│   ├── SummaryCard.tsx
│   └── ExpensesPieChart.tsx
├── budget/
│   ├── CategoriesSection.tsx
│   ├── ExpensesSection.tsx
│   ├── SubscriptionsSection.tsx
│   ├── AnnualFixedExpenses.tsx
│   └── IncomeAndSavingsSection.tsx
├── charts/
│   ├── ExpensesPieChart.tsx
│   ├── MonthlyExpensesIncomeChart.tsx
│   └── ExpensesPieChart.tsx
├── income/
│   ├── AdditionalMonthlyIncomes.tsx
│   ├── VariableMonthlyIncomes.tsx
│   ├── MultipleMonthlyIncomes.tsx
│   └── RevenusManager.tsx
├── savings/
│   ├── AdvancedSavings.tsx
│   └── SharedExpensesManager.tsx
├── fiscal/
│   ├── TaxManager.tsx
│   └── AdvancedFiscalManager.tsx
├── management/
│   ├── GlobalDataManager.tsx (à subdiviser)
│   ├── PayrollSlipManager.tsx
│   └── DataExport.tsx
├── ai/
│   ├── MLTrainingInterface.tsx
│   └── BudgetSuggestions.tsx
├── auth/
│   └── LoginForm.tsx
├── forms/
│   ├── AdvancedSignupForm.tsx
│   ├── AddYearModal.tsx
│   └── InitializationModal.tsx
├── utils/
│   ├── ErrorBoundary.tsx
│   ├── ThemeToggle.tsx
│   ├── ExpenseShareInput.tsx
│   └── GeographicSelector.tsx
└── assets/
    └── AssetsTracking.tsx
```
