import React, { useState, useEffect, useRef } from 'react';
import { Api } from './api';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { HamburgerMenu } from './components/HamburgerMenu';
import { SummaryCard } from './components/SummaryCard';
import { CategoriesSection } from './components/CategoriesSection';
import { ExpensesSection } from './components/ExpensesSection';
import { SubscriptionsSection } from './components/SubscriptionsSection';
import { IncomeAndSavingsSection } from './components/IncomeAndSavingsSection';
import { AnnualFixedExpenses } from './components/AnnualFixedExpenses';
import { AddYearModal } from './components/AddYearModal';
import { InitializationModal } from './components/InitializationModal';
import { AdvancedSignupForm, UserProfile } from './components/AdvancedSignupForm';
import { Dashboard } from './components/Dashboard';
import { GlobalDataManager } from './components/GlobalDataManager';
import { RevenusManager } from './components/RevenusManager';
import { MLTrainingInterface } from './components/MLTrainingInterface';
import { TaxManager } from './components/TaxManager';
import { AdvancedFiscalManager } from './components/AdvancedFiscalManager';
import { ExpensesPieChart } from './components/ExpensesPieChart';
import { MonthlyExpensesIncomeChart } from './components/MonthlyExpensesIncomeChart';
import { useBudgetCalculations } from './hooks/useBudgetData';
import { Category, Expense, Subscription, SavingsTransaction, YearData, UserGlobalData, AnnualFixedExpense, MonthlyAdditionalIncome, MonthlyIncomeSource } from './types';
import { generatePredictions, getFutureYears, getHistoricalYears, PredictedYearData } from './utils/budgetPredictor';
import { calculateProjectsContributionsForYear } from './utils/savingsProjects';
import {
  defaultCategories,
  INITIAL_YEARS,
  parseAmount,
  currency,
  toISODate,
  today,
} from './utils';

function App() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>(INITIAL_YEARS);
  const currentYearNum = today.getFullYear();
  const [year, setYear] = useState<number | 'dashboard'>('dashboard');
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);

  // Data for the selected year
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [annualFixedExpenses, setAnnualFixedExpenses] = useState<AnnualFixedExpense[]>([]);
  const [monthlySalary, setMonthlySalary] = useState<number>(0);
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
  // Drawer : ouvert par défaut sur desktop, fermé sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Desktop = ouvert, mobile = fermé
    }
    return true; // Par défaut ouvert si on ne peut pas détecter
  });

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      // Sur desktop, garder ouvert si c'était ouvert, sur mobile fermer
      if (isDesktop && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (!isDesktop && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Debounce timer for saving
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user has a valid session on mount and load global data
  useEffect(() => {
    async function checkSession() {
      try {
        // First check if user is authenticated without generating 401 errors
        const sessionInfo = await Api.checkSession();
        
        if (sessionInfo.authenticated && sessionInfo.email) {
          setSessionEmail(sessionInfo.email);
          
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
                  setIsInitializationModalOpen(false);
                  setIsAdvancedSignupOpen(false);
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
            // Error loading years data
            console.error('Could not load years:', err);
          }
        }
        // If not authenticated, silently return - user will see login form
      } catch (err: any) {
        // Silent fail - user is not logged in, this is normal
        // No need to log anything
      }
    }
    checkSession();
  }, []);

  // Fonction réutilisable pour charger les données historiques et régénérer les prédictions
  const reloadHistoricalDataAndRegeneratePredictions = React.useCallback(async () => {
    if (!sessionEmail || years.length === 0) return;
    
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
          // Skip if error (especially 401 - session not ready)
          if (err?.status !== 401) {
            console.debug('Error loading current year data:', err);
          }
        }
      }
      
      setHistoricalData(historicalDataMap);
      
      // Load ALL future years that exist in years list to check if they have real data
      // If they have data, they are real years, not predictions
      const futureRealYearsDataMap = new Map<number, YearData>();
      const futureRealYears = years.filter(y => y > currentYearNum);
      for (const y of futureRealYears) {
        try {
          const data = await Api.getYearData(y);
          // Check if year has meaningful data (not just defaults)
          const hasRealData = (data.expenses && data.expenses.length > 0) ||
                              (data.categories && data.categories.some((c: Category) => c.target > 0)) ||
                              (data.subs && data.subs.length > 0) ||
                              (data.monthlySalary && data.monthlySalary > 0);
          if (hasRealData) {
            futureRealYearsDataMap.set(y, data);
            historicalDataMap.set(y, data); // Include in historical data for dashboard
          }
        } catch (err: any) {
          // Skip years with errors (especially 401 - session not ready)
          if (err?.status !== 401) {
            console.debug('Error loading future year data:', err);
          }
        }
      }
      
      // Update historical data with future real years
      if (futureRealYearsDataMap.size > 0) {
        futureRealYearsDataMap.forEach((data, year) => {
          historicalDataMap.set(year, data);
        });
        setHistoricalData(new Map(historicalDataMap));
      }
      
      // Generate predictions ONLY for years that:
      // 1. Are NOT in the years list (not manually created)
      // 2. Are truly in the future (not yet created)
      // 3. Are not in excludedPredictedYears
      if (historicalDataMap.size > 0) {
        // Use current globalData state
        const globalDataForPredictions = globalData;
        
        if (globalDataForPredictions) {
          const excludedYears = globalDataForPredictions.excludedPredictedYears || [];
          const maxYears = globalDataForPredictions.maxPredictedYears || 3;
          
          const futureYearsList = getFutureYears(years, currentYearNum, excludedYears, maxYears);
          // Filter out any years that are already in years list (real years)
          const predictedYearsOnly = futureYearsList.filter(y => !years.includes(y));
          
          const historicalArray = Array.from(historicalDataMap.entries()).map(([year, data]) => ({
            year,
            data
          }));
          
          const predictions = generatePredictions(historicalArray, predictedYearsOnly, globalDataForPredictions);
          setPredictedYears(predictions);
        }
      }
    } catch (err) {
      console.error('Error loading historical data:', err);
    }
  }, [sessionEmail, years, globalData]);

  // Load historical data and generate predictions
  // Use dependencies directly instead of the function reference to avoid infinite loops
  useEffect(() => {
    if (!sessionEmail || years.length === 0) return;
    
    const loadData = async () => {
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
            // Skip years with errors (especially 401 - session not ready)
            if (err?.status !== 401) {
              // Only log non-401 errors
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
            // Skip if error (especially 401 - session not ready)
            if (err?.status !== 401) {
              console.debug('Error loading current year data:', err);
            }
          }
        }
        
        // Load ALL future years that exist in years list to check if they have real data
        const futureRealYears = years.filter(y => y > currentYearNum);
        for (const y of futureRealYears) {
          try {
            const data = await Api.getYearData(y);
            // Check if year has meaningful data (not just defaults)
            const hasRealData = (data.expenses && data.expenses.length > 0) ||
                                (data.categories && data.categories.some((c: Category) => c.target > 0)) ||
                                (data.subs && data.subs.length > 0) ||
                                (data.monthlySalary && data.monthlySalary > 0);
            if (hasRealData) {
              historicalDataMap.set(y, data);
            }
          } catch (err: any) {
            // Skip years with errors (especially 401 - session not ready)
            if (err?.status !== 401) {
              console.debug('Error loading future year data:', err);
            }
          }
        }
        
        setHistoricalData(new Map(historicalDataMap));
        
        // Generate predictions ONLY for years that are NOT in the years list
        if (historicalDataMap.size > 0 && globalData) {
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
        }
      } catch (err) {
        console.error('Error loading historical data:', err);
      }
    };
    
    loadData();
  }, [sessionEmail, years, globalData]);

  // Load data when sessionEmail or year changes
  useEffect(() => {
    if (!sessionEmail || !year) return;
    
    // Don't load year data if we're on the dashboard
    if (year === 'dashboard') {
      return;
    }
    
    // Check if it's a predicted year (only if it's NOT in years list - real years are never predictions)
    const isRealYear = typeof year === 'number' && years.includes(year);
    const prediction = !isRealYear ? predictedYears.find(p => p.year === year) : null;
    
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
      if (year === 'dashboard') return;
      try {
        const ds = await Api.getYearData(year);
        setCategories(
          ds.categories && ds.categories.length ? ds.categories : defaultCategories
        );
        setExpenses(Array.isArray(ds.expenses) ? ds.expenses : []);
        setSubs(Array.isArray(ds.subs) ? ds.subs : []);
        setAnnualFixedExpenses(Array.isArray(ds.annualFixedExpenses) ? ds.annualFixedExpenses : []);
        // Prendre monthlySalary depuis yearData, sinon depuis globalData
        setMonthlySalary(ds.monthlySalary || globalData?.monthlySalary || 0);
        setVariableMonthlyIncomes(Array.isArray(ds.variableMonthlyIncomes) && ds.variableMonthlyIncomes.length === 12 ? ds.variableMonthlyIncomes : undefined);
        setAdditionalMonthlyIncomes(Array.isArray(ds.additionalMonthlyIncomes) ? ds.additionalMonthlyIncomes : []);
        setMonthlyIncomeSources(Array.isArray(ds.monthlyIncomeSources) ? ds.monthlyIncomeSources : []);
        setCurrentSavings(ds.currentSavings || 0);
        setSavingsTransactions(Array.isArray(ds.savingsTransactions) ? ds.savingsTransactions : []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [sessionEmail, year, predictedYears, globalData]);

  // Save data when categories, expenses, subs, salary, savings change, with debounce
  // Don't save if viewing a prediction or if we're on the dashboard
  useEffect(() => {
    if (!sessionEmail || !year || year === 'dashboard' || isViewingPrediction) return;
    
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
          console.error('save error', err);
        }
      }
    }, 500);
  }, [categories, expenses, subs, annualFixedExpenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, monthlyIncomeSources, currentSavings, savingsTransactions, sessionEmail, year, isViewingPrediction, globalData?.lockedYears, globalData, years]);

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
    try {
      // For now, signup is handled the same way as login - backend creates data on first connection
      const out = await Api.login(email, password);
      setSessionEmail(out.email);
      
      const currentYear = today.getFullYear();
      
          // Load global data after login (with retry if session not ready)
          try {
            // Wait a bit for session cookie to be available
            await new Promise(resolve => setTimeout(resolve, 200));
            
            let global = null;
            for (let i = 0; i < 3; i++) {
              try {
                global = await Api.getGlobalData();
                break;
              } catch (err: any) {
                if (err?.status === 401 && i < 2) {
                  // Wait a bit and retry if session not ready yet
                  await new Promise(resolve => setTimeout(resolve, 200));
                  continue;
                }
                // If still 401 after retries, don't throw - just skip loading global data
                if (err?.status === 401) {
                  break;
                }
                throw err;
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
                  setIsInitializationModalOpen(false);
                  setIsAdvancedSignupOpen(false);
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
    } catch (err: any) {
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
  }

  function onAddYear() {
    setIsAddYearModalOpen(true);
  }

  async function handleConfirmAddYear(yearToAdd: number) {
    try {
      const out = await Api.addYear(yearToAdd);
      setYears(out.years);
      setYear(yearToAdd);
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
    
    // Régénérer les prédictions
    if (historicalDataMap.size > 0 && globalData) {
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
    // Supprimer toutes les années
    for (const y of years) {
      try {
        await Api.deleteYear(y);
      } catch (err) {
        console.error(`Error deleting year ${y}:`, err);
      }
    }
    
    // Réinitialiser les données globales
    const resetGlobalData: UserGlobalData = {
      bankAccounts: [],
      investments: [],
      savingsGoals: [],
      savingsProjects: [],
      temporaryIncomes: [],
      sharedExpensePersons: [],
      personTransactions: [],
      initializationComplete: false,
      monthlySalary: 0,
      monthlySalaryStartDate: undefined,
      lockedYears: [],
      excludedPredictedYears: [],
      maxPredictedYears: 3,
    };
    
    await Api.putGlobalData(resetGlobalData);
    setGlobalData(resetGlobalData);
    setYears([]);
    setYear('dashboard');
    setPredictedYears([]);
    
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
  // Calculer le revenu annuel : si variableMonthlyIncomes est défini, utiliser la somme, sinon monthlySalary * 12
  const baseAnnualIncome = variableMonthlyIncomes && variableMonthlyIncomes.length === 12
    ? variableMonthlyIncomes.reduce((sum, v) => sum + v, 0)
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

  // UI for login
  if (!sessionEmail) {
    return <LoginForm onLogin={onLogin} />;
  }

  // UI when logged in
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Hamburger Menu Button */}
      <HamburgerMenu isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      {/* Sidebar */}
      <Sidebar
        years={[...new Set([...years, ...predictedYears.map(p => p.year)])]}
        currentYear={year}
        onYearSelect={(y) => {
          if (y === 'dashboard') {
            setYear('dashboard');
          } else {
            setYear(y);
          }
          // Fermer le drawer après sélection sur mobile
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        onAddYear={onAddYear}
        onLogout={onLogout}
        sessionEmail={sessionEmail || ''}
        predictedYears={predictedYears.map(p => p.year)}
        onMaterializeYear={handleMaterializeYear}
        onOpenGlobalData={() => setIsGlobalDataManagerOpen(true)}
        onOpenRevenus={() => setIsRevenusManagerOpen(true)}
        onOpenMLTraining={() => setIsMLTrainingOpen(true)}
        onOpenTaxManager={() => setIsTaxManagerOpen(true)}
        onOpenAdvancedFiscal={() => setIsAdvancedFiscalManagerOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main content */}
      <main className={`flex-1 p-4 md:p-8 dark:text-gray-100 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Dashboard View */}
          {year === 'dashboard' && (
            <>
              {globalData !== null ? (
                <Dashboard
                  currentYear={currentYearNum}
                  years={years}
                  yearData={(() => {
                    // Try to get current year data for dashboard stats
                    const currentYearData = historicalData.get(currentYearNum);
                    if (currentYearData) {
                      return currentYearData;
                    }
                    // Otherwise use defaults, but take monthlySalary from globalData if available
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
            </>
          )}

          {/* Year View */}
          {year !== 'dashboard' && (
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
        <section className="grid md:grid-cols-4 gap-4">
          <SummaryCard
            title="Budget annuel (cible)"
            value={currency(calculations.annualBudgetTotal)}
            subtitle={`Variables: ${currency(calculations.variableTargets)} | Abonnements: ${currency(calculations.subsAnnualCommitted)} | Fixes annuelles: ${currency(calculations.annualFixedExpensesTotal || 0)}`}
          />
          <SummaryCard
            title="Dépensé à date"
            value={currency(calculations.spentToDateTotal)}
            subtitle={`Variables ${currency(calculations.variableSpentTotal)} + Fixes ${currency(calculations.subsPaidToDate)}`}
          />
          <SummaryCard
            title="Reste année (tous postes)"
            value={currency(calculations.remainingYearTotal)}
            subtitle={`${calculations.daysRemaining} jours restants`}
          />
          <SummaryCard
            title="Reste variables"
            value={currency(calculations.variableRemainingTotal)}
            subtitle={`Taux/jour ≈ ${currency(
              calculations.daysRemaining
                ? calculations.variableRemainingTotal / calculations.daysRemaining
                : 0
            )}`}
          />
        </section>

        {/* Income and Savings */}
        <IncomeAndSavingsSection
          monthlySalary={monthlySalary}
          currentSavings={currentSavings}
          savingsTransactions={savingsTransactions}
          onSalaryChange={handleSalaryChange}
          onSavingsChange={handleSavingsChange}
          onAddTransaction={handleAddTransaction}
          onRemoveTransaction={handleRemoveTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          annualIncome={annualIncome}
          projectedSavings={projectedSavings}
          temporaryIncomes={globalData?.temporaryIncomes || []}
          savingsProjects={globalData?.savingsProjects || []}
          variableMonthlyIncomes={variableMonthlyIncomes}
          onVariableMonthlyIncomesChange={typeof year === 'number' ? setVariableMonthlyIncomes : undefined}
          additionalMonthlyIncomes={additionalMonthlyIncomes}
          onAdditionalMonthlyIncomesChange={typeof year === 'number' ? setAdditionalMonthlyIncomes : undefined}
          monthlyIncomeSources={monthlyIncomeSources}
          onMonthlyIncomeSourcesChange={typeof year === 'number' ? setMonthlyIncomeSources : undefined}
          currentYear={typeof year === 'number' ? year : undefined}
          onOpenTaxManager={() => setIsTaxManagerOpen(true)}
        onOpenAdvancedFiscal={() => setIsAdvancedFiscalManagerOpen(true)}
        />

        {/* Categories */}
        <CategoriesSection
          categories={categories}
          variableSpentByCat={calculations.variableSpentByCat}
          variableRemainingByCat={calculations.variableRemainingByCat}
          onUpsertCategory={upsertCategory}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          hasExpensesInCategory={(id) => expenses.some((e) => e.categoryId === id)}
        />

        {/* Expenses */}
        <ExpensesSection
          expenses={expenses}
          categories={categories}
          bankAccounts={globalData?.bankAccounts || []}
          savingsProjects={globalData?.savingsProjects || []}
          onAddExpense={addExpense}
          onRemoveExpense={removeExpense}
          onUpdateExpense={updateExpense}
        />

        {/* Subscriptions */}
        <SubscriptionsSection
          subs={subs}
          monthNow={calculations.monthNow}
          bankAccounts={globalData?.bankAccounts || []}
          onAddSub={addSub}
          onRemoveSub={removeSub}
          onUpdateSub={updateSub}
          monthsOverlapFullYear={calculations.monthsOverlapFullYear}
          monthsOverlapInYear={calculations.monthsOverlapInYear}
        />

        {/* Annual Fixed Expenses */}
        <AnnualFixedExpenses
          expenses={annualFixedExpenses}
          bankAccounts={globalData?.bankAccounts || []}
          onAdd={addAnnualFixedExpense}
          onRemove={removeAnnualFixedExpense}
          onUpdate={updateAnnualFixedExpense}
        />

        {/* Charts Section - Full width below all cards */}
        <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpensesPieChart
            categories={categories}
            expenses={expenses}
            size={300}
            isPrediction={isViewingPrediction}
          />
          {typeof year === 'number' && (
            <MonthlyExpensesIncomeChart
              expenses={expenses}
              monthlySalary={monthlySalary}
              variableMonthlyIncomes={variableMonthlyIncomes}
              additionalMonthlyIncomes={additionalMonthlyIncomes}
              year={year}
              height={300}
              isPrediction={isViewingPrediction}
              categories={isViewingPrediction ? categories : undefined}
              annualFixedExpenses={isViewingPrediction ? annualFixedExpenses : undefined}
              subs={isViewingPrediction ? subs : undefined}
            />
          )}
        </section>

              <section className="text-xs text-slate-500 pb-8">
                <p>
                  Les données sont stockées côté serveur, par utilisateur (email), et
                  chargées/écrites à la volée.
                </p>
              </section>
            </>
          )}
        </div>
      </main>
      
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
    </div>
  );
}

export default App;

