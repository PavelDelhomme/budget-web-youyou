import { useMemo } from 'react';
import { UserGlobalData, YearData, Expense, Category } from '../../core/types';
import { currency, today } from '../../lib/utils';
import { calculateProjectsContributionsForYear } from '../../lib/utils/savingsProjects';
import { getActiveSalaryForYear, calculateAnnualIncomeFromSalaryHistory } from '../../lib/utils/salaryHistory';
import { BudgetSuggestions } from '../ai/BudgetSuggestions';
import { analyzeBudget } from '../../lib/utils/budgetAnalyzer';
import { ExpensesPieChart } from '../charts/ExpensesPieChart';
import { MonthlyExpensesIncomeChart } from '../charts/MonthlyExpensesIncomeChart';
import { AnnualEvolutionChart } from '../charts/AnnualEvolutionChart';

interface DashboardProps {
  currentYear: number;
  years: number[];
  yearData: YearData;
  historicalData: Map<number, YearData>;
  globalData: UserGlobalData | null;
  predictedYears: any[];
}

export function Dashboard({
  currentYear,
  years,
  yearData,
  historicalData,
  globalData,
  predictedYears,
}: DashboardProps) {
  // Early return if globalData is not yet loaded
  if (!globalData) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">📊 Dashboard Budget</h1>
          <p className="text-blue-100">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Safely extract arrays from globalData, defaulting to empty arrays
  const bankAccounts = globalData.bankAccounts || [];
  const investments = globalData.investments || [];
  const savingsGoals = globalData.savingsGoals || [];
  const savingsProjects = globalData.savingsProjects || [];
  const personTransactions = globalData.personTransactions || [];
  const temporaryIncomes = globalData.temporaryIncomes || [];
  
  // Calculate statistics
  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  
  // Calculer le total des investissements en incluant les contributions mensuelles accumulées
  const totalInvestments = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const startDate = inv.startDate ? new Date(inv.startDate) : null;
      const monthsActive = startDate ? 
        Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + 
                   (today.getMonth() - startDate.getMonth()) + 1) : 0; // +1 pour inclure le mois en cours
      
      // Total investi = valeur initiale + contributions mensuelles accumulées depuis le début
      const totalInvestedWithContributions = inv.initialAmount + (inv.monthlyContribution * monthsActive);
      
      // Le montant total des investissements pour les actifs = valeur actuelle de marché + contributions mensuelles accumulées
      // Les contributions mensuelles représentent de l'argent investi qui doit être compté dans les actifs
      // Si currentValue inclut déjà les contributions, on prend currentValue, sinon on ajoute les contributions
      return sum + Math.max(inv.currentValue, totalInvestedWithContributions);
    }, 0);
  }, [investments]);
  
  const totalAssets = totalBankBalance + totalInvestments;

  const totalSavingsGoals = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Calculate additional income from temporaryIncomes for the current year
  // Utiliser useMemo pour recalculer automatiquement quand globalData change
  const calculateAdditionalIncome = useMemo(() => {
    if (!globalData?.temporaryIncomes) return 0;
    
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
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
  }, [globalData?.temporaryIncomes, currentYear]);

  const monthlySalary = useMemo(() => {
    // Priorité : revenu spécifique à l'année > revenu global > salaire actif de l'historique
    if (yearData.monthlySalary !== undefined && yearData.monthlySalary !== null && yearData.monthlySalary > 0) {
      return yearData.monthlySalary;
    }
    if (globalData?.monthlySalary && globalData.monthlySalary > 0) {
      return globalData.monthlySalary;
    }
    // Utiliser le salaire actif de l'historique si disponible
    if (globalData?.salaryHistory) {
      const activeSalary = getActiveSalaryForYear(globalData.salaryHistory, currentYear);
      if (activeSalary !== null && activeSalary > 0) {
        return activeSalary;
      }
    }
    return 0;
  }, [yearData.monthlySalary, globalData?.monthlySalary, globalData?.salaryHistory, currentYear]);
  
  const additionalIncome = calculateAdditionalIncome;
  const annualIncome = useMemo(() => {
    // Calculer les revenus depuis l'historique des salaires si disponible (prend en compte les dates)
    let baseAnnualIncome = 0;
    
    // Si on a un salaire spécifique à l'année ou global, l'utiliser pour 12 mois
    if (yearData.monthlySalary !== undefined && yearData.monthlySalary !== null && yearData.monthlySalary > 0) {
      baseAnnualIncome = yearData.monthlySalary * 12;
    } else if (globalData?.monthlySalary && globalData.monthlySalary > 0) {
      baseAnnualIncome = globalData.monthlySalary * 12;
    } else if (globalData?.salaryHistory) {
      // Utiliser calculateAnnualIncomeFromSalaryHistory pour tenir compte des dates de début/fin
      baseAnnualIncome = calculateAnnualIncomeFromSalaryHistory(globalData.salaryHistory, currentYear);
    } else {
      // Fallback : utiliser monthlySalary * 12 si aucun historique
      baseAnnualIncome = monthlySalary * 12;
    }
    
    return baseAnnualIncome + additionalIncome;
  }, [yearData.monthlySalary, globalData?.monthlySalary, globalData?.salaryHistory, monthlySalary, additionalIncome, currentYear]);
  
  // Calculer les dépenses annuelles en tenant compte des budgets mensuels si disponibles
  const variableTargets = yearData.categories.reduce((sum, cat) => {
    // Si monthlyTargets est défini, utiliser la somme des budgets mensuels
    if (cat.monthlyTargets && cat.monthlyTargets.length === 12) {
      return sum + cat.monthlyTargets.reduce((s, val) => s + (typeof val === 'string' ? parseFloat(String(val).replace(',', '.')) : (val || 0)), 0);
    }
    // Sinon, utiliser le target annuel
    return sum + (cat.target || 0);
  }, 0);
  
  // Calculer les abonnements annuels
  const subsAnnual = (yearData.subs || []).reduce((sum, sub) => {
    const months = sub.ongoing || !sub.endMonth ? 12 : 
                   (sub.endMonth >= sub.startMonth ? sub.endMonth - sub.startMonth + 1 : 12 - sub.startMonth + sub.endMonth + 1);
    return sum + (sub.monthly || 0) * months;
  }, 0);
  
  // Calculer les dépenses fixes annuelles
  const annualFixedExpensesTotal = (yearData.annualFixedExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  const annualExpenses = variableTargets + subsAnnual + annualFixedExpensesTotal;

  // Calculer l'épargne projetée en incluant les projets d'épargne
  const currentMonth = today.getFullYear() === currentYear ? today.getMonth() + 1 : 1;
  const projectsContributions = calculateProjectsContributionsForYear(savingsProjects, currentYear, currentMonth);
  
  // Épargne actuelle de l'année
  const currentSavings = yearData.currentSavings || 0;
  
  // Épargne de base : épargne actuelle + (revenus - dépenses)
  const baseProjectedSavings = currentSavings + (annualIncome - annualExpenses);
  
  // Ajouter les contributions aux projets d'épargne
  // L'épargne projetée représente l'épargne totale en fin d'année
  const projectedSavings = baseProjectedSavings + projectsContributions;
  
  const savingsRate = annualIncome > 0 ? (projectedSavings / annualIncome) * 100 : 0;

  // Get suggestions
  const historicalArray = Array.from(historicalData.entries()).map(([year, data]) => ({ year, data }));
  const suggestions = analyzeBudget(yearData, historicalArray.map(h => h.data));

  // Calculate trends
  const expenseTrend = historicalArray.length >= 2 
    ? calculateExpenseTrend(historicalArray) 
    : { trend: 0, message: 'Pas assez de données historiques' };

  const incomeTrend = historicalArray.length >= 2
    ? calculateIncomeTrend(historicalArray)
    : { trend: 0, message: 'Pas assez de données historiques' };

  // Calculate monthly expenses for the last 12 months
  const { monthlyExpenses, currentMonthExpenses, categoryExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get all expenses from historical data
    const allExpenses: Expense[] = [];
    const categoriesMap = new Map<string, Category>();
    
    // Collect all expenses and categories from historical data
    for (const [, data] of historicalData.entries()) {
      allExpenses.push(...(data.expenses || []));
      (data.categories || []).forEach(cat => {
        if (!categoriesMap.has(cat.id)) {
          categoriesMap.set(cat.id, cat);
        }
      });
    }
    
    // Add current year data expenses and categories if not already present
    if (yearData.expenses && yearData.expenses.length > 0) {
      // Merge expenses, avoiding duplicates by ID
      const existingIds = new Set(allExpenses.map(e => e.id));
      yearData.expenses.forEach(exp => {
        if (!existingIds.has(exp.id)) {
          allExpenses.push(exp);
        }
      });
    }
    
    (yearData.categories || []).forEach(cat => {
      if (!categoriesMap.has(cat.id)) {
        categoriesMap.set(cat.id, cat);
      }
    });
    
    const allCategoriesList = Array.from(categoriesMap.values());
    
    // Calculate last 12 months
    const monthlyData: Array<{ month: string; year: number; monthNum: number; total: number }> = [];
    const currentMonthExpensesTotal: number = allExpenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => {
        const amount = e.share?.yourAmount || e.amount || 0;
        return sum + amount;
      }, 0);
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthNum = date.getMonth();
      const yearNum = date.getFullYear();
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthExpenses = allExpenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() === monthNum && expenseDate.getFullYear() === yearNum;
        })
        .reduce((sum, e) => {
          const amount = e.share?.yourAmount || e.amount || 0;
          return sum + amount;
        }, 0);
      
      monthlyData.push({
        month: monthName,
        year: yearNum,
        monthNum: monthNum + 1,
        total: monthExpenses,
      });
    }
    
    // Calculate expenses by category for last 12 months
    const categoryExpensesMap = new Map<string, { category: Category; months: Array<{ month: string; total: number }> }>();
    
    allCategoriesList.forEach(cat => {
      categoryExpensesMap.set(cat.id, {
        category: cat,
        months: monthlyData.map(monthData => ({
          month: monthData.month,
          total: allExpenses
            .filter(e => {
              const expenseDate = new Date(e.date);
              return e.categoryId === cat.id &&
                     expenseDate.getMonth() === monthData.monthNum - 1 &&
                     expenseDate.getFullYear() === monthData.year;
            })
            .reduce((sum, e) => {
              const amount = e.share?.yourAmount || e.amount || 0;
              return sum + amount;
            }, 0),
        })),
      });
    });
    
    return {
      monthlyExpenses: monthlyData,
      currentMonthExpenses: currentMonthExpensesTotal,
      categoryExpenses: Object.fromEntries(categoryExpensesMap),
    };
  }, [historicalData, yearData]);

  const maxMonthlyExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full min-w-0">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-5 sm:p-6 md:p-7 text-white overflow-hidden">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 truncate">📊 Dashboard Budget</h1>
        <p className="text-sm sm:text-base text-blue-100 truncate">Vue d'ensemble de votre situation financière</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden w-full">
          <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 truncate font-medium">Actifs totaux</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 truncate">{currency(totalAssets)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            <span className="block truncate">Comptes: {currency(totalBankBalance)}</span>
            <span className="block truncate">Investissements: {currency(totalInvestments)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden w-full">
          <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 truncate font-medium">
            Revenus annuels {currentYear}
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 truncate">{currency(annualIncome)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3">
            {annualIncome > 0 ? (
              <>
                {globalData?.salaryHistory && calculateAnnualIncomeFromSalaryHistory(globalData.salaryHistory, currentYear) > 0 && (
                  <span className="block truncate">
                    {(() => {
                      const salaryFromHistory = calculateAnnualIncomeFromSalaryHistory(globalData.salaryHistory, currentYear);
                      const monthlySal = getActiveSalaryForYear(globalData.salaryHistory, currentYear) || monthlySalary;
                      const monthsActive = salaryFromHistory > 0 && monthlySal > 0 ? Math.round(salaryFromHistory / monthlySal) : 0;
                      return monthsActive > 0 && monthsActive < 12 
                        ? `${currency(monthlySal)}/mois × ${monthsActive} mois`
                        : `${currency(monthlySalary)}/mois`;
                    })()}
                  </span>
                )}
                {(!globalData?.salaryHistory || calculateAnnualIncomeFromSalaryHistory(globalData.salaryHistory, currentYear) === 0) && (
                  <span className="block truncate">{currency(monthlySalary)}/mois</span>
                )}
                {additionalIncome > 0 && (
                  <span className="block truncate">+ {currency(additionalIncome)} supp.</span>
                )}
              </>
            ) : (
              <span className="block truncate text-yellow-600 dark:text-yellow-400">
                Aucun revenu défini
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden w-full">
          <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 truncate font-medium">
            Dépenses annuelles {currentYear}
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 truncate">{currency(annualExpenses)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Budget prévu
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden w-full">
          <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 truncate font-medium">Épargne projetée</div>
          <div className={`text-xl sm:text-2xl md:text-3xl font-bold truncate ${projectedSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {currency(projectedSavings)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            Taux d'épargne: {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts Section - Full Width */}
      <div className="space-y-6">
        {/* Répartition des dépenses par catégorie */}
        <ExpensesPieChart
          categories={yearData.categories || []}
          expenses={yearData.expenses || []}
          size={400}
        />

        {/* Dépenses et revenus par mois - Pleine largeur avec scroll horizontal */}
        <div className="w-full">
          <MonthlyExpensesIncomeChart
            expenses={yearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={yearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={yearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
          />
        </div>
      </div>

      {/* Trends and Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 dark:text-white truncate">📈 Tendances</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dépenses</span>
                <span className={`text-sm font-semibold ${expenseTrend.trend < 0 ? 'text-green-600 dark:text-green-400' : expenseTrend.trend > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {expenseTrend.trend > 0 ? '↑' : expenseTrend.trend < 0 ? '↓' : '→'} {Math.abs(expenseTrend.trend).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{expenseTrend.message}</div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenus</span>
                <span className={`text-sm font-semibold ${incomeTrend.trend > 0 ? 'text-green-600 dark:text-green-400' : incomeTrend.trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {incomeTrend.trend > 0 ? '↑' : incomeTrend.trend < 0 ? '↓' : '→'} {Math.abs(incomeTrend.trend).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{incomeTrend.message}</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 dark:text-white truncate">🎯 Objectifs d'épargne</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {savingsGoals.length > 0 ? savingsGoals.map((goal) => (
              <div key={goal.id} className="min-w-0">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{goal.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${goal.type === 'minimum' ? 'bg-blue-600 dark:bg-blue-500' : goal.type === 'precaution' ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500'}`}
                    style={{ width: `${Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 dark:text-gray-400">Aucun objectif défini</p>}
            {savingsGoals.length > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Total: {currency(totalSavingsGoals)} / {currency(totalSavingsTarget)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      {predictedYears.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg shadow p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">🤖 Prévisions IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictedYears.map((prediction) => (
              <div key={prediction.year} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{prediction.year}</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">IA</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-gray-600 dark:text-gray-400">Revenus projetés:</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {currency(prediction.projectedAnnualIncome || (prediction.monthlySalary * 12))}
                  </div>
                  {(prediction.projectedAnnualIncome || 0) > (prediction.monthlySalary * 12) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      (dont {currency((prediction.projectedAnnualIncome || 0) - (prediction.monthlySalary * 12))} revenus supplémentaires)
                    </div>
                  )}
                  <div className="text-gray-600 dark:text-gray-400">Dépenses projetées:</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{currency(prediction.projectedExpenses)}</div>
                  <div className="text-gray-600 dark:text-gray-400">Épargne projetée:</div>
                  <div className={`font-semibold ${prediction.projectedSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {currency(prediction.projectedSavings)}
                  </div>
                  {prediction.projectedTotalAssets !== undefined && prediction.projectedTotalAssets > 0 && (
                    <>
                      <div className="text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">Actifs totaux projetés:</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">{currency(prediction.projectedTotalAssets)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {prediction.projectedBankAccounts !== undefined && prediction.projectedBankAccounts > 0 && (
                          <>Comptes: {currency(prediction.projectedBankAccounts)}</>
                        )}
                        {prediction.projectedInvestments !== undefined && prediction.projectedInvestments > 0 && (
                          <>{prediction.projectedBankAccounts && prediction.projectedBankAccounts > 0 ? ' + ' : ''}Investissements: {currency(prediction.projectedInvestments)}</>
                        )}
                      </div>
                    </>
                  )}
                  {prediction.projectedSavingsProjects && (
                    <>
                      <div className="text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-700">Projets d'épargne:</div>
                      <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {currency(prediction.projectedSavingsProjects.totalCurrent)} / {currency(prediction.projectedSavingsProjects.totalTarget)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Suggestions */}
      {suggestions.length > 0 && (
        <BudgetSuggestions suggestions={suggestions} />
      )}

      {/* Monthly Expenses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📅 Dépenses mensuelles</h3>
        
        {/* Current Month */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ce mois-ci</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {currency(currentMonthExpenses)}
              </div>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        {/* Last 6 Months Chart */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">6 derniers mois</h4>
          <div className="space-y-3">
            {monthlyExpenses.map((month, idx) => {
              const percentage = maxMonthlyExpense > 0 ? (month.total / maxMonthlyExpense) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {month.month} {month.year}
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {month.total > 0 && (
                          <span className="text-xs font-semibold text-white">
                            {currency(month.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {month.total > 0 ? currency(month.total) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics - Affichage horizontal avec fallback vertical sur petits écrans */}
        <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-around gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-[120px] sm:min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Moyenne</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length || 0)}
            </div>
          </div>
          <div className="flex-1 min-w-[120px] sm:min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Total</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0))}
            </div>
          </div>
          <div className="flex-1 min-w-[120px] sm:min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Max</div>
            <div className="text-sm font-semibold text-red-600 dark:text-red-400 truncate">
              {currency(maxMonthlyExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses by Category - Last 12 Months */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-gray-900 dark:text-white">📊 Évolution par catégorie (12 derniers mois)</h3>
        
        {Object.keys(categoryExpenses).length > 0 ? (
          <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full min-w-0">
            {Object.values(categoryExpenses)
              .filter((ce: { category: Category; months: Array<{ month: string; total: number }> }) => ce.months.some((m: { total: number }) => m.total > 0))
              .sort((a: { months: Array<{ total: number }> }, b: { months: Array<{ total: number }> }) => {
                const totalA = a.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                const totalB = b.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                return totalB - totalA;
              })
              .slice(0, 8)
              .map((categoryData: { category: Category; months: Array<{ month: string; total: number }> }) => {
                const rawCategoryMax = Math.max(...categoryData.months.map((m: { total: number }) => m.total), 1);
                // Arrondir intelligemment pour une échelle cohérente
                const roundToNiceNumber = (value: number): number => {
                  if (value <= 0) return 1000;
                  if (value < 1000) return Math.ceil(value / 100) * 100;
                  if (value < 10000) return Math.ceil(value / 1000) * 1000;
                  if (value < 100000) return Math.ceil(value / 10000) * 10000;
                  return Math.ceil(value / 10000) * 10000 + 10000;
                };
                const categoryMax = roundToNiceNumber(rawCategoryMax);
                const categoryTotal = categoryData.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                const categoryAvg = categoryTotal / categoryData.months.length;
                
                return (
                  <div key={categoryData.category.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0 w-full min-w-0">
                    <div className="flex justify-between items-center mb-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {categoryData.category.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Total: {currency(categoryTotal)} | Moyenne: {currency(categoryAvg)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini chart avec scroll horizontal responsive */}
                    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-36 min-w-max relative">
                        {/* Axe Y avec montants */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 flex flex-col justify-between items-end pr-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 pointer-events-none">
                          <div>{currency(categoryMax)}</div>
                          <div>{currency(categoryMax * 0.75)}</div>
                          <div>{currency(categoryMax * 0.5)}</div>
                          <div>{currency(categoryMax * 0.25)}</div>
                          <div>0€</div>
                        </div>
                        {/* Zone des barres avec lignes de grille */}
                        <div className="flex items-end gap-1 sm:gap-2 ml-12 sm:ml-16 flex-1 relative" style={{ height: '100%' }}>
                          {/* Lignes de grille horizontales pour alignement */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                            <div
                              key={ratio}
                              className="absolute left-0 right-0 border-t border-dashed border-gray-200 dark:border-gray-700 pointer-events-none"
                              style={{
                                bottom: `${ratio * 100}%`,
                              }}
                            />
                          ))}
                          {/* Barres */}
                          {categoryData.months.map((monthData, idx) => {
                            const height = categoryMax > 0 ? (monthData.total / categoryMax) * 100 : 0;
                            return (
                              <div key={idx} className="flex flex-col items-center flex-shrink-0 relative z-10" style={{ minWidth: 'clamp(30px, calc((100% - 1rem) / 12), 60px)', width: 'auto', height: '100%' }}>
                                {/* Montant au-dessus de la barre */}
                                {monthData.total > 0 && (
                                  <div className="absolute bottom-full mb-1 text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap pointer-events-none">
                                    {currency(monthData.total)}
                                  </div>
                                )}
                                <div
                                  className={`w-full rounded-t transition-all duration-300 cursor-pointer relative group ${
                                    monthData.total > 0
                                      ? 'bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                  style={{ 
                                    height: `${Math.max(height, 2)}%`, 
                                    minHeight: '2px',
                                    alignSelf: 'flex-end'
                                  }}
                                  title={`${monthData.month}: ${currency(monthData.total)}`}
                                >
                                  {/* Tooltip au survol */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                    {currency(monthData.total)}
                                  </div>
                                </div>
                                <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap truncate max-w-full">
                                  {monthData.month.substring(0, 3)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">Aucune donnée à afficher</p>
          </div>
        )}
      </div>

      {/* Additional Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 min-w-0 overflow-hidden">
        <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 dark:text-white truncate">📈 Statistiques supplémentaires</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-w-0 overflow-hidden">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">Dépenses ce mois</div>
            <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 truncate">
              {currency(currentMonthExpenses)}
            </div>
            {monthlyExpenses.length > 1 && (() => {
              const avg = monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length;
              const diff = currentMonthExpenses - avg;
              if (Math.abs(diff) < 0.01) return null;
              return (
                <div className={`text-xs mt-1 ${diff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  vs moyenne: {diff > 0 ? '↑ +' : '↓ '}{currency(Math.abs(diff))}
                </div>
              );
            })()}
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-w-0 overflow-hidden">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">Moyenne 6 mois</div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length || 0)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-w-0 overflow-hidden">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">Catégories actives</div>
            <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
              {Object.values(categoryExpenses).filter((ce: { category: Category; months: Array<{ month: string; total: number }> }) => ce.months.some((m: { total: number }) => m.total > 0)).length}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg min-w-0 overflow-hidden">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">Total 6 mois</div>
            <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Investments Visual Section */}
      {investments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📈 Mes investissements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((inv) => {
              const startDate = inv.startDate ? new Date(inv.startDate) : null;
              const monthsActive = startDate ? 
                Math.max(0, (today.getFullYear() - startDate.getFullYear()) * 12 + 
                           (today.getMonth() - startDate.getMonth())) : 0;
              const totalInvested = inv.initialAmount + (inv.monthlyContribution * monthsActive);
              const profit = inv.currentValue - totalInvested;
              const returnPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
              
              return (
                <div key={inv.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{inv.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{inv.platform}</div>
                      {inv.type === 'stocks' && <span className="text-xs text-blue-600 dark:text-blue-400">📊 Bourse</span>}
                      {inv.type === 'crypto' && <span className="text-xs text-orange-600 dark:text-orange-400">₿ Crypto</span>}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Valeur actuelle:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{currency(inv.currentValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total investi:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{currency(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Bénéfice/Perte:</span>
                      <span className={`font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{currency(profit)} ({returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total investissements:</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">{currency(totalInvestments)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Contribution mensuelle totale:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {currency(investments.reduce((sum, inv) => sum + inv.monthlyContribution, 0))}/mois
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Savings Projects Section */}
      {savingsProjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">🎯 Mes projets d'épargne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsProjects.map((project) => {
              const targetDate = new Date(project.targetDate);
              const now = new Date();
              const monthsRemaining = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + 
                (targetDate.getMonth() - now.getMonth()));
              const progress = project.targetAmount > 0 ? (project.currentAmount / project.targetAmount) * 100 : 0;
              const neededPerMonth = monthsRemaining > 0 ? 
                (project.targetAmount - project.currentAmount) / monthsRemaining : 0;
              
              return (
                <div key={project.id} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{project.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Objectif: {currency(project.targetAmount)} • {targetDate.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {currency(project.currentAmount)} / {currency(project.targetAmount)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                    </div>
                    {monthsRemaining > 0 && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {monthsRemaining} mois restants • {currency(neededPerMonth)}/mois nécessaires
                      </div>
                    )}
                    {project.monthlyContribution > 0 && (
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        Contribution: {currency(project.monthlyContribution)}/mois
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {savingsProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total projets:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currency(savingsProjects.reduce((sum, p) => sum + p.currentAmount, 0))} / {currency(savingsProjects.reduce((sum, p) => sum + p.targetAmount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Temporary Incomes Section */}
      {temporaryIncomes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">💰 Revenus ponctuels et supplémentaires</h3>
          <div className="space-y-3">
            {temporaryIncomes.map((income) => {
              const startDate = new Date(income.startDate);
              const endDate = income.endDate ? new Date(income.endDate) : null;
              const isActive = startDate <= today && (!endDate || endDate >= today);
              
              let description = '';
              if (income.duration === 'once') {
                description = `Ponctuel • ${startDate.toLocaleDateString('fr-FR')}`;
              } else if (income.duration === 'months') {
                description = `${income.numberOfMonths || 0} mois • ${startDate.toLocaleDateString('fr-FR')} - ${endDate?.toLocaleDateString('fr-FR') || ''}`;
              } else {
                description = `Permanent depuis ${startDate.toLocaleDateString('fr-FR')}`;
              }
              
              return (
                <div key={income.id} className={`p-3 rounded-lg border ${
                  isActive 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{income.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</div>
                      {income.note && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{income.note}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {income.duration === 'once' ? currency(income.amount) : `${currency(income.amount)}/mois`}
                      </div>
                      {!isActive && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">Inactif</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">💳 Transactions partagées</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {personTransactions.length} transaction(s) enregistrée(s)
          </div>
          {personTransactions.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Aucune transaction partagée pour le moment</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📅 Années suivies</h3>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{years.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">années avec données</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">💼 Investissements actifs</h3>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{investments.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Contribution mensuelle: {currency(investments.reduce((sum, inv) => sum + inv.monthlyContribution, 0))}
          </div>
        </div>
      </div>

      {/* Annual Evolution Chart */}
      {historicalArray.length > 0 && (
        <AnnualEvolutionChart
          historicalData={historicalArray}
          globalData={globalData || undefined}
        />
      )}
    </div>
  );
}

function calculateExpenseTrend(historical: Array<{ year: number; data: YearData }>): { trend: number; message: string } {
  const sorted = historical.sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return { trend: 0, message: 'Pas assez de données' };

  const expenses = sorted.map(h => {
    const categories = h.data.categories?.reduce((sum, cat) => sum + cat.target, 0) || 0;
    const subs = h.data.subs?.reduce((sum, sub) => {
      const months = sub.endMonth >= sub.startMonth ? sub.endMonth - sub.startMonth + 1 : 12 - sub.startMonth + sub.endMonth + 1;
      return sum + sub.monthly * months;
    }, 0) || 0;
    return categories + subs;
  });

  const latest = expenses[expenses.length - 1];
  const previous = expenses[expenses.length - 2];

  if (previous === 0) return { trend: 0, message: 'Pas de données comparables' };

  const trend = ((latest - previous) / previous) * 100;
  return {
    trend,
    message: trend > 0 ? 'Augmentation' : trend < 0 ? 'Diminution' : 'Stable'
  };
}

function calculateIncomeTrend(historical: Array<{ year: number; data: YearData }>): { trend: number; message: string } {
  const sorted = historical.sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return { trend: 0, message: 'Pas assez de données' };

  const incomes = sorted.map(h => (h.data.monthlySalary || 0) * 12);
  const latest = incomes[incomes.length - 1];
  const previous = incomes[incomes.length - 2];

  if (previous === 0) return { trend: 0, message: 'Pas de données comparables' };

  const trend = ((latest - previous) / previous) * 100;
  return {
    trend,
    message: trend > 0 ? 'Augmentation' : trend < 0 ? 'Diminution' : 'Stable'
  };
}

