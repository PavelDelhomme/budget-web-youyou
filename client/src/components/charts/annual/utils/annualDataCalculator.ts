import { useMemo } from 'react';
import { YearData } from '../../../../core/types';
import { calculateAnnualIncomeFromSalaryHistory, getActiveSalaryForYear } from '../../../../lib/utils/salaryHistory';

interface AnnualDataPoint {
  year: number;
  income: number;
  expenses: number;
  savings: number;
}

interface CalculateAnnualDataParams {
  historicalData: Array<{ year: number; data: YearData }>;
  globalData?: {
    monthlySalary?: number;
    temporaryIncomes?: Array<{ amount: number; startDate: string; endDate?: string; duration: string }>;
    salaryHistory?: Array<{ id: string; amount: number; startDate: string; endDate?: string; type: string }>;
  };
}

export function useAnnualData({ historicalData, globalData }: CalculateAnnualDataParams): AnnualDataPoint[] {
  return useMemo(() => {
    // Filtrer les années invalides (< 2000 ou > 2100)
    const validData = historicalData.filter(({ year }) => year >= 2000 && year <= 2100);
    const sorted = [...validData].sort((a, b) => a.year - b.year);
    
    return sorted.map(({ year, data }) => {
      // Calculate annual income
      let monthlySalary = data.monthlySalary;
      if (monthlySalary === undefined || monthlySalary === null || monthlySalary === 0) {
        monthlySalary = globalData?.monthlySalary || 0;
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
      
      // Add salary from salaryHistory
      if ((!monthlySalary || monthlySalary === 0) && globalData?.salaryHistory) {
        const salaryFromHistory = calculateAnnualIncomeFromSalaryHistory(globalData?.salaryHistory as any, year);
        if (salaryFromHistory > 0) {
          if (annualIncome === 0 || annualIncome === monthlySalary * 12) {
            annualIncome = salaryFromHistory;
          } else {
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
}

export function roundToNiceNumber(value: number): number {
  if (value <= 0) return 1000;
  if (value < 1000) return Math.ceil(value / 100) * 100;
  if (value < 10000) return Math.ceil(value / 1000) * 1000;
  if (value < 100000) return Math.ceil(value / 10000) * 10000;
  return Math.ceil(value / 10000) * 10000 + 10000;
}

