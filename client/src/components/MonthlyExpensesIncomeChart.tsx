import React, { useMemo } from 'react';
import { Expense, MonthlyAdditionalIncome, Category, Subscription, AnnualFixedExpense } from '../types';
import { currency, parseAmount, today } from '../utils';

interface MonthlyExpensesIncomeChartProps {
  expenses: Expense[];
  monthlySalary: number;
  variableMonthlyIncomes?: number[];
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[];
  year: number;
  height?: number;
  isPrediction?: boolean;
  categories?: Category[];
  annualFixedExpenses?: AnnualFixedExpense[];
  subs?: Subscription[];
}

const MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export function MonthlyExpensesIncomeChart({
  expenses,
  monthlySalary,
  variableMonthlyIncomes,
  additionalMonthlyIncomes = [],
  year,
  height = 300,
  isPrediction = false,
  categories = [],
  annualFixedExpenses = [],
  subs = [],
}: MonthlyExpensesIncomeChartProps) {
  const data = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      
      let monthExpenses = 0;
      
      if (isPrediction) {
        // Pour les prédictions, calculer les dépenses projetées par mois
        // Dépenses variables : budgets mensuels des catégories
        categories.forEach(cat => {
          if (cat.monthlyTargets && cat.monthlyTargets.length === 12) {
            monthExpenses += cat.monthlyTargets[month - 1] || 0;
          } else if (cat.target) {
            monthExpenses += cat.target / 12;
          }
        });
        
        // Abonnements pour ce mois
        subs.forEach(sub => {
          if (sub.ongoing || (sub.startMonth <= month && sub.endMonth >= month)) {
            monthExpenses += sub.monthly || 0;
          }
        });
        
        // Dépenses fixes annuelles pour ce mois
        annualFixedExpenses
          .filter(exp => exp.month === month)
          .forEach(exp => {
            monthExpenses += exp.amount || 0;
          });
      } else {
        // Pour les années réelles, utiliser les dépenses réelles
        monthExpenses = expenses
          .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year;
          })
          .reduce((sum, e) => sum + (e.share?.yourAmount || e.amount || 0), 0);
      }

      // Calculer le revenu pour ce mois
      let monthIncome = variableMonthlyIncomes && variableMonthlyIncomes.length === 12
        ? variableMonthlyIncomes[index]
        : monthlySalary;

      // Ajouter les revenus supplémentaires pour ce mois
      const additionalForMonth = additionalMonthlyIncomes
        .filter(inc => inc.month === month)
        .reduce((sum, inc) => sum + inc.amount, 0);

      monthIncome += additionalForMonth;

      return {
        month,
        monthName: MONTH_NAMES[index],
        expenses: monthExpenses,
        income: monthIncome,
      };
    });

    const maxValue = Math.max(
      ...monthlyData.map(d => Math.max(d.expenses, d.income)),
      1
    );

    return { monthlyData, maxValue };
  }, [expenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, year, isPrediction, categories, annualFixedExpenses, subs]);

  const barWidth = 20;
  const spacing = 8;
  const chartWidth = 12 * (barWidth * 2 + spacing);
  const chartHeight = height - 60;
  const padding = 40;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isPrediction ? `Dépenses et revenus prévus par mois (${year})` : `Dépenses et revenus par mois (${year})`}
      </h3>
      <div className="overflow-x-auto">
        <svg width={Math.max(chartWidth + padding * 2, 800)} height={height}>
          {/* Axes */}
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padding + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth + padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-gray-200 dark:text-gray-700"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {currency(data.maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.monthlyData.map((monthData, index) => {
            const x = padding + index * (barWidth * 2 + spacing);
            const incomeHeight = (monthData.income / data.maxValue) * chartHeight;
            const expensesHeight = (monthData.expenses / data.maxValue) * chartHeight;
            const incomeY = padding + chartHeight - incomeHeight;
            const expensesY = padding + chartHeight - expensesHeight;

            return (
              <g key={monthData.month}>
                {/* Income bar */}
                <rect
                  x={x}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  fill="#10B981"
                  className="hover:opacity-80 transition-opacity"
                  rx="2"
                >
                  <title>
                    Revenus {monthData.monthName}: {currency(monthData.income)}
                  </title>
                </rect>

                {/* Expenses bar */}
                <rect
                  x={x + barWidth}
                  y={expensesY}
                  width={barWidth}
                  height={expensesHeight}
                  fill="#EF4444"
                  className="hover:opacity-80 transition-opacity"
                  rx="2"
                >
                  <title>
                    Dépenses {monthData.monthName}: {currency(monthData.expenses)}
                  </title>
                </rect>

                {/* Month label */}
                <text
                  x={x + barWidth}
                  y={chartHeight + padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {monthData.monthName}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${padding + chartWidth - 120}, ${padding + 20})`}>
            <rect x={0} y={0} width={12} height={12} fill="#10B981" rx="2" />
            <text x={18} y={10} className="text-xs fill-gray-700 dark:fill-gray-300">
              Revenus
            </text>
            <rect x={80} y={0} width={12} height={12} fill="#EF4444" rx="2" />
            <text x={98} y={10} className="text-xs fill-gray-700 dark:fill-gray-300">
              Dépenses
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

