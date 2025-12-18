import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Api } from './core/api';
// Layout
import { Sidebar } from './components/layout/Sidebar';
import { HamburgerMenu } from './components/layout/HamburgerMenu';
import { Modal } from './components/layout/Modal';

// Auth
import { LoginForm } from './components/auth/LoginForm';

// Dashboard
import { Dashboard } from './components/dashboard/Dashboard';
import { SummaryCard } from './components/dashboard/SummaryCard';

// Test
import { ChartsTestInterface } from './components/test/ChartsTestInterface';

// Budget
import { CategoriesSection } from './components/budget/CategoriesSection';
import { UnifiedExpensesManager } from './components/budget/UnifiedExpensesManager';
import { IncomeAndSavingsSection } from './components/budget/IncomeAndSavingsSection';

// Charts
import { ExpensesPieChart } from './components/charts/ExpensesPieChart';
import { MonthlyExpensesIncomeChart } from './components/charts/MonthlyExpensesIncomeChart';

// Income
import { RevenusManager } from './components/income/RevenusManager';

// Management
import { GlobalDataManager } from './components/management/GlobalDataManager';

// AI
import { MLTrainingInterface } from './components/ai/MLTrainingInterface';

// UI
import { FloatingActionButton } from './components/ui/FloatingActionButton';
import { QuickAddExpenseModal } from './components/ui/QuickAddExpenseModal';
import { LazySection } from './components/ui/LazySection';
import { QuickAddIncomeModal } from './components/ui/QuickAddIncomeModal';

// Fiscal
import { TaxManager } from './components/fiscal/TaxManager';
import { AdvancedFiscalManager } from './components/fiscal/AdvancedFiscalManager';

// Admin
import { AdminPanel } from './components/admin/AdminPanel';

// Forms
import { AddYearModal } from './components/forms/AddYearModal';
import { InitializationModal } from './components/forms/InitializationModal';
import { AdvancedSignupForm, UserProfile } from './components/forms/AdvancedSignupForm';
import { useBudgetCalculations } from './hooks/useBudgetData';
import { Category, Expense, Subscription, SavingsTransaction, YearData, UserGlobalData, AnnualFixedExpense, MonthlyAdditionalIncome, MonthlyIncomeSource } from './core/types';
import { generatePredictions, getFutureYears, getHistoricalYears, PredictedYearData } from './lib/utils/budgetPredictor';
import { calculateProjectsContributionsForYear } from './lib/utils/savingsProjects';
import { getActiveSalaryForYear } from './lib/utils/salaryHistory';
import {
  defaultCategories,
  INITIAL_YEARS,
  parseAmount,
  currency,
  toISODate,
  today,
} from './lib/utils';

// Composant YearViewContent pour afficher la vue année avec useBudgetCalculations
function YearViewContent({
  year,
  isViewingPrediction,
  handleMaterializeYear,
  categories,
  expenses,
  subs,
  annualFixedExpenses,
  monthlySalary,
  currentSavings,
  savingsTransactions,
  onSalaryChange,
  onSavingsChange,
  onAddTransaction,
  onRemoveTransaction,
  onUpdateTransaction,
  annualIncome,
  projectedSavings,
  temporaryIncomes,
  savingsProjects,
  variableMonthlyIncomes,
  onVariableMonthlyIncomesChange,
  additionalMonthlyIncomes,
  onAdditionalMonthlyIncomesChange,
  monthlyIncomeSources,
  onMonthlyIncomeSourcesChange,
  currentYear,
  onOpenTaxManager,
  onOpenAdvancedFiscal,
  globalMonthlySalary,
  yearSpecificSalary,
  isFromSalaryHistory,
  onUpsertCategory,
  onAddCategory,
  onRemoveCategory,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  onAddSub,
  onRemoveSub,
  onUpdateSub,
  onAddAnnualFixedExpense,
  onRemoveAnnualFixedExpense,
  onUpdateAnnualFixedExpense,
  triggerAddExpense,
  onTriggerAddExpenseComplete,
  bankAccounts,
}: {
  year: number;
  isViewingPrediction: boolean;
  handleMaterializeYear: (year: number) => void;
  categories: Category[];
  expenses: Expense[];
  subs: Subscription[];
  annualFixedExpenses: AnnualFixedExpense[];
  monthlySalary: number;
  currentSavings: number;
  savingsTransactions: SavingsTransaction[];
  onSalaryChange: (value: number) => void;
  onSavingsChange: (value: number) => void;
  onAddTransaction: (t: SavingsTransaction) => void;
  onRemoveTransaction: (id: string) => void;
  onUpdateTransaction: (id: string, t: SavingsTransaction) => void;
  annualIncome: number;
  projectedSavings: number;
  temporaryIncomes: any[];
  savingsProjects: any[];
  variableMonthlyIncomes?: number[];
  onVariableMonthlyIncomesChange: (incomes: number[] | undefined) => void;
  additionalMonthlyIncomes: MonthlyAdditionalIncome[];
  onAdditionalMonthlyIncomesChange: (incomes: MonthlyAdditionalIncome[]) => void;
  monthlyIncomeSources: MonthlyIncomeSource[];
  onMonthlyIncomeSourcesChange: (sources: MonthlyIncomeSource[]) => void;
  currentYear: number;
  onOpenTaxManager: () => void;
  onOpenAdvancedFiscal: () => void;
  globalMonthlySalary?: number;
  yearSpecificSalary?: number;
  isFromSalaryHistory: boolean;
  onUpsertCategory?: (cat: Category) => void;
  onAddCategory?: () => void;
  onRemoveCategory?: (id: string) => void;
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void;
  onRemoveExpense?: (id: string) => void;
  onUpdateExpense?: (id: string, expense: Partial<Expense>) => void;
  onAddSub?: (sub: Omit<Subscription, 'id'>) => void;
  onRemoveSub?: (id: string) => void;
  onUpdateSub?: (id: string, sub: Partial<Subscription>) => void;
  onAddAnnualFixedExpense?: (expense: Omit<AnnualFixedExpense, 'id'>) => void;
  onRemoveAnnualFixedExpense?: (id: string) => void;
  onUpdateAnnualFixedExpense?: (id: string, expense: Partial<AnnualFixedExpense>) => void;
  triggerAddExpense?: boolean;
  onTriggerAddExpenseComplete?: () => void;
  bankAccounts?: any[];
}) {
  const yearCalculations = useBudgetCalculations(
    year,
    categories,
    expenses,
    subs,
    annualFixedExpenses
  );

  return (
    <>
      {/* Header */}
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Budget Annuel – {year}
          </h1>
          {isViewingPrediction && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
              <span className="text-xs font-medium text-blue-700">Prévision IA</span>
              <button
                onClick={() => handleMaterializeYear(year)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Créer cette année
              </button>
            </div>
          )}
        </div>
        {isViewingPrediction && (
          <p className="text-sm text-gray-600 mt-2">
            Cette prévision est générée automatiquement à partir de vos habitudes de dépenses des années précédentes
          </p>
        )}
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Budget annuel (cible)"
          value={currency(yearCalculations.annualBudgetTotal)}
          subtitle={`Variables: ${currency(yearCalculations.variableTargets)} | Abonnements: ${currency(yearCalculations.subsAnnualCommitted)} | Fixes annuelles: ${currency(yearCalculations.annualFixedExpensesTotal || 0)}`}
        />
        <SummaryCard
          title="Dépensé à date"
          value={currency(yearCalculations.spentToDateTotal)}
          subtitle={`Variables ${currency(yearCalculations.variableSpentTotal)} + Fixes ${currency(yearCalculations.subsPaidToDate)}`}
        />
        <SummaryCard
          title="Reste année (tous postes)"
          value={currency(yearCalculations.remainingYearTotal)}
          subtitle={`${yearCalculations.daysRemaining} jours restants`}
        />
        <SummaryCard
          title="Reste variables"
          value={currency(yearCalculations.variableRemainingTotal)}
          subtitle={`Taux/jour ≈ ${currency(
            yearCalculations.daysRemaining
              ? yearCalculations.variableRemainingTotal / yearCalculations.daysRemaining
              : 0
          )}`}
        />
      </section>

      {/* Income and Savings */}
      <LazySection rootMargin="50px">
        <IncomeAndSavingsSection
          monthlySalary={monthlySalary}
          currentSavings={currentSavings}
          savingsTransactions={savingsTransactions}
          onSalaryChange={onSalaryChange}
          onSavingsChange={onSavingsChange}
          onAddTransaction={onAddTransaction}
          onRemoveTransaction={onRemoveTransaction}
          onUpdateTransaction={onUpdateTransaction}
          annualIncome={annualIncome}
          projectedSavings={projectedSavings}
          temporaryIncomes={temporaryIncomes}
          savingsProjects={savingsProjects}
          variableMonthlyIncomes={variableMonthlyIncomes}
          onVariableMonthlyIncomesChange={onVariableMonthlyIncomesChange}
          additionalMonthlyIncomes={additionalMonthlyIncomes}
          onAdditionalMonthlyIncomesChange={onAdditionalMonthlyIncomesChange}
          monthlyIncomeSources={monthlyIncomeSources}
          onMonthlyIncomeSourcesChange={onMonthlyIncomeSourcesChange}
          currentYear={currentYear}
          onOpenTaxManager={onOpenTaxManager}
          onOpenAdvancedFiscal={onOpenAdvancedFiscal}
          globalMonthlySalary={globalMonthlySalary}
          yearSpecificSalary={yearSpecificSalary}
          isFromSalaryHistory={isFromSalaryHistory}
        />
      </LazySection>

      {/* Categories */}
      <LazySection rootMargin="50px">
        <CategoriesSection
          categories={categories}
          variableSpentByCat={yearCalculations.variableSpentByCat}
          variableRemainingByCat={yearCalculations.variableRemainingByCat}
          onUpsertCategory={onUpsertCategory || (() => {})}
          onAddCategory={onAddCategory || (() => {})}
          onRemoveCategory={onRemoveCategory || (() => {})}
          hasExpensesInCategory={(id) => expenses.some((e) => e.categoryId === id)}
        />
      </LazySection>

      {/* Unified Expenses Manager */}
      <LazySection rootMargin="50px">
        <UnifiedExpensesManager
          expenses={expenses}
          subs={subs}
          annualFixedExpenses={annualFixedExpenses}
          categories={categories}
          bankAccounts={bankAccounts || []}
          savingsProjects={savingsProjects}
          monthNow={yearCalculations.monthNow}
          onAddExpense={onAddExpense || (() => {})}
          onRemoveExpense={onRemoveExpense || (() => {})}
          onUpdateExpense={onUpdateExpense || (() => {})}
          onAddSub={onAddSub || (() => {})}
          onRemoveSub={onRemoveSub || (() => {})}
          onUpdateSub={onUpdateSub || (() => {})}
          onAddAnnualFixed={onAddAnnualFixedExpense || (() => {})}
          onRemoveAnnualFixed={onRemoveAnnualFixedExpense || (() => {})}
          onUpdateAnnualFixed={onUpdateAnnualFixedExpense || (() => {})}
          triggerAddExpense={triggerAddExpense || false}
          onTriggerAddExpenseComplete={onTriggerAddExpenseComplete || (() => {})}
        />
      </LazySection>

      <section className="text-xs text-slate-500 pb-8">
        <p>
          Les données sont stockées côté serveur, par utilisateur (email), et
          chargées/écrites à la volée.
        </p>
      </section>
    </>
  );
}

// Composant wrapper qui passe les handlers à YearViewContent
function YearViewContentWithHandlers(props: any) {
  return (
    <YearViewContent
      year={props.year}
      isViewingPrediction={props.isViewingPrediction}
      handleMaterializeYear={props.handleMaterializeYear}
      categories={props.categories}
      expenses={props.expenses}
      subs={props.subs}
      annualFixedExpenses={props.annualFixedExpenses}
      monthlySalary={props.monthlySalary}
      currentSavings={props.currentSavings}
      savingsTransactions={props.savingsTransactions}
      onSalaryChange={props.handleSalaryChange}
      onSavingsChange={props.handleSavingsChange}
      onAddTransaction={props.handleAddTransaction}
      onRemoveTransaction={props.handleRemoveTransaction}
      onUpdateTransaction={props.handleUpdateTransaction}
      annualIncome={props.annualIncome}
      projectedSavings={props.projectedSavings}
      temporaryIncomes={props.globalData?.temporaryIncomes || []}
      savingsProjects={props.globalData?.savingsProjects || []}
      variableMonthlyIncomes={props.variableMonthlyIncomes}
      onVariableMonthlyIncomesChange={props.setVariableMonthlyIncomes}
      additionalMonthlyIncomes={props.additionalMonthlyIncomes}
      onAdditionalMonthlyIncomesChange={props.setAdditionalMonthlyIncomes}
      monthlyIncomeSources={props.monthlyIncomeSources}
      onMonthlyIncomeSourcesChange={props.setMonthlyIncomeSources}
      currentYear={props.year}
      onOpenTaxManager={() => props.setIsTaxManagerOpen(true)}
      onOpenAdvancedFiscal={() => props.setIsAdvancedFiscalManagerOpen(true)}
      globalMonthlySalary={props.globalData?.monthlySalary}
      yearSpecificSalary={props.hasYearSpecificSalary ? props.monthlySalary : undefined}
      isFromSalaryHistory={props.isFromSalaryHistory}
      onUpsertCategory={props.upsertCategory}
      onAddCategory={props.addCategory}
      onRemoveCategory={props.removeCategory}
      onAddExpense={props.addExpense}
      onRemoveExpense={props.removeExpense}
      onUpdateExpense={props.updateExpense}
      onAddSub={props.addSub}
      onRemoveSub={props.removeSub}
      onUpdateSub={props.updateSub}
      onAddAnnualFixedExpense={props.addAnnualFixedExpense}
      onRemoveAnnualFixedExpense={props.removeAnnualFixedExpense}
      onUpdateAnnualFixedExpense={props.updateAnnualFixedExpense}
      triggerAddExpense={props.triggerAddExpense}
      onTriggerAddExpenseComplete={() => props.setTriggerAddExpense(false)}
      bankAccounts={props.globalData?.bankAccounts || []}
    />
  );
}

// Composant wrapper pour la route /annee/:year qui utilise useParams() correctement
function YearRouteWrapper(props: any) {
  const routeParams = useParams(); // Utiliser useParams() dans le composant rendu par la route
  const yearFromUrl = routeParams.year ? parseInt(routeParams.year) : null;
  
  // Si on n'a pas d'année valide, afficher un loader avec debug
  if (!yearFromUrl || isNaN(yearFromUrl) || yearFromUrl < 2000 || yearFromUrl > 2100) {
    return (
      <main className={`flex-1 w-full overflow-x-hidden p-4 sm:p-4 md:p-6 lg:px-0 lg:py-4 dark:text-gray-100 transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 ${props.isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? 'overflow-hidden' : ''} pt-12 lg:pt-2`}>
        <div className="w-full max-w-full lg:max-w-none space-y-4 sm:space-y-6 lg:pl-2 lg:pr-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de l'année...</p>
            <p className="text-xs text-gray-400 mt-2">routeParams.year: {routeParams.year || 'undefined'}</p>
          </div>
        </div>
      </main>
    );
  }
  
  // Mettre à jour year si nécessaire
  useEffect(() => {
    if (props.year !== yearFromUrl) {
      props.setYear(yearFromUrl);
    }
  }, [yearFromUrl, props.year, props.setYear]);
  
  return (
    <main className={`flex-1 w-full overflow-x-hidden p-4 sm:p-4 md:p-6 lg:px-0 lg:py-4 dark:text-gray-100 transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 ${props.isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? 'overflow-hidden' : ''} pt-12 lg:pt-2`}>
      <div className="w-full max-w-full lg:max-w-none space-y-4 sm:space-y-6 lg:pl-2 lg:pr-4">
        <YearViewContentWithHandlers
          year={yearFromUrl}
          isViewingPrediction={props.isViewingPrediction}
          handleMaterializeYear={props.handleMaterializeYear}
          categories={props.categories}
          expenses={props.expenses}
          subs={props.subs}
          annualFixedExpenses={props.annualFixedExpenses}
          monthlySalary={props.monthlySalary}
          currentSavings={props.currentSavings}
          savingsTransactions={props.savingsTransactions}
          handleSalaryChange={props.handleSalaryChange}
          handleSavingsChange={props.handleSavingsChange}
          handleAddTransaction={props.handleAddTransaction}
          handleRemoveTransaction={props.handleRemoveTransaction}
          handleUpdateTransaction={props.handleUpdateTransaction}
          annualIncome={props.annualIncome}
          projectedSavings={props.projectedSavings}
          globalData={props.globalData}
          variableMonthlyIncomes={props.variableMonthlyIncomes}
          setVariableMonthlyIncomes={props.setVariableMonthlyIncomes}
          additionalMonthlyIncomes={props.additionalMonthlyIncomes}
          setAdditionalMonthlyIncomes={props.setAdditionalMonthlyIncomes}
          monthlyIncomeSources={props.monthlyIncomeSources}
          setMonthlyIncomeSources={props.setMonthlyIncomeSources}
          hasYearSpecificSalary={props.hasYearSpecificSalary}
          isFromSalaryHistory={props.isFromSalaryHistory}
          upsertCategory={props.upsertCategory}
          addCategory={props.addCategory}
          removeCategory={props.removeCategory}
          addExpense={props.addExpense}
          removeExpense={props.removeExpense}
          updateExpense={props.updateExpense}
          addSub={props.addSub}
          removeSub={props.removeSub}
          updateSub={props.updateSub}
          addAnnualFixedExpense={props.addAnnualFixedExpense}
          removeAnnualFixedExpense={props.removeAnnualFixedExpense}
          updateAnnualFixedExpense={props.updateAnnualFixedExpense}
          triggerAddExpense={props.triggerAddExpense}
          setTriggerAddExpense={props.setTriggerAddExpense}
          setIsTaxManagerOpen={props.setIsTaxManagerOpen}
          setIsAdvancedFiscalManagerOpen={props.setIsAdvancedFiscalManagerOpen}
        />
      </div>
    </main>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true); // État de vérification de la session
  const [years, setYears] = useState<number[]>(INITIAL_YEARS);
  const currentYearNum = today.getFullYear();
  const [year, setYear] = useState<number | 'dashboard' | 'charts-test'>('dashboard');
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  
  // Synchroniser l'URL avec l'état year (seulement quand l'URL change)
  useEffect(() => {
    if (!sessionEmail) return; // Ne pas synchroniser si pas connecté
    
    const path = location.pathname;
    if (path === '/' || path === '/dashboard' || path === '/dashboard/') {
      if (year !== 'dashboard') {
        setYear('dashboard');
      }
    } else if (path === '/test-graphiques' || path === '/test-graphiques/') {
      if (year !== 'charts-test') {
        setYear('charts-test');
      }
    } else if (path.startsWith('/annee/')) {
      const yearFromUrl = parseInt(params.year || '');
      if (!isNaN(yearFromUrl) && yearFromUrl >= 2000 && yearFromUrl <= 2100) {
        if (typeof year !== 'number' || year !== yearFromUrl) {
          setYear(yearFromUrl);
        }
      }
      // Ne pas rediriger si on est sur /annee/ - laisser la route gérer l'affichage
    }
  }, [location.pathname, params.year, sessionEmail, year, navigate]);

  // Synchroniser l'URL lorsque year change (sauf si c'est depuis l'URL)
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    if (!sessionEmail) return; // Ne pas naviguer si pas connecté
    
    // Si l'URL a changé, ne pas naviguer (pour éviter les boucles)
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname;
      return;
    }
    
    const currentPath = location.pathname;
    
    // Si on est sur une route /annee/, ne pas rediriger
    if (currentPath.startsWith('/annee/')) {
      // Vérifier que l'année dans l'URL correspond à year
      const yearFromUrl = parseInt(params.year || '');
      if (typeof year === 'number' && year === yearFromUrl) {
        // Tout est bon, on reste sur cette route
        return;
      }
      // Si year n'est pas encore synchronisé, attendre
      return;
    }
    
    if (year === 'dashboard' && currentPath !== '/' && currentPath !== '/dashboard' && currentPath !== '/dashboard/') {
      navigate('/dashboard', { replace: true });
      lastPathRef.current = '/dashboard';
    } else if (year === 'charts-test' && currentPath !== '/test-graphiques' && currentPath !== '/test-graphiques/') {
      navigate('/test-graphiques', { replace: true });
      lastPathRef.current = '/test-graphiques';
    } else if (typeof year === 'number') {
      const expectedPath = `/annee/${year}`;
      if (currentPath !== expectedPath && !currentPath.startsWith('/annee/')) {
        navigate(expectedPath, { replace: true });
        lastPathRef.current = expectedPath;
      }
    }
  }, [year, navigate, sessionEmail, location.pathname, params.year]);

  // Data for the selected year
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [annualFixedExpenses, setAnnualFixedExpenses] = useState<AnnualFixedExpense[]>([]);
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
  const [hasYearSpecificSalary, setHasYearSpecificSalary] = useState<boolean>(false); // True si le revenu est spécifique à l'année
  const [isFromSalaryHistory, setIsFromSalaryHistory] = useState<boolean>(false); // True si le revenu vient de l'historique des salaires
  const [variableMonthlyIncomes, setVariableMonthlyIncomes] = useState<number[] | undefined>(undefined);
  const [additionalMonthlyIncomes, setAdditionalMonthlyIncomes] = useState<MonthlyAdditionalIncome[]>([]);
  const [monthlyIncomeSources, setMonthlyIncomeSources] = useState<MonthlyIncomeSource[]>([]);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  
  // Predicted years data
  const [predictedYears, setPredictedYears] = useState<PredictedYearData[]>([]);
  const [isViewingPrediction, setIsViewingPrediction] = useState(false);
  const [historicalData, setHistoricalData] = useState<Map<number, YearData>>(new Map());

  // Global data and initialization
  const [globalData, setGlobalData] = useState<UserGlobalData | null>(null);
  const [isInitializationModalOpen, setIsInitializationModalOpen] = useState(false);
  const [isAdvancedSignupOpen, setIsAdvancedSignupOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [generatedBudget, setGeneratedBudget] = useState<any>(null);
  const [isGlobalDataManagerOpen, setIsGlobalDataManagerOpen] = useState(false);
  const [isRevenusManagerOpen, setIsRevenusManagerOpen] = useState(false);
  const [isMLTrainingOpen, setIsMLTrainingOpen] = useState(false);
  const [isTaxManagerOpen, setIsTaxManagerOpen] = useState(false);
  const [isAdvancedFiscalManagerOpen, setIsAdvancedFiscalManagerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  // États pour les popups rapides depuis le FAB
  const [isQuickAddExpenseOpen, setIsQuickAddExpenseOpen] = useState(false);
  const [isQuickAddIncomeOpen, setIsQuickAddIncomeOpen] = useState(false);
  // État pour déclencher l'ajout d'une dépense depuis le FAB (pour UnifiedExpensesManager)
  const [triggerAddExpense, setTriggerAddExpense] = useState(false);
  const [pendingAddExpense, setPendingAddExpense] = useState(false);
  // Drawer : logique simplifiée et robuste
  // État du drawer : fermé par défaut sur mobile, ouvert par défaut sur desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-open');
      if (saved !== null) {
        return saved === 'true';
      }
      // Sur desktop, drawer ouvert par défaut
      return window.innerWidth >= 1024;
    }
    return false;
  });
  
  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-open', isSidebarOpen.toString());
    }
  }, [isSidebarOpen]);
  
  // Gérer le resize window pour ajuster le drawer sur desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Sur desktop, toujours afficher le drawer
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer et empêcher l'ouverture du drawer quand le modal d'initialisation est ouvert
  useEffect(() => {
    if (isInitializationModalOpen || isAdvancedSignupOpen) {
      setIsSidebarOpen(false);
    }
  }, [isInitializationModalOpen, isAdvancedSignupOpen]);

  // Empêcher l'ouverture du drawer si le modal d'initialisation est ouvert
  // Créer une fonction wrapper pour le toggle qui vérifie si le modal est ouvert
  const handleSidebarToggle = () => {
    if (isInitializationModalOpen || isAdvancedSignupOpen) {
      // Ne pas permettre l'ouverture du drawer pendant l'initialisation
      return;
    }
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Debounce timer for saving
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Flag to prevent multiple simultaneous calls to reloadHistoricalDataAndRegeneratePredictions
  const isReloadingHistoricalData = useRef<boolean>(false);
  // Store previous values to detect real changes
  const prevYearsRef = useRef<string>('');
  const prevExcludedYearsRef = useRef<string>('');
  const prevMaxYearsRef = useRef<number | undefined>(undefined);

  // Check if user has a valid session on mount and load global data
  // Vérifier la session au démarrage et périodiquement
  useEffect(() => {
    let sessionCheckInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true; // Flag pour éviter les mises à jour sur un composant démonté
    
    async function checkSession() {
      try {
        // First check if user is authenticated without generating 401 errors
        const sessionInfo = await Api.checkSession();
        
        // Ne pas mettre à jour l'état si le composant est démonté
        if (!isMounted) return;
        
        if (sessionInfo.authenticated && sessionInfo.email) {
          setSessionEmail(sessionInfo.email);
          setIsCheckingSession(false); // Session vérifiée, utilisateur connecté
          
          // User is authenticated, now load their data
          try {
            const y = await Api.getYears();
            if (y.email) {
              // Load global data
              try {
                const global = await Api.getGlobalData();
                setGlobalData(global);
                
                // Check if initialization is complete
                if (global.initializationComplete === false) {
                  // Check if user profile exists (has completed advanced signup)
                  if (!global.userProfile) {
                    // Show advanced signup form first
                    setIsAdvancedSignupOpen(true);
                  } else {
                    // Show initialization modal with existing profile
                    setUserProfile(global.userProfile);
                    setIsInitializationModalOpen(true);
                  }
                } else {
                  // Vérifier qu'au moins un compte bancaire est défini
                  if (!global.bankAccounts || global.bankAccounts.length === 0) {
                    // Aucun compte bancaire défini : forcer l'ouverture du modal d'initialisation
                    setIsInitializationModalOpen(true);
                    setIsAdvancedSignupOpen(false);
                  } else {
                    setIsInitializationModalOpen(false);
                    setIsAdvancedSignupOpen(false);
                  }
                }
              } catch (err: any) {
                console.error('Could not load global data:', err);
                if (err.status === 404 || err.message?.includes('404')) {
                  // New user - show advanced signup form
                  setIsAdvancedSignupOpen(true);
                } else {
                  setIsInitializationModalOpen(false);
                  setIsAdvancedSignupOpen(false);
                }
              }
              
              const currentYear = today.getFullYear();
              
              if (Array.isArray(y.years) && y.years.length > 0) {
                let updatedYears = [...y.years];
                
                // Ensure current year is always in the list
                if (!updatedYears.includes(currentYear)) {
                  try {
                    const result = await Api.addYear(currentYear);
                    updatedYears = result.years;
                  } catch (err) {
                    console.warn('Could not add current year:', err);
                  }
                }
                
                setYears(updatedYears);
                setYear('dashboard');
              } else {
                // No years exist, create current year
                try {
                  const result = await Api.addYear(currentYear);
                  setYears(result.years);
                  setYear('dashboard');
                } catch (err) {
                  console.error('Could not create current year:', err);
                }
              }
            }
          } catch (err: any) {
            // Error loading years data - peut-être que la session a expiré
            if (err?.status === 401) {
              setSessionEmail(null);
            } else {
              console.error('Could not load years:', err);
            }
          }
        } else {
          // User is not authenticated - clear session
          setSessionEmail(null);
          setIsCheckingSession(false); // Session vérifiée, utilisateur non connecté
        }
      } catch (err: any) {
        // Session check failed - user is not logged in
        // Ne pas logger les erreurs de connexion répétées
        const isConnectionError = err?.message?.includes("Failed to fetch") || 
                                  err?.message?.includes("ERR_CONNECTION_REFUSED") ||
                                  err?.name === "TypeError";
        
        if (!isConnectionError) {
          console.error("Erreur lors de la vérification de session:", err);
        }
        
        setSessionEmail(null);
        setIsCheckingSession(false); // Session vérifiée (avec erreur), utilisateur non connecté
      }
    }
    
    // Vérifier la session au démarrage
    checkSession();
    
    // Vérifier la session périodiquement (toutes les 5 minutes)
    sessionCheckInterval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);
    
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  // Fonction réutilisable pour charger les données historiques et régénérer les prédictions
  const reloadHistoricalDataAndRegeneratePredictions = React.useCallback(async () => {
    if (!sessionEmail || years.length === 0 || isCheckingSession) return;
    
    // Ne pas charger les données si l'initialisation n'est pas terminée
    // Utiliser globalData depuis la closure (capturé au moment de l'appel)
    const currentGlobalData = globalData;
    // Si globalData n'existe pas encore OU si l'initialisation n'est pas terminée, ne pas charger
    if (!currentGlobalData || currentGlobalData.initializationComplete === false) {
      return;
    }
    
    // Attendre un peu pour que la session soit complètement établie
    // et que les cookies soient disponibles
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Prevent multiple simultaneous calls
    if (isReloadingHistoricalData.current) {
      return;
    }
    
    isReloadingHistoricalData.current = true;
    
    try {
      const currentYearNum = today.getFullYear();
      const historicalYearsList = getHistoricalYears(years, currentYearNum);
      
      // Load all historical year data AND current year for dashboard
      const historicalDataMap = new Map<number, YearData>();
      
      // Load historical years
      for (const y of historicalYearsList) {
        try {
          const data = await Api.getYearData(y);
          historicalDataMap.set(y, data);
        } catch (err: any) {
          // Si erreur 401 silencieuse (expected), ignorer
          if (err?.status === 401 && (err?.silent || err?.expected)) {
            continue;
          }
          // Si erreur 401, la session a peut-être expiré - rediriger vers login
          if (err?.status === 401) {
            // Vérifier si l'initialisation est en cours
            const currentGlobalData = globalData;
            if (currentGlobalData && currentGlobalData.initializationComplete === false) {
              // Pendant l'initialisation, ignorer les erreurs 401
              continue;
            }
            setSessionEmail(null);
            return;
          }
          // Skip years with errors (especially 401 - session not ready)
          if (err?.status !== 401) {
            console.debug('Error loading year data:', err);
          }
        }
      }
      
      // Also load current year for dashboard stats
      if (years.includes(currentYearNum)) {
        try {
          const data = await Api.getYearData(currentYearNum);
          historicalDataMap.set(currentYearNum, data);
        } catch (err: any) {
          // Skip if error (especially 401 - session not ready or initialization not complete)
          // Ne pas logger les erreurs 401 pendant l'initialisation
          if (err?.status === 401) {
            // Vérifier si l'erreur est silencieuse ou si l'initialisation est en cours
            if (err?.silent || err?.expected) {
              return;
            }
            // Vérifier si l'initialisation est en cours
            const currentGlobalData = globalData;
            if (currentGlobalData && currentGlobalData.initializationComplete === false) {
              // Pendant l'initialisation, ignorer les erreurs 401
              return;
            }
          }
          if (err?.status !== 401) {
            console.debug('Error loading current year data:', err);
          }
        }
      }
      
      // Load ALL future years that exist in years list to check if they have real data
      // If they have data, they are real years, not predictions
      // IMPORTANT: Ne charger que les années qui sont vraiment dans la base (existantes)
      // Pour éviter les 401 inutiles, on ne charge que les années futures qui ont déjà été créées
      // Les années trop loin dans le futur (comme 2028, 2029) peuvent ne pas exister
      const futureRealYears = years.filter(y => y > currentYearNum && y <= currentYearNum + 3); // Limiter à 3 ans dans le futur max
      for (const y of futureRealYears) {
        try {
          const data = await Api.getYearData(y);
          // Check if year has meaningful data (not just defaults)
          const hasRealData = (data.expenses && data.expenses.length > 0) ||
                              (data.categories && data.categories.some((c: Category) => c.target > 0)) ||
                              (data.subs && data.subs.length > 0) ||
                              (data.monthlySalary && data.monthlySalary > 0);
          if (hasRealData) {
            historicalDataMap.set(y, data); // Include in historical data for dashboard
          }
        } catch (err: any) {
          // Pour les années futures, un 401 ou 404 signifie que l'année n'existe pas encore
          // Ce n'est pas une erreur - c'est normal pour les années prédites
          if (err?.status === 401) {
            // Si l'erreur est silencieuse (marquée comme expected), ne rien faire
            if (err?.silent || err?.expected) {
              continue;
            }
            // Sinon, vérifier si c'est une année future normale
            const currentYear = new Date().getFullYear();
            if (y > currentYear) {
              // Année future qui n'existe pas encore - c'est normal
              continue;
            }
          }
          if (err?.status === 404) {
            // Année n'existe pas encore - c'est normal, ne pas logger
            continue;
          }
          // Pour les autres erreurs, logger
          console.debug('Error loading future year data:', err);
        }
      }
      
      // Update historical data ONCE with all data collected
      setHistoricalData(new Map(historicalDataMap));
      
      // Generate predictions ONLY if we have enough historical data with real values
      // Need at least 1 year with meaningful data (not just defaults)
      const hasEnoughData = Array.from(historicalDataMap.values()).some(data => {
        const hasExpenses = data.expenses && data.expenses.length > 0;
        const hasCategoriesWithTargets = data.categories && data.categories.some((c: Category) => c.target > 0);
        const hasSubs = data.subs && data.subs.length > 0;
        const hasSalary = data.monthlySalary && data.monthlySalary > 0;
        return hasExpenses || hasCategoriesWithTargets || hasSubs || hasSalary;
      });
      
      // Generate predictions ONLY for years that:
      // 1. Are NOT in the years list (not manually created)
      // 2. Are truly in the future (not yet created)
      // 3. Are not in excludedPredictedYears
      // 4. We have enough historical data
      if (hasEnoughData && historicalDataMap.size > 0) {
        // Use current globalData from closure (captured at call time, not dependency)
        // This avoids recreating the callback when globalData changes
        const currentGlobalData = globalData;
        
        if (currentGlobalData) {
          const excludedYears = currentGlobalData.excludedPredictedYears || [];
          const maxYears = currentGlobalData.maxPredictedYears || 3;
          
          const futureYearsList = getFutureYears(years, currentYearNum, excludedYears, maxYears);
          // Filter out any years that are already in years list (real years)
          const predictedYearsOnly = futureYearsList.filter(y => !years.includes(y));
          
          const historicalArray = Array.from(historicalDataMap.entries()).map(([year, data]) => ({
            year,
            data
          }));
          
          const predictions = generatePredictions(historicalArray, predictedYearsOnly, currentGlobalData);
          
          // Only update if predictions actually changed
          setPredictedYears(prev => {
            const prevYears = prev.map(p => p.year).sort().join(',');
            const newYears = predictions.map(p => p.year).sort().join(',');
            if (prevYears === newYears && prev.length === predictions.length) {
              return prev; // Same predictions, return previous reference
            }
            return predictions;
          });
        }
      } else {
        // Not enough data, clear predictions only if not already empty
        setPredictedYears(prev => prev.length === 0 ? prev : []);
      }
    } catch (err) {
      console.error('Error loading historical data:', err);
    } finally {
      isReloadingHistoricalData.current = false;
    }
    // IMPORTANT: Do NOT include globalData in dependencies to avoid infinite loops
    // Instead, we capture it from closure at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmail, years]);

  // Call reloadHistoricalDataAndRegeneratePredictions when dependencies change
  // DISABLED: This was causing infinite loops. Instead, reload manually when needed.
  // The function is now called explicitly in handleAddYear, handleResetYear, etc.
  // useEffect(() => {
  //   if (!sessionEmail || years.length === 0 || isReloadingHistoricalData.current) {
  //     return;
  //   }
  //   
  //   // Check if dependencies have really changed
  //   const currentYearsStr = JSON.stringify([...years].sort());
  //   const currentExcludedYearsStr = JSON.stringify(globalData?.excludedPredictedYears || []);
  //   const currentMaxYears = globalData?.maxPredictedYears;
  //   
  //   const yearsChanged = prevYearsRef.current !== currentYearsStr;
  //   const excludedYearsChanged = prevExcludedYearsRef.current !== currentExcludedYearsStr;
  //   const maxYearsChanged = prevMaxYearsRef.current !== currentMaxYears;
  //   
  //   // Only reload if something actually changed
  //   if (!yearsChanged && !excludedYearsChanged && !maxYearsChanged && prevYearsRef.current !== '') {
  //     return; // Nothing changed, skip reload
  //   }
  //   
  //   // Update previous values
  //   prevYearsRef.current = currentYearsStr;
  //   prevExcludedYearsRef.current = currentExcludedYearsStr;
  //   prevMaxYearsRef.current = currentMaxYears;
  //   
  //   // Debounce the call to avoid rapid successive calls
  //   const timeoutId = setTimeout(() => {
  //     if (!isReloadingHistoricalData.current) {
  //       reloadHistoricalDataAndRegeneratePredictions();
  //     }
  //   }, 300);
  //   
  //   return () => clearTimeout(timeoutId);
  // }, [sessionEmail, years, globalData?.excludedPredictedYears, globalData?.maxPredictedYears]);
  
  // Initial load only when session is established AND initialization is complete - ONE TIME ONLY
  const hasInitialLoadRef = useRef<boolean>(false);
  useEffect(() => {
    // Ne pas charger si globalData n'existe pas encore OU si l'initialisation n'est pas terminée
    if (!globalData || globalData.initializationComplete === false) {
      // Réinitialiser le flag si l'initialisation n'est pas terminée
      hasInitialLoadRef.current = false;
      return;
    }
    
    if (sessionEmail && years.length > 0 && !hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      prevYearsRef.current = JSON.stringify([...years].sort());
      prevExcludedYearsRef.current = JSON.stringify(globalData?.excludedPredictedYears || []);
      prevMaxYearsRef.current = globalData?.maxPredictedYears;
      
      // Call after a delay to ensure all state is ready AND session is established
      // Augmenter le délai pour laisser le temps aux cookies d'être disponibles
      setTimeout(() => {
        // Vérifier à nouveau avant d'appeler (au cas où globalData aurait changé)
        const currentGlobalData = globalData;
        if (!currentGlobalData || currentGlobalData.initializationComplete === false) {
          // L'initialisation n'est pas terminée, ne pas charger les données
          hasInitialLoadRef.current = false; // Réinitialiser pour réessayer plus tard
          return;
        }
        reloadHistoricalDataAndRegeneratePredictions();
      }, 1000); // Augmenté à 1 seconde pour laisser le temps à la session d'être complètement établie
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmail, globalData?.initializationComplete]);

  // Load data when sessionEmail or year changes, OR when params.year changes (for direct URL access)
  useEffect(() => {
    if (!sessionEmail) return;
    
    // Ne pas charger les données si l'initialisation n'est pas terminée
    if (globalData && globalData.initializationComplete === false) {
      return;
    }
    
    // Si on est sur une route /annee/, utiliser params.year directement
    const currentPath = location.pathname;
    let yearToLoad: number | 'dashboard' | 'charts-test' | null = null;
    
    if (currentPath.startsWith('/annee/')) {
      const yearFromUrl = params.year ? parseInt(params.year) : null;
      if (yearFromUrl && !isNaN(yearFromUrl) && yearFromUrl >= 2000 && yearFromUrl <= 2100) {
        yearToLoad = yearFromUrl;
        // Forcer la synchronisation de year
        if (typeof year !== 'number' || year !== yearFromUrl) {
          setYear(yearFromUrl);
        }
      } else {
        return; // Année invalide, ne pas charger
      }
    } else if (year === 'dashboard' || year === 'charts-test') {
      return; // Ne pas charger de données pour dashboard ou charts-test
    } else if (typeof year === 'number') {
      yearToLoad = year;
    } else {
      return; // Pas d'année à charger
    }
    
    if (!yearToLoad || typeof yearToLoad !== 'number') return;
    
    // Check if it's a predicted year (only if it's NOT in years list - real years are never predictions)
    const isRealYear = years.includes(yearToLoad);
    const prediction = !isRealYear ? predictedYears.find(p => p.year === yearToLoad) : null;
    
    if (prediction) {
      setIsViewingPrediction(true);
      setCategories(prediction.categories);
      setSubs(prediction.subs);
      setMonthlySalary(prediction.monthlySalary);
      setCurrentSavings(0);
      setExpenses([]);
      setAnnualFixedExpenses([]);
      setSavingsTransactions([]);
      return;
    }
    
    setIsViewingPrediction(false);
    async function load() {
      // Utiliser yearToLoad au lieu de year
      if (yearToLoad < 2000 || yearToLoad > 2100) {
        console.warn(`⚠️ Année invalide ignorée: ${yearToLoad}`);
        return;
      }
      try {
        const ds = await Api.getYearData(yearToLoad);
        setCategories(
          ds.categories && ds.categories.length ? ds.categories : defaultCategories
        );
        setExpenses(Array.isArray(ds.expenses) ? ds.expenses : []);
        setSubs(Array.isArray(ds.subs) ? ds.subs : []);
        setAnnualFixedExpenses(Array.isArray(ds.annualFixedExpenses) ? ds.annualFixedExpenses : []);
        // Prendre monthlySalary depuis yearData, sinon depuis globalData, sinon depuis salaryHistory
        // Si ds.monthlySalary est défini (même à 0), c'est un revenu spécifique à l'année
        // Sinon, on utilise le revenu global, ou le salaire actif de l'historique
        const yearSpecificSalaryValue = ds.monthlySalary !== undefined && ds.monthlySalary !== null ? ds.monthlySalary : undefined;
        setHasYearSpecificSalary(yearSpecificSalaryValue !== undefined);
        
        // Calculer le revenu mensuel en priorité : année spécifique > global > historique actif
        let calculatedMonthlySalary = 0;
        if (yearSpecificSalaryValue !== undefined) {
          calculatedMonthlySalary = yearSpecificSalaryValue;
          setIsFromSalaryHistory(false); // Pas depuis l'historique si spécifique à l'année
        } else if (globalData?.monthlySalary && globalData.monthlySalary > 0) {
          calculatedMonthlySalary = globalData.monthlySalary;
          setIsFromSalaryHistory(false); // Pas depuis l'historique si depuis global
        } else if (globalData?.salaryHistory) {
          // Utiliser le salaire actif de l'historique si disponible
          const activeSalary = getActiveSalaryForYear(globalData.salaryHistory, yearToLoad);
          if (activeSalary !== null && activeSalary > 0) {
            calculatedMonthlySalary = activeSalary;
            setIsFromSalaryHistory(true); // Le revenu vient de l'historique
          } else {
            setIsFromSalaryHistory(false);
          }
        } else {
          setIsFromSalaryHistory(false);
        }
        setMonthlySalary(calculatedMonthlySalary);
        setVariableMonthlyIncomes(Array.isArray(ds.variableMonthlyIncomes) && ds.variableMonthlyIncomes.length === 12 ? ds.variableMonthlyIncomes : undefined);
        setAdditionalMonthlyIncomes(Array.isArray(ds.additionalMonthlyIncomes) ? ds.additionalMonthlyIncomes : []);
        setMonthlyIncomeSources(Array.isArray(ds.monthlyIncomeSources) ? ds.monthlyIncomeSources : []);
        setCurrentSavings(ds.currentSavings || 0);
        setSavingsTransactions(Array.isArray(ds.savingsTransactions) ? ds.savingsTransactions : []);
        
        // Si on attendait d'ouvrir le formulaire, le faire maintenant
        if (pendingAddExpense) {
          setPendingAddExpense(false);
          setTimeout(() => {
            setTriggerAddExpense(true);
          }, 200);
        }
      } catch (err: any) {
        // Si erreur 401, vérifier si c'est parce que l'initialisation n'est pas terminée
        if (err?.status === 401) {
          // Si l'initialisation n'est pas terminée, c'est normal - ne pas rediriger
          if (globalData && globalData.initializationComplete === false) {
            return; // Ne pas charger les données pendant l'initialisation
          }
          // Sinon, la session a peut-être expiré - rediriger vers login
          setSessionEmail(null);
          return;
        }
        // Ne pas afficher les erreurs 401 (non authentifié) - c'est normal si l'utilisateur n'est pas connecté
        if (err?.status !== 401) {
          console.error('Erreur lors du chargement des données:', err);
        }
        // En cas d'erreur, réinitialiser le pending
        if (pendingAddExpense) {
          setPendingAddExpense(false);
        }
      }
    }
    load();
  }, [sessionEmail, year, predictedYears, globalData, pendingAddExpense, location.pathname, params.year, years]);

  // Save data when categories, expenses, subs, salary, savings change, with debounce
  // Don't save if viewing a prediction or if we're on the dashboard
  useEffect(() => {
    if (!sessionEmail || !year || year === 'dashboard' || year === 'charts-test' || isViewingPrediction) return;
    
    // Check if year is locked
    const lockedYears = globalData?.lockedYears || [];
    const currentYearNum = today.getFullYear();
    if (typeof year === 'number' && year < currentYearNum && lockedYears.includes(year)) {
      // Year is locked, don't save
      return;
    }
    
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await Api.putYearData(year, {
          categories,
          expenses,
          subs,
          annualFixedExpenses,
          monthlySalary,
          variableMonthlyIncomes,
          additionalMonthlyIncomes,
          monthlyIncomeSources,
          currentSavings,
          savingsTransactions,
        });
        
        // Update historical data with local data (no API call needed - we just saved it)
        // Only update if this is a historical year (for dashboard/predictions)
        if (typeof year === 'number') {
          const currentYearNum = today.getFullYear();
          if (year <= currentYearNum) {
            setHistoricalData((prev) => {
              const newMap = new Map(prev);
              newMap.set(year, {
                categories,
                expenses,
                subs,
                annualFixedExpenses,
                monthlySalary,
                variableMonthlyIncomes,
                additionalMonthlyIncomes,
                currentSavings,
                savingsTransactions,
              } as YearData);
              return newMap;
            });
          }
        }
      } catch (err: any) {
        // Only log errors that are not CSRF-related (they are auto-retried)
        if (err?.message && !err.message.includes('CSRF') && err?.status !== 403) {
          // Ne pas afficher les erreurs 401 (non authentifié) - c'est normal si l'utilisateur n'est pas connecté
          if (err?.status !== 401) {
            console.error('save error', err);
          }
        }
      }
    }, 500);
  }, [categories, expenses, subs, annualFixedExpenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, monthlyIncomeSources, currentSavings, savingsTransactions, sessionEmail, year, isViewingPrediction, globalData?.lockedYears]);

  // Use budget calculations hook (only for numeric years, not dashboard)
  const calculations = useBudgetCalculations(
    typeof year === 'number' ? year : today.getFullYear(), 
    categories, 
    expenses, 
    subs,
    annualFixedExpenses
  );

  // Actions
  function addExpense(expense: Omit<Expense, 'id'>) {
    setExpenses((prev) => [
      {
        id: crypto.randomUUID(),
        ...expense,
        date: expense.date || toISODate(today),
      },
      ...prev,
    ]);
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExpense(id: string, expense: Partial<Expense>) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...expense } : e))
    );
  }

  function addSub(sub: Omit<Subscription, 'id'>) {
    setSubs((prev) => [
      {
        id: crypto.randomUUID(),
        ...sub,
      },
      ...prev,
    ]);
  }

  function removeSub(id: string) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSub(id: string, sub: Partial<Subscription>) {
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...sub } : s))
    );
  }

  function addAnnualFixedExpense(expense: Omit<AnnualFixedExpense, 'id'>) {
    setAnnualFixedExpenses((prev) => [
      {
        id: crypto.randomUUID(),
        ...expense,
      },
      ...prev,
    ]);
  }

  function removeAnnualFixedExpense(id: string) {
    setAnnualFixedExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function updateAnnualFixedExpense(id: string, expense: Partial<AnnualFixedExpense>) {
    setAnnualFixedExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...expense } : e))
    );
  }

  function upsertCategory(id: string, patch: Partial<Category>) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...patch, target: parseAmount(patch.target ?? c.target) }
          : c
      )
    );
  }

  function addCategory() {
    const newCategoryId = crypto.randomUUID();
    // Créer une catégorie avec budgets mensuels par défaut (tous à 0)
    setCategories((prev) => [
      ...prev,
      { 
        id: newCategoryId, 
        name: 'Nouvelle catégorie', 
        target: 0,
        monthlyTargets: Array(12).fill(0) // Budgets mensuels par défaut
      },
    ]);
  }

  function removeCategory(id: string) {
    if (expenses.some((e) => e.categoryId === id)) {
      alert("Supprimez ou réaffectez d'abord les dépenses de cette catégorie.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function onLogin(email: string, password: string, isSignup?: boolean, confirmPassword?: string) {
    setIsCheckingSession(true); // Commencer la vérification
    try {
      // For now, signup is handled the same way as login - backend creates data on first connection
      const out = await Api.login(email, password);
      
      // Attendre un peu pour que le cookie soit bien enregistré
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier que la session est bien établie (avec plusieurs tentatives)
      let sessionVerified = false;
      for (let i = 0; i < 5; i++) {
        try {
          const sessionInfo = await Api.checkSession();
          if (sessionInfo.authenticated) {
            sessionVerified = true;
            break;
          }
        } catch (err) {
          // Ignorer les erreurs et réessayer
        }
        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Si la session n'est pas vérifiée après plusieurs tentatives, continuer quand même
      // Le backend a retourné un succès, donc la session devrait être valide
      if (!sessionVerified) {
        console.warn('Session non vérifiée immédiatement après connexion, mais continuation...');
      }
      
      setSessionEmail(out.email);
      setIsCheckingSession(false); // Connexion réussie
      
      const currentYear = today.getFullYear();
      
          // Load global data after login (with retry if session not ready)
          try {
            // Wait longer for session cookie to be available and processed by browser
            await new Promise(resolve => setTimeout(resolve, 800));
            
            let global = null;
            // Ne faire que 3 tentatives au lieu de 8 pour éviter les appels inutiles
            for (let i = 0; i < 3; i++) {
              try {
                global = await Api.getGlobalData();
                break;
              } catch (err: any) {
                // Si c'est une erreur 401, c'est normal si l'utilisateur n'a pas encore initialisé
                // Ne pas logger ces erreurs
                if (err?.status === 401) {
                  // Si c'est la dernière tentative, créer des données globales vides
                  if (i === 2) {
                    global = {
                      bankAccounts: [],
                      investments: [],
                      savingsGoals: [],
                      savingsProjects: [],
                      temporaryIncomes: [],
                      sharedExpensePersons: [],
                      personTransactions: [],
                      salaryHistory: [],
                      initializationComplete: false,
                      monthlySalary: 0,
                      lockedYears: [],
                      excludedPredictedYears: [],
                      maxPredictedYears: 3,
                      userProfile: null,
                    };
                  } else {
                    // Attendre un peu avant de réessayer
                    await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
                  }
                  continue;
                }
                // Pour les autres erreurs, arrêter les tentatives
                break;
              }
            }
            
            if (global) {
              setGlobalData(global);
              
                // Check if initialization is complete
                if (global.initializationComplete === false) {
                  // Check if user profile exists (has completed advanced signup)
                  if (!global.userProfile) {
                    // Show advanced signup form first
                    setIsAdvancedSignupOpen(true);
                  } else {
                    // Show initialization modal with existing profile
                    setUserProfile(global.userProfile);
                    setIsInitializationModalOpen(true);
                  }
                } else {
                  // Vérifier qu'au moins un compte bancaire est défini
                  if (!global.bankAccounts || global.bankAccounts.length === 0) {
                    // Aucun compte bancaire défini : forcer l'ouverture du modal d'initialisation
                    setIsInitializationModalOpen(true);
                    setIsAdvancedSignupOpen(false);
                  } else {
                    setIsInitializationModalOpen(false);
                    setIsAdvancedSignupOpen(false);
                  }
                }
            } else {
              // Session not ready yet - will be loaded by checkSession useEffect
              setIsInitializationModalOpen(false);
            }
          } catch (err: any) {
            // Silently handle errors - session will be established later
            if (err?.status !== 401) {
              console.error('Could not load global data:', err);
            }
            // Only show modal if it's a 404 (no data exists)
            if (err?.status === 404 || err.message?.includes('404')) {
              // New user - show advanced signup form
              setIsAdvancedSignupOpen(true);
            } else {
              setIsInitializationModalOpen(false);
              setIsAdvancedSignupOpen(false);
            }
          }
      
      let updatedYears = [...out.years];
      
      // Ensure current year is always in the list
      if (!updatedYears.includes(currentYear)) {
        try {
          const result = await Api.addYear(currentYear);
          updatedYears = result.years;
        } catch (err) {
          console.warn('Could not add current year:', err);
        }
      }
      
      setYears(updatedYears);
      // Always select dashboard by default after login
      setYear('dashboard');
      navigate('/dashboard', { replace: true });
      setIsCheckingSession(false); // Connexion réussie, vérification terminée
    } catch (err: any) {
      setIsCheckingSession(false); // En cas d'erreur, arrêter la vérification
      alert(err.message || 'Login error');
    }
  }

  async function handleAdvancedSignupComplete(profile: UserProfile, budget?: any) {
    try {
      // Save user profile to global data
      const currentGlobal = globalData || {
        bankAccounts: [],
        investments: [],
        savingsGoals: [],
        savingsProjects: [],
        temporaryIncomes: [],
        sharedExpensePersons: [],
        personTransactions: [],
        initializationComplete: false,
        monthlySalary: 0,
      };
      
      const globalDataToSave: UserGlobalData = {
        ...currentGlobal,
        userProfile: profile,
      };
      
      await Api.putGlobalData(globalDataToSave);
      setGlobalData(globalDataToSave);
      setUserProfile(profile);
      setGeneratedBudget(budget);
      
      // If budget was generated, pre-fill current year
      if (budget) {
        const currentYearNum = today.getFullYear();
        try {
          // Ensure current year exists
          let currentYearData;
          try {
            currentYearData = await Api.getYearData(currentYearNum);
          } catch (err: any) {
            if (err.status === 404 || err.message?.includes('404')) {
              await Api.addYear(currentYearNum);
              currentYearData = { 
                categories: defaultCategories, 
                expenses: [], 
                subs: [], 
                annualFixedExpenses: [], 
                monthlySalary: 0, 
                currentSavings: 0, 
                savingsTransactions: [] 
              };
            } else {
              throw err;
            }
          }
          
          // Pre-fill with generated budget
          await Api.putYearData(currentYearNum, {
            categories: budget.categories || currentYearData.categories,
            expenses: budget.expenses || currentYearData.expenses,
            subs: budget.subs || currentYearData.subs,
            annualFixedExpenses: budget.annualFixedExpenses || currentYearData.annualFixedExpenses,
            monthlySalary: budget.monthlySalary || currentYearData.monthlySalary,
            currentSavings: currentYearData.currentSavings,
            savingsTransactions: currentYearData.savingsTransactions,
          });
          
          // Update local state
          setCategories(budget.categories || defaultCategories);
          setExpenses(budget.expenses || []);
          setSubs(budget.subs || []);
          setAnnualFixedExpenses(budget.annualFixedExpenses || []);
          setMonthlySalary(budget.monthlySalary || 0);
        } catch (err) {
          console.error('Error pre-filling year data:', err);
        }
      }
      
      // Close advanced signup and show initialization modal
      setIsAdvancedSignupOpen(false);
      setIsInitializationModalOpen(true);
    } catch (err: any) {
      console.error('Error saving user profile:', err);
      alert('Erreur lors de la sauvegarde du profil');
    }
  }

  async function handleInitializationComplete(data: {
    bankAccounts: any[];
    investments: any[];
    savingsGoals: any[];
    monthlySalary: number;
    monthlySalaryStartDate?: string;
    temporaryIncomes: any[];
  }) {
    // Validation obligatoire : au moins un compte bancaire doit être défini
    if (!data.bankAccounts || data.bankAccounts.length === 0) {
      alert('⚠️ Vous devez définir au moins un compte bancaire pour continuer. Veuillez ajouter un compte bancaire.');
      // Ne pas fermer le modal, rester sur la page d'initialisation
      return;
    }
    
    try {
      const globalDataToSave: UserGlobalData = {
        bankAccounts: data.bankAccounts,
        investments: data.investments,
        savingsGoals: data.savingsGoals,
        savingsProjects: [], // Can be added later
        temporaryIncomes: data.temporaryIncomes,
        sharedExpensePersons: [],
        personTransactions: [],
        initializationComplete: true,
        monthlySalary: data.monthlySalary,
        monthlySalaryStartDate: data.monthlySalaryStartDate,
      };
      
      await Api.putGlobalData(globalDataToSave);
      setGlobalData(globalDataToSave);
      
      // Nettoyer les données sauvegardées dans localStorage une fois l'initialisation terminée
      try {
        localStorage.removeItem('budget-initialization-draft');
      } catch (e) {
        console.warn('Erreur lors du nettoyage des données sauvegardées:', e);
      }
      
      // Réinitialiser le flag de chargement initial pour charger les données maintenant que l'initialisation est terminée
      hasInitialLoadRef.current = false;
      
      // Apply monthly salary to current year if year exists
      if (data.monthlySalary > 0) {
        const currentYearNum = today.getFullYear();
        try {
          // Try to get current year data, create if it doesn't exist
          let currentYearData;
          try {
            currentYearData = await Api.getYearData(currentYearNum);
          } catch (err: any) {
            // Year doesn't exist, create it first
            if (err.status === 404 || err.message?.includes('404')) {
              await Api.addYear(currentYearNum);
              currentYearData = { categories: defaultCategories, expenses: [], subs: [], annualFixedExpenses: [], monthlySalary: 0, currentSavings: 0, savingsTransactions: [] };
            } else {
              throw err;
            }
          }
          
          await Api.putYearData(currentYearNum, {
            ...currentYearData,
            monthlySalary: data.monthlySalary,
          });
          
          // Update local state
          if (typeof year === 'number' && year === currentYearNum) {
            setMonthlySalary(data.monthlySalary);
          }
        } catch (err) {
          console.warn('Could not save monthly salary to current year:', err);
        }
      }
      
      setIsInitializationModalOpen(false);
    } catch (err: any) {
      console.error('Could not save initialization data:', err);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  }

  async function onLogout() {
    await Api.logout();
    setSessionEmail(null);
    navigate('/login', { replace: true });
  }

  function onAddYear() {
    setIsAddYearModalOpen(true);
  }

  async function handleConfirmAddYear(yearToAdd: number) {
    try {
      const out = await Api.addYear(yearToAdd);
      setYears(out.years);
      setYear(yearToAdd);
      navigate(`/annee/${yearToAdd}`);
    } catch (err: any) {
      throw err; // Let the modal handle the error display
    }
  }

  async function handleResetYear(yearToReset: number) {
    // Réinitialiser toutes les données de l'année avec les valeurs par défaut
    const defaultYearData = {
      categories: defaultCategories.map(cat => ({ ...cat, monthlyTargets: Array(12).fill(0) })),
      expenses: [],
      subs: [],
      annualFixedExpenses: [],
      monthlySalary: 0,
      variableMonthlyIncomes: undefined,
      additionalMonthlyIncomes: [],
      monthlyIncomeSources: [],
      currentSavings: 0,
      savingsTransactions: []
    };
    
    await Api.putYearData(yearToReset, defaultYearData);
    
    // Recharger les données si c'est l'année actuellement affichée
    if (year === yearToReset) {
      const data = await Api.getYearData(yearToReset);
      setCategories(data.categories || defaultCategories);
      setExpenses(data.expenses || []);
      setSubs(data.subs || []);
      setAnnualFixedExpenses(data.annualFixedExpenses || []);
      setMonthlySalary(data.monthlySalary || 0);
      setVariableMonthlyIncomes(data.variableMonthlyIncomes);
      setAdditionalMonthlyIncomes(data.additionalMonthlyIncomes || []);
      setMonthlyIncomeSources(data.monthlyIncomeSources || []);
      setCurrentSavings(data.currentSavings || 0);
      setSavingsTransactions(data.savingsTransactions || []);
    }
    
    // Recharger les données historiques pour mettre à jour les prédictions
    const currentYearNum = today.getFullYear();
    const historicalYearsList = getHistoricalYears(years, currentYearNum);
    const historicalDataMap = new Map<number, YearData>();
    
    for (const y of historicalYearsList) {
      try {
        const data = await Api.getYearData(y);
        historicalDataMap.set(y, data);
      } catch (err) {
        // Skip years with errors
      }
    }
    
    if (years.includes(currentYearNum)) {
      try {
        const data = await Api.getYearData(currentYearNum);
        historicalDataMap.set(currentYearNum, data);
      } catch (err) {
        // Skip if error
      }
    }
    
    setHistoricalData(historicalDataMap);
    
    // Régénérer les prédictions SEULEMENT si on a assez de données
    const hasEnoughData = Array.from(historicalDataMap.values()).some(data => {
      const hasExpenses = data.expenses && data.expenses.length > 0;
      const hasCategoriesWithTargets = data.categories && data.categories.some((c: Category) => c.target > 0);
      const hasSubs = data.subs && data.subs.length > 0;
      const hasSalary = data.monthlySalary && data.monthlySalary > 0;
      return hasExpenses || hasCategoriesWithTargets || hasSubs || hasSalary;
    });
    
    if (hasEnoughData && historicalDataMap.size > 0 && globalData) {
      const excludedYears = globalData.excludedPredictedYears || [];
      const maxYears = globalData.maxPredictedYears || 3;
      
      const futureYearsList = getFutureYears(years, currentYearNum, excludedYears, maxYears);
      const predictedYearsOnly = futureYearsList.filter(y => !years.includes(y));
      
      const historicalArray = Array.from(historicalDataMap.entries()).map(([year, data]) => ({
        year,
        data
      }));
      
      const predictions = generatePredictions(historicalArray, predictedYearsOnly, globalData);
      setPredictedYears(predictions);
    } else {
      setPredictedYears([]);
    }
  }

  async function handleDeletePredictedYear(yearToDelete: number) {
    if (!globalData) return;
    
    const excludedYears = globalData.excludedPredictedYears || [];
    const newExcludedYears = [...excludedYears, yearToDelete];
    
    const updatedGlobalData: UserGlobalData = {
      ...globalData,
      excludedPredictedYears: newExcludedYears,
    };
    
    await Api.putGlobalData(updatedGlobalData);
    setGlobalData(updatedGlobalData);
    
    // Remove from predicted years immediately
    setPredictedYears(prev => prev.filter(p => p.year !== yearToDelete));
  }

  async function handleResetAll() {
    try {
      // Supprimer toutes les données de la base de données
      await Api.resetAllData();
      
      // Réinitialiser les données globales complètement
      const resetGlobalData: UserGlobalData = {
        bankAccounts: [],
        investments: [],
        savingsGoals: [],
        savingsProjects: [],
        temporaryIncomes: [],
        sharedExpensePersons: [],
        personTransactions: [],
        salaryHistory: [],
        initializationComplete: false,
        monthlySalary: 0,
        monthlySalaryStartDate: undefined,
        lockedYears: [],
        excludedPredictedYears: [],
        maxPredictedYears: 3,
        userProfile: undefined, // Supprimer le profil utilisateur
      };
      
      // Créer les données globales vides dans la base
      await Api.putGlobalData(resetGlobalData);
      setGlobalData(resetGlobalData);
      setUserProfile(null);
      setGeneratedBudget(null);
      setYears([]);
      setYear('dashboard');
      setPredictedYears([]);
      setHistoricalData(new Map());
      
      // Clear all local state
      setCategories([]);
      setExpenses([]);
      setSubs([]);
      setAnnualFixedExpenses([]);
      setMonthlySalary(0);
      setVariableMonthlyIncomes(undefined);
      setAdditionalMonthlyIncomes([]);
      setMonthlyIncomeSources([]);
      setCurrentSavings(0);
      setSavingsTransactions([]);
      
      // Ouvrir le formulaire d'inscription avancée après reset
      setIsAdvancedSignupOpen(true);
      setIsInitializationModalOpen(false);
      
      // Nettoyer les données sauvegardées dans localStorage
      try {
        localStorage.removeItem('budget-initialization-draft');
      } catch (e) {
        console.warn('Erreur lors du nettoyage des données sauvegardées:', e);
      }
    } catch (err) {
      console.error('Erreur lors du reset:', err);
      // En cas d'erreur, essayer quand même de réinitialiser les données globales
      try {
        const resetGlobalData: UserGlobalData = {
          bankAccounts: [],
          investments: [],
          savingsGoals: [],
          savingsProjects: [],
          temporaryIncomes: [],
          sharedExpensePersons: [],
          personTransactions: [],
          salaryHistory: [],
          initializationComplete: false,
          monthlySalary: 0,
          monthlySalaryStartDate: undefined,
          lockedYears: [],
          excludedPredictedYears: [],
          maxPredictedYears: 3,
          userProfile: undefined,
        };
        await Api.putGlobalData(resetGlobalData);
        setGlobalData(resetGlobalData);
        setIsAdvancedSignupOpen(true);
        setIsInitializationModalOpen(false);
      } catch (e) {
        console.error('Erreur lors de la réinitialisation des données globales:', e);
      }
    }
    
    // Réouvrir le modal d'initialisation
    setIsInitializationModalOpen(false);
    setIsAdvancedSignupOpen(true);
  }

  // Materialize a predicted year (convert prediction to real year)
  async function handleMaterializeYear(yearToMaterialize: number) {
    const prediction = predictedYears.find(p => p.year === yearToMaterialize);
    if (!prediction) return;

    try {
      // Add the year first
      const out = await Api.addYear(yearToMaterialize);
      setYears(out.years);
      
      // Save the predicted data as real data
      await Api.putYearData(yearToMaterialize, {
        categories: prediction.categories,
        expenses: [],
        subs: prediction.subs,
        monthlySalary: prediction.monthlySalary,
        currentSavings: 0,
        savingsTransactions: [],
      });
      
      // Remove from predictions
      setPredictedYears(prev => prev.filter(p => p.year !== yearToMaterialize));
      setYear(yearToMaterialize);
      navigate(`/annee/${yearToMaterialize}`);
      setIsViewingPrediction(false);
    } catch (err: any) {
      alert('Erreur lors de la création de l\'année : ' + (err.message || 'Erreur inconnue'));
    }
  }

  // Note: onDeleteYear is available but not currently used in UI
  // It's kept for potential future use or programmatic deletion

  // Salary and Savings handlers
  function handleSalaryChange(salary: number) {
    setMonthlySalary(salary);
  }

  function handleSavingsChange(savings: number) {
    setCurrentSavings(savings);
  }

  function handleAddTransaction(amount: number, note: string) {
    const transaction: SavingsTransaction = {
      id: crypto.randomUUID(),
      date: toISODate(today),
      amount,
      note,
    };
    setSavingsTransactions((prev) => [...prev, transaction]);
    // Update current savings based on transaction
    setCurrentSavings((prev) => prev + amount);
  }

  function handleRemoveTransaction(id: string) {
    const transaction = savingsTransactions.find((t) => t.id === id);
    if (transaction) {
      setSavingsTransactions((prev) => prev.filter((t) => t.id !== id));
      // Revert the transaction effect on savings
      setCurrentSavings((prev) => prev - transaction.amount);
    }
  }

  function handleUpdateTransaction(id: string, amount: number, note: string) {
    const transaction = savingsTransactions.find((t) => t.id === id);
    if (transaction) {
      // Revert the old transaction effect on savings
      setCurrentSavings((prev) => prev - transaction.amount);
      // Apply the new transaction effect
      setCurrentSavings((prev) => prev + amount);
      // Update the transaction
      setSavingsTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, amount, note } : t))
      );
    }
  }

  // Calculate projected savings at end of year
  // Inclure les revenus supplémentaires dans le calcul
  const calculateAdditionalIncome = (year: number) => {
    if (!globalData?.temporaryIncomes) return 0;
    
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    let total = 0;
    for (const income of globalData.temporaryIncomes) {
      const startDate = new Date(income.startDate);
      const endDate = income.endDate ? new Date(income.endDate) : null;
      
      // Revenus permanents : 12 mois si l'année est après la date de début
      if (income.duration === 'permanent' && startDate <= yearEnd) {
        if (startDate <= yearStart) {
          // Commencé avant ou au début de l'année = 12 mois
          total += income.amount * 12;
        } else {
          // Commencé pendant l'année = mois restants
          const monthsActive = 12 - startDate.getMonth();
          total += income.amount * monthsActive;
        }
      }
      
      // Revenus temporaires sur plusieurs mois : calculer combien de mois dans l'année
      if (income.duration === 'months' && endDate) {
        if (startDate <= yearEnd && endDate >= yearStart) {
          const start = startDate < yearStart ? yearStart : startDate;
          const end = endDate > yearEnd ? yearEnd : endDate;
          // Calculer le nombre de mois entre start et end
          const monthsActive = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
          total += income.amount * Math.max(0, monthsActive);
        }
      }
      
      // Revenus ponctuels : si dans l'année
      if (income.duration === 'once' && startDate >= yearStart && startDate <= yearEnd) {
        total += income.amount;
      }
    }
    
    return total;
  };
  
  const additionalIncome = typeof year === 'number' ? calculateAdditionalIncome(year) : 0;
  // Calculer le revenu annuel : si variableMonthlyIncomes est défini avec 12 valeurs, utiliser la somme, sinon monthlySalary * 12
  const baseAnnualIncome = variableMonthlyIncomes && variableMonthlyIncomes.length === 12 && variableMonthlyIncomes.some(v => v > 0)
    ? variableMonthlyIncomes.reduce((sum, v) => sum + (v || 0), 0)
    : monthlySalary * 12;
  // Ajouter les revenus supplémentaires par mois (primes, cadeaux, etc.)
  const additionalMonthlyIncomeTotal = additionalMonthlyIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const annualIncome = baseAnnualIncome + additionalIncome + additionalMonthlyIncomeTotal;
  // annualBudgetTotal inclut déjà variableTargets + subsAnnualCommitted + annualFixedExpensesTotal
  const annualExpenses = typeof year === 'number' ? calculations.annualBudgetTotal : 0;
  
  // Calculer l'épargne projetée en incluant les projets d'épargne
  let projectedSavings = 0;
  if (typeof year === 'number') {
    const savingsProjects = globalData?.savingsProjects || [];
    const currentMonth = today.getFullYear() === year ? today.getMonth() + 1 : 1;
    
    // Contribution de base : épargne actuelle + (revenus - dépenses)
    const baseProjectedSavings = currentSavings + (annualIncome - annualExpenses);
    
    // Contributions futures aux projets d'épargne pour le reste de l'année
    // Ces contributions font partie de l'épargne totale projetée
    const projectsContributions = calculateProjectsContributionsForYear(savingsProjects, year, currentMonth);
    
    // L'épargne projetée = épargne de base + contributions aux projets
    // Cela représente l'épargne totale en fin d'année incluant les contributions aux projets
    // Les projets sont considérés comme de l'épargne allouée
    projectedSavings = baseProjectedSavings + projectsContributions;
  }

  // Afficher un loader pendant la vérification de la session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  // Détecter si on est sur la page de login
  const isLoginPage = location.pathname === '/login' || location.pathname === '/login/';
  const isAuthenticated = !!sessionEmail;
  
  // UI when logged in
  // Détecter si un modal est ouvert pour cacher le FAB
  const isAnyModalOpen = 
    isInitializationModalOpen ||
    isAdvancedSignupOpen ||
    isAddYearModalOpen ||
    isGlobalDataManagerOpen ||
    isRevenusManagerOpen ||
    isMLTrainingOpen ||
    isTaxManagerOpen ||
    isAdvancedFiscalManagerOpen ||
    isAdminPanelOpen ||
    isQuickAddExpenseOpen ||
    isQuickAddIncomeOpen;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gray-900 w-full overflow-x-hidden">
      {/* Floating Action Button - Caché si un modal est ouvert OU si on est sur la page de login */}
      {isAuthenticated && !isLoginPage && (
        <FloatingActionButton
          hidden={isAnyModalOpen}
          onAddExpense={() => {
            setIsQuickAddExpenseOpen(true);
          }}
          onAddIncome={() => {
            setIsQuickAddIncomeOpen(true);
          }}
        />
      )}
      
      {/* Hamburger Menu Button - Caché si on est sur la page de login ou pendant l'initialisation */}
      {isAuthenticated && !isLoginPage && !isInitializationModalOpen && !isAdvancedSignupOpen && (
        <HamburgerMenu isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      )}
      
      {/* Sidebar - Caché si on est sur la page de login ou pendant l'initialisation */}
      {isAuthenticated && !isLoginPage && !isInitializationModalOpen && !isAdvancedSignupOpen && (
        <Sidebar
        years={[...new Set([...years, ...predictedYears.map(p => p.year)])]}
        currentYear={year}
        onYearSelect={(y) => {
          // Utiliser navigate() pour changer l'URL, ce qui synchronisera automatiquement year
          if (y === 'dashboard') {
            navigate('/dashboard');
          } else if (y === 'charts-test') {
            navigate('/test-graphiques');
          } else {
            navigate(`/annee/${y}`);
          }
          // Fermer le drawer après sélection sur mobile
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        onAddYear={() => {
          setIsSidebarOpen(false);
          onAddYear();
        }}
        onLogout={onLogout}
        sessionEmail={sessionEmail || ''}
        predictedYears={predictedYears.map(p => p.year)}
        onMaterializeYear={handleMaterializeYear}
        onOpenGlobalData={() => {
          setIsSidebarOpen(false);
          setIsGlobalDataManagerOpen(true);
        }}
        onOpenRevenus={() => {
          setIsSidebarOpen(false);
          setIsRevenusManagerOpen(true);
        }}
        onOpenMLTraining={() => {
          setIsSidebarOpen(false);
          setIsMLTrainingOpen(true);
        }}
        onOpenTaxManager={() => {
          setIsSidebarOpen(false);
          setIsTaxManagerOpen(true);
        }}
        onOpenAdvancedFiscal={() => {
          setIsSidebarOpen(false);
          setIsAdvancedFiscalManagerOpen(true);
        }}
          isOpen={isSidebarOpen}
          onToggle={handleSidebarToggle}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <Routes>
        {/* Route de connexion - Rediriger vers dashboard si déjà connecté */}
        <Route path="/login" element={
          sessionEmail ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginForm onLogin={onLogin} />
          )
        } />
        
        {/* Route racine : rediriger vers dashboard ou login */}
        <Route path="/" element={
          isCheckingSession ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : sessionEmail ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        
        {/* Route dashboard */}
        <Route path="/dashboard" element={
          !sessionEmail ? (
            <Navigate to="/login" replace />
          ) : (
            <main className={`flex-1 w-full overflow-x-hidden p-4 sm:p-4 md:p-6 lg:px-0 lg:py-4 dark:text-gray-100 transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 ${isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? 'overflow-hidden' : ''} pt-12 lg:pt-2`}>
              <div className="w-full max-w-full lg:max-w-none space-y-4 sm:space-y-6 lg:pl-2 lg:pr-4">
                {globalData !== null ? (
                  <Dashboard
                    currentYear={currentYearNum}
                    years={years}
                    yearData={(() => {
                      const currentYearData = historicalData.get(currentYearNum);
                      if (currentYearData) {
                        return currentYearData;
                      }
                      return {
                        categories: defaultCategories,
                        expenses: [],
                        subs: [],
                        annualFixedExpenses: [],
                        monthlySalary: globalData?.monthlySalary || 0,
                        currentSavings: 0,
                        savingsTransactions: [],
                      };
                    })()}
                    historicalData={historicalData}
                    globalData={globalData || {
                      bankAccounts: [],
                      investments: [],
                      savingsGoals: [],
                      savingsProjects: [],
                      temporaryIncomes: [],
                      sharedExpensePersons: [],
                      personTransactions: [],
                      salaryHistory: [],
                      initializationComplete: true,
                      monthlySalary: 0,
                    }}
                    predictedYears={predictedYears}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du dashboard...</p>
                  </div>
                )}
              </div>
            </main>
          )
        } />
        
        {/* Route test graphiques */}
        <Route path="/test-graphiques" element={
          !sessionEmail ? (
            <Navigate to="/login" replace />
          ) : (
            <main className={`flex-1 w-full overflow-x-hidden p-4 sm:p-4 md:p-6 lg:px-0 lg:py-4 dark:text-gray-100 transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 ${isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? 'overflow-hidden' : ''} pt-12 lg:pt-2`}>
              <div className="w-full max-w-full lg:max-w-none space-y-4 sm:space-y-6 lg:pl-2 lg:pr-4">
                {globalData !== null ? (
                  <ChartsTestInterface
                    currentYear={currentYearNum}
                    yearData={(() => {
                      const currentYearData = historicalData.get(currentYearNum);
                      if (currentYearData) {
                        return currentYearData;
                      }
                      return {
                        categories: defaultCategories,
                        expenses: [],
                        subs: [],
                        annualFixedExpenses: [],
                        monthlySalary: globalData?.monthlySalary || 0,
                        currentSavings: 0,
                        savingsTransactions: [],
                      };
                    })()}
                    historicalData={historicalData}
                    globalData={globalData}
                    predictedYears={predictedYears}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des données...</p>
                  </div>
                )}
              </div>
            </main>
          )
        } />
        
        {/* Route année spécifique */}
        <Route path="/annee/:year" element={
          !sessionEmail ? (
            <Navigate to="/login" replace />
          ) : (
            <YearRouteWrapper
              year={year}
              setYear={setYear}
              isViewingPrediction={isViewingPrediction}
              handleMaterializeYear={handleMaterializeYear}
              categories={categories}
              expenses={expenses}
              subs={subs}
              annualFixedExpenses={annualFixedExpenses}
              monthlySalary={monthlySalary}
              currentSavings={currentSavings}
              savingsTransactions={savingsTransactions}
              handleSalaryChange={handleSalaryChange}
              handleSavingsChange={handleSavingsChange}
              handleAddTransaction={handleAddTransaction}
              handleRemoveTransaction={handleRemoveTransaction}
              handleUpdateTransaction={handleUpdateTransaction}
              annualIncome={annualIncome}
              projectedSavings={projectedSavings}
              globalData={globalData}
              variableMonthlyIncomes={variableMonthlyIncomes}
              setVariableMonthlyIncomes={setVariableMonthlyIncomes}
              additionalMonthlyIncomes={additionalMonthlyIncomes}
              setAdditionalMonthlyIncomes={setAdditionalMonthlyIncomes}
              monthlyIncomeSources={monthlyIncomeSources}
              setMonthlyIncomeSources={setMonthlyIncomeSources}
              hasYearSpecificSalary={hasYearSpecificSalary}
              isFromSalaryHistory={isFromSalaryHistory}
              setIsTaxManagerOpen={setIsTaxManagerOpen}
              setIsAdvancedFiscalManagerOpen={setIsAdvancedFiscalManagerOpen}
              isSidebarOpen={isSidebarOpen}
            />
          )
        } />
        
        {/* Ancien code gardé pour référence mais ne devrait plus être utilisé */}
        <Route path="/annee-old/:year" element={
          !sessionEmail ? (
            <Navigate to="/login" replace />
          ) : (
            <main className={`flex-1 w-full overflow-x-hidden p-4 sm:p-4 md:p-6 lg:px-0 lg:py-4 dark:text-gray-100 transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 ${isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 ? 'overflow-hidden' : ''} pt-12 lg:pt-2`}>
              <div className="w-full max-w-full lg:max-w-none space-y-4 sm:space-y-6 lg:pl-2 lg:pr-4">
                {/* Year View */}
                {(() => {
                  // Utiliser directement params.year, même si year n'est pas encore synchronisé
                  const yearFromUrl = params.year ? parseInt(params.year) : null;
                  
                  // Si on a une année valide dans l'URL, l'utiliser directement
                  if (!yearFromUrl || isNaN(yearFromUrl) || yearFromUrl < 2000 || yearFromUrl > 2100) {
                    return (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement de l'année...</p>
                      </div>
                    );
                  }
                  
                  // Forcer la mise à jour de year si nécessaire
                  if (typeof year !== 'number' || year !== yearFromUrl) {
                    setYear(yearFromUrl);
                  }
                  
                  const actualYear = yearFromUrl;
                  return (
                    <YearViewContent
                      year={actualYear}
                      isViewingPrediction={isViewingPrediction}
                      handleMaterializeYear={handleMaterializeYear}
                      categories={categories}
                      expenses={expenses}
                      subs={subs}
                      annualFixedExpenses={annualFixedExpenses}
                      monthlySalary={monthlySalary}
                      currentSavings={currentSavings}
                      savingsTransactions={savingsTransactions}
                      handleSalaryChange={handleSalaryChange}
                      handleSavingsChange={handleSavingsChange}
                      handleAddTransaction={handleAddTransaction}
                      handleRemoveTransaction={handleRemoveTransaction}
                      handleUpdateTransaction={handleUpdateTransaction}
                      annualIncome={annualIncome}
                      projectedSavings={projectedSavings}
                      globalData={globalData}
                      variableMonthlyIncomes={variableMonthlyIncomes}
                      setVariableMonthlyIncomes={setVariableMonthlyIncomes}
                      additionalMonthlyIncomes={additionalMonthlyIncomes}
                      setAdditionalMonthlyIncomes={setAdditionalMonthlyIncomes}
                      monthlyIncomeSources={monthlyIncomeSources}
                      setMonthlyIncomeSources={setMonthlyIncomeSources}
                      hasYearSpecificSalary={hasYearSpecificSalary}
                      isFromSalaryHistory={isFromSalaryHistory}
                      upsertCategory={upsertCategory}
                      addCategory={addCategory}
                      removeCategory={removeCategory}
                      addExpense={addExpense}
                      removeExpense={removeExpense}
                      updateExpense={updateExpense}
                      addSub={addSub}
                      removeSub={removeSub}
                      updateSub={updateSub}
                      addAnnualFixedExpense={addAnnualFixedExpense}
                      removeAnnualFixedExpense={removeAnnualFixedExpense}
                      updateAnnualFixedExpense={updateAnnualFixedExpense}
                      triggerAddExpense={triggerAddExpense}
                      setTriggerAddExpense={setTriggerAddExpense}
                      setIsTaxManagerOpen={setIsTaxManagerOpen}
                      setIsAdvancedFiscalManagerOpen={setIsAdvancedFiscalManagerOpen}
                    />
                  );
                })()}
              </div>
            </main>
          )
        } />
        
        {/* Routes protégées (nécessitent une connexion) - Catch-all pour les autres routes */}
        <Route path="/*" element={
          !sessionEmail ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />
      </Routes>
      
      {/* Add Year Modal */}
      <AddYearModal
        isOpen={isAddYearModalOpen}
        onClose={() => setIsAddYearModalOpen(false)}
        onConfirm={handleConfirmAddYear}
      />
      
      {/* Advanced Signup Form (for new users) */}
      {isAdvancedSignupOpen && (
        <AdvancedSignupForm
          isOpen={true}
          onComplete={handleAdvancedSignupComplete}
          onSkip={() => {
            setIsAdvancedSignupOpen(false);
            setIsInitializationModalOpen(true);
          }}
        />
      )}

      {/* Initialization Modal (can be reopened from settings later) */}
      {isInitializationModalOpen && (
        <InitializationModal
          isOpen={true}
          onComplete={handleInitializationComplete}
          canSkip={false}
          initialData={{
            monthlySalary: generatedBudget?.monthlySalary || globalData?.monthlySalary,
            monthlySalaryStartDate: globalData?.monthlySalaryStartDate,
            temporaryIncomes: globalData?.temporaryIncomes,
          }}
        />
      )}

      {/* Global Data Manager Modal */}
      {globalData && (
        <GlobalDataManager
          isOpen={isGlobalDataManagerOpen}
          onClose={() => setIsGlobalDataManagerOpen(false)}
          globalData={globalData}
          onUpdate={async (data) => {
            const updatedGlobalData: UserGlobalData = {
              ...globalData,
              ...data,
            };
            await Api.putGlobalData(updatedGlobalData);
            setGlobalData(updatedGlobalData);
            
            // Si on est sur le dashboard, mettre à jour aussi l'année courante dans historicalData
            if (year === 'dashboard') {
              const currentYearNum = today.getFullYear();
              setHistoricalData((prev) => {
                const newMap = new Map(prev);
                const currentYearData = newMap.get(currentYearNum);
                if (currentYearData) {
                  // Mettre à jour le monthlySalary depuis globalData si nécessaire
                  newMap.set(currentYearNum, {
                    ...currentYearData,
                    monthlySalary: updatedGlobalData.monthlySalary || currentYearData.monthlySalary,
                  });
                }
                return newMap;
              });
            }
            
            // Les données globales (comptes, investissements, etc.) influencent les prédictions
            // Régénérer les prédictions après chaque modification des données globales
            setTimeout(() => {
              reloadHistoricalDataAndRegeneratePredictions();
            }, 200);
          }}
          years={years}
          predictedYears={predictedYears.map(p => p.year)}
          onResetYear={handleResetYear}
          onDeletePredictedYear={handleDeletePredictedYear}
          onResetAll={handleResetAll}
          currentYear={year}
        />
      )}

      {/* Revenus Manager Modal */}
      {globalData && (
        <RevenusManager
          isOpen={isRevenusManagerOpen}
          onClose={() => setIsRevenusManagerOpen(false)}
          temporaryIncomes={globalData.temporaryIncomes || []}
          onUpdate={async (incomes) => {
            const updatedGlobalData: UserGlobalData = {
              ...globalData,
              temporaryIncomes: incomes,
            };
            await Api.putGlobalData(updatedGlobalData);
            setGlobalData(updatedGlobalData);
            
            // Si on est sur le dashboard, mettre à jour aussi l'année courante dans historicalData
            if (year === 'dashboard') {
              const currentYearNum = today.getFullYear();
              setHistoricalData((prev) => {
                const newMap = new Map(prev);
                const currentYearData = newMap.get(currentYearNum);
                if (currentYearData) {
                  // Mettre à jour le monthlySalary depuis globalData si nécessaire
                  newMap.set(currentYearNum, {
                    ...currentYearData,
                    monthlySalary: updatedGlobalData.monthlySalary || currentYearData.monthlySalary,
                  });
                }
                return newMap;
              });
            }
            
            // Les revenus temporaires influencent aussi les prédictions
            // Régénérer les prédictions après modification
            setTimeout(() => {
              reloadHistoricalDataAndRegeneratePredictions();
            }, 200);
          }}
        />
      )}

      {/* ML Training Interface */}
      <MLTrainingInterface
        isOpen={isMLTrainingOpen}
        onClose={() => setIsMLTrainingOpen(false)}
      />

      {/* Tax Manager */}
      <TaxManager
        isOpen={isTaxManagerOpen}
        onClose={() => setIsTaxManagerOpen(false)}
        annualIncome={annualIncome}
      />
      <AdvancedFiscalManager
        isOpen={isAdvancedFiscalManagerOpen}
        onClose={() => setIsAdvancedFiscalManagerOpen(false)}
        annualIncome={annualIncome}
      />

      {/* Quick Add Expense Modal */}
      {sessionEmail && (
        <QuickAddExpenseModal
          isOpen={isQuickAddExpenseOpen}
          onClose={() => setIsQuickAddExpenseOpen(false)}
          categories={categories.length > 0 ? categories : defaultCategories}
          bankAccounts={globalData?.bankAccounts || []}
          currentYear={typeof year === 'number' ? year : currentYearNum}
          onAddExpense={async (expense) => {
            // Vérifier l'année de la dépense
            const expenseYear = new Date(expense.date).getFullYear();
            
            // Si on est sur le dashboard ou si l'année ne correspond pas, naviguer vers la bonne année
            if (year === 'dashboard' || year === 'charts-test' || (typeof year === 'number' && year !== expenseYear)) {
              setYear(expenseYear);
              // Attendre que l'année soit chargée
              await new Promise(resolve => setTimeout(resolve, 400));
            }
            
            // Ajouter la dépense (elle sera ajoutée à l'année correcte via addExpense)
            addExpense(expense);
            setIsQuickAddExpenseOpen(false);
          }}
        />
      )}

      {/* Quick Add Income Modal */}
      {sessionEmail && globalData && (
        <QuickAddIncomeModal
          isOpen={isQuickAddIncomeOpen}
          onClose={() => setIsQuickAddIncomeOpen(false)}
          onAddIncome={async (income) => {
            const updatedGlobalData: UserGlobalData = {
              ...globalData,
              temporaryIncomes: [...(globalData.temporaryIncomes || []), income],
            };
            await Api.putGlobalData(updatedGlobalData);
            setGlobalData(updatedGlobalData);
            setIsQuickAddIncomeOpen(false);
            
            // Régénérer les prédictions après modification
            setTimeout(() => {
              reloadHistoricalDataAndRegeneratePredictions();
            }, 200);
          }}
        />
      )}

    </div>
  );
}

export default App;

