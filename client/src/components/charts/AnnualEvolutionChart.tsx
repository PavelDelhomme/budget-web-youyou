import { useMemo, useState, useEffect } from 'react';
import { YearData } from '../../core/types';
import { currency } from '../../lib/utils';
import { calculateAnnualIncomeFromSalaryHistory, getActiveSalaryForYear } from '../../lib/utils/salaryHistory';

interface AnnualEvolutionChartProps {
  historicalData: Array<{ year: number; data: YearData }>;
  globalData?: {
    monthlySalary?: number;
    temporaryIncomes?: Array<{ amount: number; startDate: string; endDate?: string; duration: string }>;
    salaryHistory?: Array<{ id: string; amount: number; startDate: string; endDate?: string; type: string }>;
  };
  height?: number;
}

export function AnnualEvolutionChart({ historicalData, globalData, height = 400 }: AnnualEvolutionChartProps) {
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
  
  // Calculer maxValue avec arrondi intelligent pour une meilleure échelle
  const rawMaxValue = Math.max(
    ...annualData.map(d => Math.max(d.income, d.expenses)),
    1
  );
  
  // Arrondir intelligemment le maxValue pour une meilleure lisibilité
  const roundToNiceNumber = (value: number): number => {
    if (value <= 0) return 1000;
    if (value < 1000) return Math.ceil(value / 100) * 100;
    if (value < 10000) return Math.ceil(value / 1000) * 1000;
    if (value < 100000) return Math.ceil(value / 10000) * 10000;
    // Pour les valeurs >= 100000 (comme 108000), arrondir à la dizaine de milliers supérieure avec marge
    return Math.ceil(value / 10000) * 10000 + 10000;
  };
  
  const maxValue = roundToNiceNumber(rawMaxValue);

  // Responsive dimensions
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 150);
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
  
  // Calculer la largeur minimale du graphique
  const minChartWidth = isMobile ? Math.max(windowWidth - 80, 600) : isTablet ? 900 : 1200;
  // Calculer la largeur nécessaire pour toutes les années
  const requiredWidth = annualData.length * (barWidth * 2 + spacing);
  const chartWidth = Math.max(requiredWidth, minChartWidth);
  
  // Padding plus important en haut pour les montants au-dessus des barres
  const bottomPadding = isMobile ? 50 : isTablet ? 55 : 60;
  const topPadding = isMobile ? 60 : isTablet ? 60 : 65;
  const leftPadding = isMobile ? 50 : isTablet ? 50 : 55;
  const rightPadding = isMobile ? 20 : isTablet ? 20 : 25;
  const chartHeight = (isMobile ? height - 140 : isTablet ? height - 120 : height - 100);
  const responsiveHeight = isMobile ? Math.max(height + 60, 340) : isTablet ? Math.max(height + 50, 390) : height + 80;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 px-2 sm:px-0">
        📈 Évolution des dépenses et revenus par année
      </h3>
      
      {/* Container avec axe Y fixe et scroll horizontal uniquement sur les barres */}
      <div className="relative w-full" style={{ minHeight: '300px' }}>
        {/* Axe Y fixe (gauche) */}
        <div 
          className="absolute left-0 top-0 bottom-0 z-10 bg-white dark:bg-gray-800"
          style={{ width: leftPadding, paddingTop: topPadding, paddingBottom: bottomPadding }}
        >
          <svg 
            width={leftPadding}
            height={responsiveHeight}
            viewBox={`0 0 ${leftPadding} ${responsiveHeight}`}
            className="block"
            style={{ position: 'sticky', top: 0 }}
          >
            {/* Ligne axe Y */}
            <line
              x1={leftPadding - 1}
              y1={topPadding}
              x2={leftPadding - 1}
              y2={chartHeight + topPadding}
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400 dark:text-gray-500"
            />
            {/* Labels de l'axe Y */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = topPadding + chartHeight * (1 - ratio);
              return (
                <text
                  key={ratio}
                  x={leftPadding - (isMobile ? 5 : 10)}
                  y={y + 4}
                  textAnchor="end"
                  className={`${isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-500 dark:fill-gray-400`}
                >
                  {currency(maxValue * ratio)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Zone scrollable avec les barres */}
        <div 
          className="overflow-x-auto w-full"
          style={{ 
            marginLeft: leftPadding,
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            paddingLeft: '1px'
          }}
        >
          <div className="inline-block" style={{ minWidth: chartWidth + rightPadding }}>
            <svg 
              width={chartWidth + rightPadding}
              height={responsiveHeight}
              viewBox={`0 0 ${chartWidth + rightPadding} ${responsiveHeight}`}
              preserveAspectRatio="xMinYMin meet"
              className="block"
              style={{ 
                minWidth: chartWidth + rightPadding,
                maxWidth: 'none',
                display: 'block'
              }}
            >
              {/* Ligne axe X */}
              <line
                x1={0}
                y1={chartHeight + topPadding}
                x2={chartWidth}
                y2={chartHeight + topPadding}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400 dark:text-gray-500"
              />

              {/* Lignes de grille horizontales */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = topPadding + chartHeight * (1 - ratio);
                return (
                  <line
                    key={ratio}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-gray-200 dark:text-gray-700"
                  />
                );
              })}

              {/* Barres avec montants affichés et tooltip amélioré */}
              {annualData.map((data, index) => {
                const x = index * (barWidth * 2 + spacing);
                const incomeHeight = (data.income / maxValue) * chartHeight;
                const expensesHeight = (data.expenses / maxValue) * chartHeight;
                const incomeY = topPadding + chartHeight - incomeHeight;
                const expensesY = topPadding + chartHeight - expensesHeight;

                return (
                  <g key={data.year}>
                    {/* Income bar */}
                    <g className="group">
                      <rect
                        x={x}
                        y={incomeY}
                        width={barWidth}
                        height={incomeHeight}
                        fill="#10B981"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        rx="2"
                      >
                        <title>
                          {data.year} - Revenus: {currency(data.income)}
                        </title>
                      </rect>
                      
                      {/* Montant au-dessus de la barre de revenus */}
                      {data.income > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={incomeY - 5}
                          textAnchor="middle"
                          className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-semibold fill-green-700 dark:fill-green-300 pointer-events-none`}
                        >
                          {currency(data.income)}
                        </text>
                      )}
                      
                      {/* Tooltip au survol */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <rect
                          x={x + barWidth / 2 - 40}
                          y={incomeY - 30}
                          width={80}
                          height={20}
                          fill="rgba(0, 0, 0, 0.8)"
                          rx="4"
                          className="dark:fill-gray-100"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={incomeY - 15}
                          textAnchor="middle"
                          className="text-[10px] fill-white dark:fill-gray-900 font-semibold"
                        >
                          Revenus: {currency(data.income)}
                        </text>
                      </g>
                    </g>

                    {/* Expenses bar */}
                    <g className="group">
                      <rect
                        x={x + barWidth}
                        y={expensesY}
                        width={barWidth}
                        height={expensesHeight}
                        fill="#EF4444"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        rx="2"
                      >
                        <title>
                          {data.year} - Dépenses: {currency(data.expenses)}
                        </title>
                      </rect>
                      
                      {/* Montant au-dessus de la barre de dépenses */}
                      {data.expenses > 0 && (
                        <text
                          x={x + barWidth + barWidth / 2}
                          y={expensesY - 5}
                          textAnchor="middle"
                          className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-semibold fill-red-700 dark:fill-red-300 pointer-events-none`}
                        >
                          {currency(data.expenses)}
                        </text>
                      )}
                      
                      {/* Tooltip au survol */}
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <rect
                          x={x + barWidth + barWidth / 2 - 40}
                          y={expensesY - 30}
                          width={80}
                          height={20}
                          fill="rgba(0, 0, 0, 0.8)"
                          rx="4"
                          className="dark:fill-gray-100"
                        />
                        <text
                          x={x + barWidth + barWidth / 2}
                          y={expensesY - 15}
                          textAnchor="middle"
                          className="text-[10px] fill-white dark:fill-gray-900 font-semibold"
                        >
                          Dépenses: {currency(data.expenses)}
                        </text>
                      </g>
                    </g>

                    {/* Year label - centré entre les deux barres */}
                    <text
                      x={x + barWidth + barWidth / 2}
                      y={chartHeight + topPadding + (isMobile ? 25 : isTablet ? 30 : 35)}
                      textAnchor="middle"
                      className={`${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'} font-semibold fill-gray-700 dark:fill-gray-300`}
                    >
                      {data.year}
                    </text>
                    
                    {/* Épargne sous l'année */}
                    <text
                      x={x + barWidth + barWidth / 2}
                      y={chartHeight + topPadding + (isMobile ? 40 : isTablet ? 45 : 50)}
                      textAnchor="middle"
                      className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-semibold ${
                        data.savings >= 0
                          ? 'fill-green-600 dark:fill-green-400'
                          : 'fill-red-600 dark:fill-red-400'
                      }`}
                    >
                      {data.savings >= 0 ? '+' : ''}{currency(data.savings)}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <g transform={`translate(${chartWidth - (isMobile ? 100 : 120)}, ${topPadding + (isMobile ? 15 : 20)})`}>
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
      </div>
      
      {/* Indicateur de scroll sur mobile/tablet */}
      {(isMobile || isTablet) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          ← Faites glisser pour voir toutes les années →
        </div>
      )}
    </div>
  );
}
