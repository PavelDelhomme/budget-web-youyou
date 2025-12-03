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
  yourAmount: number; // Montant que vous payez (calculé automatiquement si parts utilisées)
  totalAmount: number; // Montant total de la dépense
  sharedWith?: string; // Nom de la personne avec qui c'est partagé
  yourPercentage?: number; // Pourcentage que vous payez (0-100)
  totalParts?: number; // Nombre total de parts (ex: 2 pour un loyer partagé en 2)
  yourParts?: number; // Nombre de parts que vous payez (ex: 1 pour "1/2 du loyer")
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  note: string;
  share?: ExpenseShare; // Information sur le partage (optionnel)
  accountId?: string; // ID du compte bancaire depuis lequel la dépense est effectuée
  projectId?: string; // ID du projet d'épargne lié (optionnel)
}

// Type de dépense fixe (pour catégorisation)
export type FixedExpenseType = 'subscription' | 'insurance' | 'rent' | 'tax' | 'other';

// Fréquence de la dépense fixe
export type FixedExpenseFrequency = 'monthly' | 'annual';

// Dépense fixe unifiée (remplace Subscription et AnnualFixedExpense)
export interface FixedExpense {
  id: string;
  name: string;
  amount: number; // Montant réellement payé (avec partage si applicable)
  frequency: FixedExpenseFrequency; // 'monthly' ou 'annual'
  type?: FixedExpenseType; // Type optionnel : abonnement, assurance, etc.
  // Pour les dépenses mensuelles
  startMonth?: number; // Mois de début (1-12)
  endMonth?: number; // Mois de fin (1-12), undefined si en cours
  ongoing?: boolean; // Si true, pas de fin prévue
  // Pour les dépenses annuelles
  month?: number; // Mois où la dépense est effectuée (1-12)
  note?: string;
  share?: ExpenseShare; // Information sur le partage (optionnel)
  accountId?: string; // ID du compte bancaire depuis lequel la dépense est effectuée
}

// Anciens types conservés pour compatibilité (dépréciés)
export interface Subscription {
  id: string;
  name: string;
  monthly: number;
  startMonth: number;
  endMonth: number;
  ongoing: boolean;
  accountId?: string;
  share?: ExpenseShare;
}

export interface SavingsTransaction {
  id: string;
  date: string;
  amount: number; // Positive for addition, negative for withdrawal
  note: string;
}

// Dépenses fixes annuelles (déprécié, utiliser FixedExpense)
export interface AnnualFixedExpense {
  id: string;
  name: string;
  amount: number;
  month: number; // Mois où la dépense est effectuée (1-12)
  note?: string;
  share?: ExpenseShare;
  paidTo?: string;
  accountId?: string;
  isRecurring?: boolean; // true = récurrente chaque année, false = ponctuelle cette année uniquement
  year?: number; // Année pour les dépenses ponctuelles (optionnel, défaut = année courante)
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
  accountId?: string; // ID du compte bancaire lié (pas de compte courant/checking)
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

// Transactions d'investissement ponctuelles
export interface InvestmentTransaction {
  id: string;
  date: string; // Date de la transaction (ISO format)
  amount: number; // Montant de la contribution (toujours positif)
  note?: string; // Note optionnelle
}

// Investissements
export interface Investment {
  id: string;
  type: 'stocks' | 'crypto' | 'other';
  name: string;
  platform: string; // Ex: Revolut, Binance, etc.
  currentValue: number;
  monthlyContribution: number; // Contribution mensuelle fixe (optionnelle)
  initialAmount: number;
  startDate: string; // Date de début d'investissement (ISO format)
  transactions?: InvestmentTransaction[]; // Contributions ponctuelles
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
  monthlyAdjustments?: MonthlyIncomeAdjustment[]; // Ajustements pour des mois spécifiques (ex: décembre = 706,86€ au lieu de 900€)
}

// Ajustement mensuel pour un revenu permanent (exception pour un mois spécifique)
export interface MonthlyIncomeAdjustment {
  year: number;
  month: number; // 1-12
  amount: number; // Nouveau montant pour ce mois
  note?: string; // Raison de l'ajustement (ex: "Ajustement Pôle Emploi")
}

// Sources de revenus mensuels multiples (pour intérim, plusieurs emplois, etc.)
export interface MonthlyIncomeSource {
  id: string;
  name: string; // Ex: "Salaire principal", "Intérim chez X", "Allocations CAF"
  amount: number; // Montant mensuel
  startDate: string; // Date de début (ISO format)
  endDate?: string; // Date de fin (optionnel, undefined = permanent)
  type: 'salary' | 'interim' | 'allocation' | 'freelance' | 'other'; // Type de revenu
  note?: string; // Note optionnelle
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
// Location géographique
export interface GeographicLocation {
  region?: string; // Région du monde (ex: europe, north_america, etc.)
  country?: string; // Code pays ISO (ex: FR, US, etc.)
  countryName?: string; // Nom du pays
  city?: string; // Ville
  department?: string; // Département/État/Province
  postalCode?: string; // Code postal (optionnel)
}

// Profil utilisateur
export interface UserProfile {
  csp: string; // Catégorie socio-professionnelle
  profession?: string;
  secteur_activite?: string;
  statut_professionnel?: string;
  situation_familiale: string;
  nombre_enfants: number;
  geographic_location?: GeographicLocation;
  age?: number;
  monthly_income?: number;
  type_revenu?: string;
  annees_experience?: number;
  niveau_etude?: string;
  situation_actuelle?: string;
  type_logement?: string;
  loyer_mensuel?: number;
  objectifs_budget?: string[];
  preferences?: string[];
}

export interface UserGlobalData {
  bankAccounts: BankAccount[];
  investments: Investment[];
  savingsGoals: SavingsGoal[];
  savingsProjects: SavingsProject[];
  temporaryIncomes: TemporaryIncome[];
  sharedExpensePersons: SharedExpensePerson[];
  personTransactions: PersonTransaction[];
  salaryHistory?: SalaryHistory[]; // Historique des changements de salaire
  payrollSlips?: PayrollSlip[]; // Fiches de paie importées
  initializationComplete: boolean;
  monthlySalary?: number; // Revenu mensuel principal ACTUEL (salaire, allocation chômage, etc.)
  monthlySalaryStartDate?: string; // Date de début du revenu principal actuel (ISO format)
  lockedYears?: number[]; // Années verrouillées (ne peuvent pas être modifiées)
  excludedPredictedYears?: number[]; // Années prédites à exclure de la génération
  maxPredictedYears?: number; // Nombre maximum d'années à prédire par l'IA (défaut: 3)
  userProfile?: UserProfile; // Profil utilisateur (CSP, situation, etc.) pour génération de budget statistique
}

// Revenus variables supplémentaires par mois (primes, cadeaux, etc.)
export interface MonthlyAdditionalIncome {
  id: string;
  name: string; // Ex: "Prime de Noël", "Cadeau", "Bonus trimestriel", etc.
  amount: number;
  month: number; // 1-12 pour janvier-décembre
  note?: string;
}

export interface YearData {
  categories: Category[];
  expenses: Expense[];
  subs: Subscription[];
  annualFixedExpenses?: AnnualFixedExpense[];
  monthlySalary?: number; // Salaire de base mensuel pour l'année (pour compatibilité)
  variableMonthlyIncomes?: number[]; // Revenus variables par mois [janvier, février, ..., décembre] (12 valeurs). Si vide, utilise monthlySalary. Si défini, remplace monthlySalary pour ce mois
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[]; // Revenus supplémentaires par mois (primes, cadeaux, etc.) qui s'ajoutent au revenu de base
  monthlyIncomeSources?: MonthlyIncomeSource[]; // Sources de revenus mensuels multiples (intérim, plusieurs emplois, etc.)
  currentSavings?: number;
  savingsTransactions?: SavingsTransaction[];
}

// Historique des salaires (changements de travail)
export interface SalaryHistory {
  id: string;
  amount: number; // Montant mensuel
  startDate: string; // Date de début (ISO format)
  endDate?: string; // Date de fin (ISO format) - undefined si toujours actif
  type: 'salary' | 'unemployment' | 'freelance' | 'other'; // Type de revenu
  note?: string; // Note (ex: "Nouveau travail chez X")
}

// Fiche de paie - Structure complète pour import et gestion
export type ContractType = 'CDI' | 'CDD' | 'interim' | 'freelance' | 'internship' | 'apprenticeship' | 'other';

export interface PayrollSlip {
  id: string;
  year: number;
  month: number; // 1-12 (janvier = 1, décembre = 12)
  
  // Informations générales
  contractType: ContractType; // Type de contrat
  employer: string; // Nom de l'employeur
  employeeName?: string; // Nom du salarié (optionnel)
  
  // Données financières
  grossSalary: number; // Salaire brut
  netSalary: number; // Salaire net
  baseSalary?: number; // Salaire de base (hors primes)
  
  // Cotisations sociales
  socialContributions?: {
    employee: number; // Cotisations salariales totales
    employer: number; // Cotisations patronales totales
    breakdown?: { // Détail des cotisations (optionnel)
      name: string; // Ex: "Sécurité sociale", "Retraite", etc.
      employeeAmount: number;
      employerAmount?: number;
      rate?: number; // Taux en %
    }[];
  };
  
  // Primes et compléments
  bonuses?: number; // Primes (optionnel)
  overtime?: number; // Heures sup (optionnel)
  overtimeHours?: number; // Nombre d'heures sup (optionnel)
  
  // Détails supplémentaires
  hoursWorked?: number; // Nombre d'heures travaillées
  hourlyRate?: number; // Taux horaire
  paidDays?: number; // Nombre de jours payés
  
  // Informations fiscales
  taxableIncome?: number; // Revenu imposable
  incomeTaxWithheld?: number; // Prélevement à la source (optionnel)
  
  // Métadonnées
  paymentDate?: string; // Date de paiement (ISO format)
  periodStart?: string; // Début de période (ISO format)
  periodEnd?: string; // Fin de période (ISO format)
  filePath?: string; // Chemin vers le fichier PDF/image original (optionnel)
  
  // Notes
  note?: string; // Note optionnelle
  verified: boolean; // Si les données ont été vérifiées par l'utilisateur
  extractedAutomatically: boolean; // Si les données ont été extraites automatiquement
}

// Fiche de paie - Structure complète pour import et gestion
export type ContractType = 'CDI' | 'CDD' | 'interim' | 'freelance' | 'internship' | 'apprenticeship' | 'other';

export interface PayrollSlip {
  id: string;
  year: number;
  month: number; // 1-12 (janvier = 1, décembre = 12)
  
  // Informations générales
  contractType: ContractType; // Type de contrat
  employer: string; // Nom de l'employeur
  employeeName?: string; // Nom du salarié (optionnel)
  
  // Données financières
  grossSalary: number; // Salaire brut
  netSalary: number; // Salaire net
  baseSalary?: number; // Salaire de base (hors primes)
  
  // Cotisations sociales
  socialContributions?: {
    employee: number; // Cotisations salariales totales
    employer: number; // Cotisations patronales totales
    breakdown?: { // Détail des cotisations (optionnel)
      name: string; // Ex: "Sécurité sociale", "Retraite", etc.
      employeeAmount: number;
      employerAmount?: number;
      rate?: number; // Taux en %
    }[];
  };
  
  // Primes et compléments
  bonuses?: number; // Primes (optionnel)
  overtime?: number; // Heures sup (optionnel)
  overtimeHours?: number; // Nombre d'heures sup (optionnel)
  
  // Détails supplémentaires
  hoursWorked?: number; // Nombre d'heures travaillées
  hourlyRate?: number; // Taux horaire
  paidDays?: number; // Nombre de jours payés
  
  // Informations fiscales
  taxableIncome?: number; // Revenu imposable
  incomeTaxWithheld?: number; // Prélevement à la source (optionnel)
  
  // Métadonnées
  paymentDate?: string; // Date de paiement (ISO format)
  periodStart?: string; // Début de période (ISO format)
  periodEnd?: string; // Fin de période (ISO format)
  filePath?: string; // Chemin vers le fichier PDF/image original (optionnel)
  
  // Notes
  note?: string; // Note optionnelle
  verified: boolean; // Si les données ont été vérifiées par l'utilisateur
  extractedAutomatically: boolean; // Si les données ont été extraites automatiquement
}

