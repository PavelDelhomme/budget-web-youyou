import React, { useMemo } from 'react';
import { UserGlobalData, YearData, Expense, Category } from '../types';
import { currency, today } from '../utils';
import { BudgetSuggestions } from './BudgetSuggestions';
import { analyzeBudget } from '../utils/budgetAnalyzer';
import { ExpensesPieChart } from './ExpensesPieChart';
import { MonthlyExpensesIncomeChart } from './MonthlyExpensesIncomeChart';

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
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalAssets = totalBankBalance + totalInvestments;

  const totalSavingsGoals = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Calculate additional income from temporaryIncomes for the current year
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

  const monthlySalary = yearData.monthlySalary || globalData?.monthlySalary || 0;
  const additionalIncome = calculateAdditionalIncome(currentYear);
  const annualIncome = (monthlySalary * 12) + additionalIncome;
  
  const annualExpenses = yearData.categories.reduce((sum, cat) => sum + cat.target, 0) +
    (yearData.subs?.reduce((sum, sub) => {
      const months = sub.endMonth >= sub.startMonth ? sub.endMonth - sub.startMonth + 1 : 12 - sub.startMonth + sub.endMonth + 1;
      return sum + sub.monthly * months;
    }, 0) || 0) +
    (yearData.annualFixedExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0);

  const projectedSavings = annualIncome - annualExpenses;
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

  // Calculate monthly expenses for the last 6 months
  const { monthlyExpenses, currentMonthExpenses, categoryExpenses, allCategories } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get all expenses from historical data
    const allExpenses: Expense[] = [];
    const categoriesMap = new Map<string, Category>();
    
    // Collect all expenses and categories from historical data
    for (const [year, data] of historicalData.entries()) {
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
    
    // Calculate last 6 months
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
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
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
    
    // Calculate expenses by category for last 6 months
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
      categoryExpenses: Array.from(categoryExpensesMap.values()),
      allCategories: allCategoriesList,
    };
  }, [historicalData, yearData]);

  const maxMonthlyExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 Dashboard Budget</h1>
        <p className="text-blue-100">Vue d'ensemble de votre situation financière</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actifs totaux</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{currency(totalAssets)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Comptes: {currency(totalBankBalance)} + Investissements: {currency(totalInvestments)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus annuels {currentYear}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currency(annualIncome)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currency(monthlySalary)}/mois {additionalIncome > 0 && `+ ${currency(additionalIncome)} supp.`}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dépenses annuelles {currentYear}</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{currency(annualExpenses)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Budget prévu
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Épargne projetée</div>
          <div className={`text-2xl font-bold ${projectedSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {currency(projectedSavings)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Taux d'épargne: {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Trends and Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📈 Tendances</h3>
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">🎯 Objectifs d'épargne</h3>
          <div className="space-y-3">
            {savingsGoals.length > 0 ? savingsGoals.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{goal.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${goal.type === 'minimum' ? 'bg-blue-600 dark:bg-blue-500' : goal.type === 'precaution' ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500'}`}
                    style={{ width: `${goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 dark:text-gray-400">Aucun objectif défini</p>}
            {savingsGoals.length > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
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

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Moyenne</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
              {currency(maxMonthlyExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses by Category - Last 6 Months */}
      {categoryExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📊 Évolution par catégorie (6 derniers mois)</h3>
          
          <div className="space-y-6">
            {categoryExpenses
              .filter(ce => ce.months.some(m => m.total > 0))
              .sort((a, b) => {
                const totalA = a.months.reduce((sum, m) => sum + m.total, 0);
                const totalB = b.months.reduce((sum, m) => sum + m.total, 0);
                return totalB - totalA;
              })
              .slice(0, 8)
              .map((categoryData) => {
                const categoryMax = Math.max(...categoryData.months.map(m => m.total), 1);
                const categoryTotal = categoryData.months.reduce((sum, m) => sum + m.total, 0);
                const categoryAvg = categoryTotal / categoryData.months.length;
                
                return (
                  <div key={categoryData.category.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {categoryData.category.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Total: {currency(categoryTotal)} | Moyenne: {currency(categoryAvg)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini chart */}
                    <div className="flex items-end gap-1 h-16">
                      {categoryData.months.map((monthData, idx) => {
                        const height = categoryMax > 0 ? (monthData.total / categoryMax) * 100 : 0;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div
                              className={`w-full rounded-t transition-all duration-300 ${
                                monthData.total > 0
                                  ? 'bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                              style={{ height: `${height}%` }}
                              title={`${monthData.month}: ${currency(monthData.total)}`}
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                              {monthData.month.substring(0, 3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Additional Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">📈 Statistiques supplémentaires</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dépenses ce mois</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
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
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Moyenne 6 mois</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {currency(monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length || 0)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Catégories actives</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {categoryExpenses.filter(ce => ce.months.some(m => m.total > 0)).length}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total 6 mois</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
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

      {/* Charts for complete years */}
      {historicalArray.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Graphiques par année</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            {historicalArray
              .filter(({ data }) => data.expenses && data.expenses.length > 0)
              .map(({ year, data }) => {
                const yearMonthlySalary = data.monthlySalary || globalData?.monthlySalary || 0;
                const yearVariableIncomes = data.variableMonthlyIncomes;
                const yearAdditionalIncomes = data.additionalMonthlyIncomes || [];
                
                return (
                  <div key={year} className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Année {year}</h3>
                    <ExpensesPieChart
                      categories={data.categories || []}
                      expenses={data.expenses || []}
                      size={300}
                    />
                    <MonthlyExpensesIncomeChart
                      expenses={data.expenses || []}
                      monthlySalary={yearMonthlySalary}
                      variableMonthlyIncomes={yearVariableIncomes}
                      additionalMonthlyIncomes={yearAdditionalIncomes}
                      year={year}
                      height={300}
                    />
                  </div>
                );
              })}
          </div>
        </div>
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

