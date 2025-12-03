import { useMemo, useState, useEffect } from 'react';
import { Expense, MonthlyAdditionalIncome, Category, Subscription, AnnualFixedExpense, TemporaryIncome } from '../../core/types';
import { currency } from '../../lib/utils';

interface MonthlyExpensesIncomeChartProps {
  expenses: Expense[];
  monthlySalary: number;
  variableMonthlyIncomes?: number[];
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[];
  temporaryIncomes?: TemporaryIncome[]; // Revenus temporaires/permanents
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
  temporaryIncomes = [],
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

      // Ajouter les revenus temporaires/permanents pour ce mois
      const monthDate = new Date(year, month - 1, 1); // Premier jour du mois
      const monthEndDate = new Date(year, month, 0); // Dernier jour du mois
      const currentMonthDate = new Date(year, month - 1, 1); // Date complète du mois
      
      for (const tempIncome of temporaryIncomes) {
        const startDate = new Date(tempIncome.startDate);
        const endDate = tempIncome.endDate ? new Date(tempIncome.endDate) : null;
        
        // Revenu permanent : actif à partir de la date de début
        if (tempIncome.duration === 'permanent') {
          // Vérifier si le revenu est actif pour ce mois
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth() + 1;
          
          // Si le revenu a commencé avant ou pendant ce mois de cette année
          if (startYear < year || (startYear === year && startMonth <= month)) {
            monthIncome += tempIncome.amount;
          }
        }
        
        // Revenu temporaire sur plusieurs mois
        if (tempIncome.duration === 'months' && endDate) {
          if (startDate <= monthEndDate && endDate >= monthDate) {
            // Le revenu est actif pendant ce mois
            monthIncome += tempIncome.amount;
          }
        }
        
        // Revenu ponctuel : si dans ce mois exactement
        if (tempIncome.duration === 'once') {
          if (startDate >= monthDate && startDate <= monthEndDate && startDate.getFullYear() === year) {
            monthIncome += tempIncome.amount;
          }
        }
      }

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
  }, [expenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, temporaryIncomes, year, isPrediction, categories, annualFixedExpenses, subs]);

  // Responsive dimensions
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150); // Debounce resize events
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // Barres plus larges pour meilleure lisibilité
  const barWidth = isMobile ? 28 : isTablet ? 32 : 40;
  const spacing = isMobile ? 10 : isTablet ? 12 : 16;
  
  // Calculer la largeur minimale du graphique - plus large sur mobile
  const minChartWidth = isMobile ? Math.max(windowWidth - 80, 600) : isTablet ? 900 : 1600;
  // Calculer la largeur nécessaire pour 12 mois avec les nouvelles barres
  const requiredWidth = 12 * (barWidth * 2 + spacing);
  const chartWidth = Math.max(requiredWidth, minChartWidth);
  // Padding plus important en bas pour les labels des mois
  const bottomPadding = isMobile ? 50 : isTablet ? 55 : 60;
  const topPadding = isMobile ? 45 : isTablet ? 45 : 50;
  const leftPadding = isMobile ? 50 : isTablet ? 50 : 55;
  const rightPadding = isMobile ? 20 : isTablet ? 20 : 25;
  const padding = topPadding; // Pour compatibilité
  const chartHeight = (isMobile ? height - 140 : isTablet ? height - 120 : height - 100);
  const responsiveHeight = isMobile ? Math.max(height + 40, 320) : isTablet ? Math.max(height + 30, 370) : height + 60;
  
  // Largeur totale du SVG (avec padding)
  const svgWidth = chartWidth + leftPadding + rightPadding;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 px-2 sm:px-0">
        {isPrediction ? `Dépenses et revenus prévus par mois (${year})` : `Dépenses et revenus par mois (${year})`}
      </h3>
      {/* Container avec scroll horizontal */}
      <div 
        className="overflow-x-auto w-full -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6" 
        style={{ 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          minHeight: '300px'
        }}
      >
        <div className="inline-block" style={{ minWidth: svgWidth }}>
          <svg 
            width={svgWidth}
            height={responsiveHeight}
            viewBox={`0 0 ${svgWidth} ${responsiveHeight}`}
            preserveAspectRatio="xMinYMin meet"
            className="block"
            style={{ 
              minWidth: svgWidth,
              maxWidth: 'none',
              display: 'block',
              overflow: 'visible'
            }}
          >
          {/* Axes */}
          <line
            x1={leftPadding}
            y1={chartHeight + topPadding}
            x2={chartWidth + leftPadding}
            y2={chartHeight + topPadding}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500"
          />
          <line
            x1={leftPadding}
            y1={topPadding}
            x2={leftPadding}
            y2={chartHeight + topPadding}
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = topPadding + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={chartWidth + leftPadding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="text-gray-200 dark:text-gray-700"
                />
                <text
                  x={leftPadding - (isMobile ? 5 : 10)}
                  y={y + 4}
                  textAnchor="end"
                  className={`${isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-500 dark:fill-gray-400`}
                >
                  {currency(data.maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.monthlyData.map((monthData, index) => {
            const x = leftPadding + index * (barWidth * 2 + spacing);
            const incomeHeight = (monthData.income / data.maxValue) * chartHeight;
            const expensesHeight = (monthData.expenses / data.maxValue) * chartHeight;
            const incomeY = topPadding + chartHeight - incomeHeight;
            const expensesY = topPadding + chartHeight - expensesHeight;

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
                  y={chartHeight + topPadding + (isMobile ? 25 : isTablet ? 30 : 35)}
                  textAnchor="middle"
                  className={`${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'} font-semibold fill-gray-700 dark:fill-gray-300`}
                >
                  {monthData.monthName}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${leftPadding + chartWidth - (isMobile ? 100 : 120)}, ${topPadding + (isMobile ? 15 : 20)})`}>
            <rect x={0} y={0} width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} fill="#10B981" rx="2" />
            <text x={isMobile ? 14 : 18} y={isMobile ? 8 : 10} className={`${isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-700 dark:fill-gray-300`}>
              Revenus
            </text>
            <rect x={isMobile ? 65 : 80} y={0} width={isMobile ? 10 : 12} height={isMobile ? 10 : 12} fill="#EF4444" rx="2" />
            <text x={isMobile ? 79 : 98} y={isMobile ? 8 : 10} className={`${isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-700 dark:fill-gray-300`}>
              Dépenses
            </text>
          </g>
          </svg>
        </div>
      </div>
      {/* Indicateur de scroll sur mobile/tablet */}
      {(isMobile || isTablet) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          ← Faites glisser pour voir tous les mois →
        </div>
      )}
    </div>
  );
}

