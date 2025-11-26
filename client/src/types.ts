export interface Category {
  id: string;
  name: string;
  target: number; // Budget annuel total (ou par mois × 12 si monthlyTargets est défini)
  monthlyTargets?: number[]; // Budgets mensuels optionnels [janvier, février, ..., décembre] (12 valeurs)
}

// Dépense partagée ou individuelle
export type ExpenseShareType = 'full' | 'shared' | 'partial';

export interface ExpenseShare {
  type: ExpenseShareType;
  yourAmount: number; // Montant que vous payez
  totalAmount: number; // Montant total de la dépense
  sharedWith?: string; // Nom de la personne avec qui c'est partagé
  yourPercentage?: number; // Pourcentage que vous payez (0-100)
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  note: string;
  share?: ExpenseShare; // Information sur le partage (optionnel)
}

export interface Subscription {
  id: string;
  name: string;
  monthly: number;
  startMonth: number;
  endMonth: number;
  ongoing: boolean;
}

export interface SavingsTransaction {
  id: string;
  date: string;
  amount: number; // Positive for addition, negative for withdrawal
  note: string;
}

// Dépenses fixes annuelles
export interface AnnualFixedExpense {
  id: string;
  name: string;
  amount: number;
  month: number; // Mois où la dépense est effectuée (1-12)
  note?: string;
  share?: ExpenseShare; // Information sur le partage (optionnel)
  paidTo?: string; // Personne à qui l'argent est versé (ex: "Petite amie")
}

// Types d'épargne
export type SavingsType = 'minimum' | 'precaution' | 'project';

export interface SavingsGoal {
  id: string;
  name: string;
  type: SavingsType;
  targetAmount: number;
  currentAmount: number;
  priority: number; // Priorité (1 = plus important)
  description?: string;
}

// Projets d'épargne
export interface SavingsProject {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // Date cible (ISO format)
  monthlyContribution: number;
  description?: string;
}

// Investissements
export interface Investment {
  id: string;
  type: 'stocks' | 'crypto' | 'other';
  name: string;
  platform: string; // Ex: Revolut, Binance, etc.
  currentValue: number;
  monthlyContribution: number;
  initialAmount: number;
  startDate: string; // Date de début d'investissement (ISO format)
  note?: string;
}

// Comptes bancaires
export interface BankAccount {
  id: string;
  name: string; // Ex: Revolut, Compte principal, etc.
  currentBalance: number;
  accountType: 'checking' | 'savings' | 'pocket';
  note?: string;
}

// Suggestions d'amélioration du budget
export interface BudgetSuggestion {
  id: string;
  type: 'reduce' | 'increase' | 'optimize';
  category: string;
  currentValue: number;
  suggestedValue: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

// Revenus temporaires/supplémentaires
export type TemporaryIncomeType = 'gift' | 'government_aid' | 'allocation' | 'bonus' | 'other';
export type TemporaryIncomeDuration = 'once' | 'months' | 'permanent'; // 'permanent' pour les revenus permanents comme allocations

export interface TemporaryIncome {
  id: string;
  name: string;
  type: TemporaryIncomeType;
  amount: number;
  duration: TemporaryIncomeDuration; // 'permanent' = revenu permanent (allocation, aide mensuelle récurrente)
  startDate: string; // Date de début (ISO format)
  endDate?: string; // Date de fin (si duration = 'months', undefined si 'permanent')
  numberOfMonths?: number; // Nombre de mois (si duration = 'months')
  note?: string;
}

// Transactions avec d'autres personnes (remboursements, versements)
export interface PersonTransaction {
  id: string;
  date: string;
  amount: number; // Positif si vous recevez, négatif si vous payez
  person: string; // Nom de la personne
  type: 'reimbursement' | 'payment' | 'transfer'; // Remboursement reçu, paiement fait, transfert
  description: string;
  expenseId?: string; // ID de la dépense liée (si applicable)
}

// Personnes avec qui vous partagez des dépenses
export interface SharedExpensePerson {
  id: string;
  name: string;
  defaultSharePercentage: number; // Pourcentage par défaut (ex: 50 pour 50%)
  note?: string;
}

// Données utilisateur globales (pas liées à une année spécifique)
export interface UserGlobalData {
  bankAccounts: BankAccount[];
  investments: Investment[];
  savingsGoals: SavingsGoal[];
  savingsProjects: SavingsProject[];
  temporaryIncomes: TemporaryIncome[];
  sharedExpensePersons: SharedExpensePerson[];
  personTransactions: PersonTransaction[];
  initializationComplete: boolean;
  monthlySalary?: number; // Revenu mensuel principal (salaire, allocation chômage, etc.)
  monthlySalaryStartDate?: string; // Date de début du revenu principal (ISO format)
}

export interface YearData {
  categories: Category[];
  expenses: Expense[];
  subs: Subscription[];
  annualFixedExpenses?: AnnualFixedExpense[];
  monthlySalary?: number;
  currentSavings?: number;
  savingsTransactions?: SavingsTransaction[];
}

