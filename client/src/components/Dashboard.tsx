import React from 'react';
import { UserGlobalData, YearData } from '../types';
import { currency } from '../utils';
import { BudgetSuggestions } from './BudgetSuggestions';
import { analyzeBudget } from '../utils/budgetAnalyzer';

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
  const personTransactions = globalData.personTransactions || [];
  
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 Dashboard Budget</h1>
        <p className="text-blue-100">Vue d'ensemble de votre situation financière</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Actifs totaux</div>
          <div className="text-2xl font-bold text-green-600">{currency(totalAssets)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Comptes: {currency(totalBankBalance)} + Investissements: {currency(totalInvestments)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Revenus annuels {currentYear}</div>
          <div className="text-2xl font-bold text-blue-600">{currency(annualIncome)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {currency(monthlySalary)}/mois {additionalIncome > 0 && `+ ${currency(additionalIncome)} supp.`}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Dépenses annuelles {currentYear}</div>
          <div className="text-2xl font-bold text-red-600">{currency(annualExpenses)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Budget prévu
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Épargne projetée</div>
          <div className={`text-2xl font-bold ${projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currency(projectedSavings)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Taux d'épargne: {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Trends and Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">📈 Tendances</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Dépenses</span>
                <span className={`text-sm font-semibold ${expenseTrend.trend < 0 ? 'text-green-600' : expenseTrend.trend > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {expenseTrend.trend > 0 ? '↑' : expenseTrend.trend < 0 ? '↓' : '→'} {Math.abs(expenseTrend.trend).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500">{expenseTrend.message}</div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Revenus</span>
                <span className={`text-sm font-semibold ${incomeTrend.trend > 0 ? 'text-green-600' : incomeTrend.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {incomeTrend.trend > 0 ? '↑' : incomeTrend.trend < 0 ? '↓' : '→'} {Math.abs(incomeTrend.trend).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500">{incomeTrend.message}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">🎯 Objectifs d'épargne</h3>
          <div className="space-y-3">
            {savingsGoals.length > 0 ? savingsGoals.map((goal) => (
              <div key={goal.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <span className="text-sm text-gray-600">
                    {currency(goal.currentAmount)} / {currency(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${goal.type === 'minimum' ? 'bg-blue-600' : goal.type === 'precaution' ? 'bg-yellow-600' : 'bg-green-600'}`}
                    style={{ width: `${goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Aucun objectif défini</p>}
            {savingsGoals.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold">
                  Total: {currency(totalSavingsGoals)} / {currency(totalSavingsTarget)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      {predictedYears.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 border border-purple-200">
          <h3 className="font-semibold text-lg mb-4">🤖 Prévisions IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictedYears.map((prediction) => (
              <div key={prediction.year} className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{prediction.year}</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">IA</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-gray-600">Revenus projetés:</div>
                  <div className="font-semibold">{currency(prediction.monthlySalary * 12)}</div>
                  <div className="text-gray-600">Dépenses projetées:</div>
                  <div className="font-semibold">{currency(prediction.projectedExpenses)}</div>
                  <div className="text-gray-600">Épargne projetée:</div>
                  <div className={`font-semibold ${prediction.projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currency(prediction.projectedSavings)}
                  </div>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">💳 Transactions partagées</h3>
          <div className="text-sm text-gray-600">
            {personTransactions.length} transaction(s) enregistrée(s)
          </div>
          {personTransactions.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">Aucune transaction partagée pour le moment</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">📅 Années suivies</h3>
          <div className="text-2xl font-bold text-blue-600">{years.length}</div>
          <div className="text-xs text-gray-500 mt-1">années avec données</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">💼 Investissements actifs</h3>
          <div className="text-2xl font-bold text-green-600">{investments.length}</div>
          <div className="text-xs text-gray-500 mt-1">
            Contribution mensuelle: {currency(investments.reduce((sum, inv) => sum + inv.monthlyContribution, 0))}
          </div>
        </div>
      </div>
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

