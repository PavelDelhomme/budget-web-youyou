import { useMemo } from 'react';
import { YearData } from '../../core/types';
import { currency } from '../../lib/utils';
import { calculateAnnualIncomeFromSalaryHistory } from '../../lib/utils/salaryHistory';

interface AnnualEvolutionChartProps {
  historicalData: Array<{ year: number; data: YearData }>;
  globalData?: {
    monthlySalary?: number;
    temporaryIncomes?: Array<{ amount: number; startDate: string; endDate?: string; duration: string }>;
    salaryHistory?: Array<{ id: string; amount: number; startDate: string; endDate?: string; type: string }>;
  };
}

export function AnnualEvolutionChart({ historicalData, globalData }: AnnualEvolutionChartProps) {
  // Calculate annual income and expenses for each year
  const annualData = useMemo(() => {
    // Filtrer les années invalides (< 2000 ou > 2100)
    const validData = historicalData.filter(({ year }) => year >= 2000 && year <= 2100);
    const sorted = [...validData].sort((a, b) => a.year - b.year);
    
    return sorted.map(({ year, data }) => {
      // Calculate annual income
      // Priorité : revenu spécifique à l'année > revenu global > salaire actif de l'historique
      let monthlySalary = data.monthlySalary;
      if (monthlySalary === undefined || monthlySalary === null || monthlySalary === 0) {
        monthlySalary = globalData?.monthlySalary || 0;
        // Si toujours 0, chercher dans l'historique
        if (monthlySalary === 0 && globalData?.salaryHistory) {
          const activeSalary = getActiveSalaryForYear(globalData.salaryHistory, year);
          if (activeSalary !== null && activeSalary > 0) {
            monthlySalary = activeSalary;
          }
        }
      }
      let annualIncome = monthlySalary * 12;
      
      // Add variable monthly incomes if available
      if (data.variableMonthlyIncomes && data.variableMonthlyIncomes.length === 12) {
        annualIncome = data.variableMonthlyIncomes.reduce((sum, v) => sum + (v || 0), 0);
      }
      
      // Add additional monthly incomes
      if (data.additionalMonthlyIncomes) {
        const additionalIncome = data.additionalMonthlyIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
        annualIncome += additionalIncome;
      }
      
      // Add temporary incomes for this year
      if (globalData?.temporaryIncomes) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        for (const income of globalData.temporaryIncomes) {
          const startDate = new Date(income.startDate);
          const endDate = income.endDate ? new Date(income.endDate) : null;
          
          if (income.duration === 'permanent' && startDate <= yearEnd) {
            if (startDate <= yearStart) {
              annualIncome += income.amount * 12;
            } else {
              const monthsActive = 12 - startDate.getMonth();
              annualIncome += income.amount * monthsActive;
            }
          } else if (income.duration === 'months' && endDate) {
            if (startDate <= yearEnd && endDate >= yearStart) {
              const start = startDate < yearStart ? yearStart : startDate;
              const end = endDate > yearEnd ? yearEnd : endDate;
              const monthsActive = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
              annualIncome += income.amount * Math.max(0, monthsActive);
            }
          } else if (income.duration === 'once' && startDate >= yearStart && startDate <= yearEnd) {
            annualIncome += income.amount;
          }
        }
      }
      
      // Add salary from salaryHistory if monthlySalary is 0 or not set
      // Utiliser les salaires de l'historique seulement si aucun revenu mensuel n'est défini
      if ((!monthlySalary || monthlySalary === 0) && globalData?.salaryHistory) {
        const salaryFromHistory = calculateAnnualIncomeFromSalaryHistory(globalData?.salaryHistory as any, year);
        if (salaryFromHistory > 0) {
          // Si on n'avait pas de revenu mensuel de base, remplacer le revenu annuel
          // Sinon, ajouter au revenu annuel existant
          if (annualIncome === 0 || annualIncome === monthlySalary * 12) {
            annualIncome = salaryFromHistory;
          } else {
            // Ajouter les revenus de l'historique aux revenus existants
            annualIncome += salaryFromHistory;
          }
        }
      }
      
      // Calculate annual expenses
      let annualExpenses = 0;
      
      // Variable expenses (categories)
      if (data.categories) {
        data.categories.forEach(cat => {
          if (cat.monthlyTargets && cat.monthlyTargets.length === 12) {
            annualExpenses += cat.monthlyTargets.reduce((sum, val) => sum + (val || 0), 0);
          } else {
            annualExpenses += cat.target || 0;
          }
        });
      }
      
      // Subscriptions
      if (data.subs) {
        data.subs.forEach(sub => {
          const startMonth = sub.startMonth || 1;
          const endMonth = sub.ongoing ? 12 : (sub.endMonth || 12);
          const months = endMonth >= startMonth ? endMonth - startMonth + 1 : 12 - startMonth + endMonth + 1;
          annualExpenses += (sub.monthly || 0) * months;
        });
      }
      
      // Annual fixed expenses
      if (data.annualFixedExpenses) {
        annualExpenses += data.annualFixedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      }
      
      return {
        year,
        income: annualIncome,
        expenses: annualExpenses,
        savings: annualIncome - annualExpenses,
      };
    });
  }, [historicalData, globalData]);
  
  if (annualData.length === 0) {
    return null;
  }
  
  const maxValue = Math.max(
    ...annualData.map(d => Math.max(d.income, d.expenses)),
    1
  );
  
  const minYear = Math.min(...annualData.map(d => d.year));
  const maxYear = Math.max(...annualData.map(d => d.year));
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 text-gray-900 dark:text-white">
        📈 Évolution des dépenses et revenus par année
      </h3>
      
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <div className="min-w-full">
          <div className="flex items-end gap-2 sm:gap-3 md:gap-4 h-64 sm:h-72 md:h-80">
            {annualData.map((data, idx) => {
              const incomeHeight = maxValue > 0 ? (data.income / maxValue) * 100 : 0;
              const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;
              
              return (
                <div
                  key={data.year}
                  className="flex-1 flex items-end justify-center gap-1 sm:gap-2 min-w-[60px] sm:min-w-[80px]"
                >
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="flex flex-col items-center w-full gap-1">
                      {/* Revenus (barre verte) */}
                      <div
                        className="w-full rounded-t bg-green-500 dark:bg-green-400 hover:bg-green-600 dark:hover:bg-green-500 transition-all duration-300 cursor-pointer relative group"
                        style={{ height: `${Math.max(incomeHeight, 2)}%`, minHeight: '2px' }}
                        title={`${data.year} - Revenus: ${currency(data.income)}`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {currency(data.income)}
                        </div>
                      </div>
                      
                      {/* Dépenses (barre rouge) */}
                      <div
                        className="w-full rounded-t bg-red-500 dark:bg-red-400 hover:bg-red-600 dark:hover:bg-red-500 transition-all duration-300 cursor-pointer relative group"
                        style={{ height: `${Math.max(expenseHeight, 2)}%`, minHeight: '2px' }}
                        title={`${data.year} - Dépenses: ${currency(data.expenses)}`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {currency(data.expenses)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Label année */}
                    <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                      {data.year}
                    </div>
                    
                    {/* Épargne */}
                    <div
                      className={`text-[9px] sm:text-[10px] mt-1 ${
                        data.savings >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {data.savings >= 0 ? '+' : ''}{currency(data.savings)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-400"></div>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Revenus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-400"></div>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Dépenses</span>
        </div>
      </div>
    </div>
  );
}

