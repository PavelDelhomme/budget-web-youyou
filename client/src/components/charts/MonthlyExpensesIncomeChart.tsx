import { useMemo, useState, useEffect } from 'react';
import { Expense, MonthlyAdditionalIncome, Category, Subscription, AnnualFixedExpense, TemporaryIncome, SalaryHistory } from '../../core/types';
import { currency } from '../../lib/utils';

interface MonthlyExpensesIncomeChartProps {
  expenses: Expense[];
  monthlySalary: number;
  variableMonthlyIncomes?: number[];
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[];
  temporaryIncomes?: TemporaryIncome[]; // Revenus temporaires/permanents
  salaryHistory?: SalaryHistory[]; // Historique des salaires pour calculer le revenu mensuel en fonction des dates
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
  salaryHistory = [],
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
      let monthIncome = 0;
      
      // Si variableMonthlyIncomes est défini, l'utiliser en priorité
      if (variableMonthlyIncomes && variableMonthlyIncomes.length === 12) {
        monthIncome = variableMonthlyIncomes[index];
      } else {
        // Sinon, utiliser salaryHistory si disponible pour calculer le revenu mensuel en fonction des dates
        if (salaryHistory && salaryHistory.length > 0) {
          const monthDate = new Date(year, month - 1, 1); // Premier jour du mois
          const monthEndDate = new Date(year, month, 0); // Dernier jour du mois
          
          // Trouver le salaire actif pour ce mois
          // Trier les salaires par date de début (du plus récent au plus ancien) pour prendre le salaire actuel
          const sortedSalaries = [...salaryHistory].sort((a, b) => {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
          
          for (const salary of sortedSalaries) {
            const startDate = new Date(salary.startDate);
            const endDate = salary.endDate ? new Date(salary.endDate) : null;
            
            // Vérifier si ce salaire est actif pendant ce mois
            // Le salaire est actif si :
            // - Il a commencé avant ou pendant ce mois
            // - Il n'a pas de date de fin OU sa date de fin est après ou pendant ce mois
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth() + 1;
            const endYear = endDate ? endDate.getFullYear() : null;
            const endMonth = endDate ? endDate.getMonth() + 1 : null;
            
            // Vérifier si le salaire a commencé avant ou pendant ce mois
            const startedBeforeOrDuring = startYear < year || (startYear === year && startMonth <= month);
            
            // Vérifier si le salaire n'a pas encore fini (pas de date de fin OU date de fin après ce mois)
            const notEndedYet = !endDate || (endYear && (endYear > year || (endYear === year && endMonth >= month)));
            
            if (startedBeforeOrDuring && notEndedYet) {
              // Ce salaire est actif pendant ce mois
              monthIncome = salary.amount;
              break; // Prendre le premier salaire actif trouvé (le plus récent)
            }
          }
          
          // Si aucun salaire dans l'historique n'est actif pour ce mois, ne pas utiliser monthlySalary comme fallback
          // Laisser monthIncome à 0 pour ce mois
        } else {
          // Pas d'historique, utiliser monthlySalary
          monthIncome = monthlySalary;
        }
      }

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

    const rawMaxValue = Math.max(
      ...monthlyData.map(d => Math.max(d.expenses, d.income)),
      1
    );
    
    // Arrondir intelligemment le maxValue pour une échelle cohérente
    const roundToNiceNumber = (value: number): number => {
      if (value <= 0) return 1000;
      if (value < 1000) return Math.ceil(value / 100) * 100;
      if (value < 10000) return Math.ceil(value / 1000) * 1000;
      if (value < 100000) return Math.ceil(value / 10000) * 10000;
      // Pour les valeurs >= 100000, arrondir à la dizaine de milliers supérieure avec marge
      return Math.ceil(value / 10000) * 10000 + 10000;
    };
    
    const maxValue = roundToNiceNumber(rawMaxValue);

    return { monthlyData, maxValue };
  }, [expenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, temporaryIncomes, salaryHistory, year, isPrediction, categories, annualFixedExpenses, subs]);

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
  // Padding plus important en haut pour les montants au-dessus des barres
  const bottomPadding = isMobile ? 50 : isTablet ? 55 : 60; // Espace pour les labels des mois sous l'axe X
  const topPadding = isMobile ? 60 : isTablet ? 60 : 65; // Augmenté pour laisser place aux montants
  const leftPadding = isMobile ? 50 : isTablet ? 50 : 55;
  const rightPadding = isMobile ? 20 : isTablet ? 20 : 25;
  const padding = topPadding; // Pour compatibilité
  const chartHeight = (isMobile ? height - 140 : isTablet ? height - 120 : height - 100);
  const responsiveHeight = isMobile ? Math.max(height + 60, 340) : isTablet ? Math.max(height + 50, 390) : height + 80;
  
  // Largeur totale du SVG (avec padding)
  const svgWidth = chartWidth + leftPadding + rightPadding;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 px-2 sm:px-0">
        {isPrediction ? `Dépenses et revenus prévus par mois (${year})` : `Dépenses et revenus par mois (${year})`}
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
              // Pour le label 0,00€, l'aligner exactement avec l'axe X (sans décalage)
              const labelY = ratio === 0 ? y : y + 4;
              return (
                <text
                  key={ratio}
                  x={leftPadding - (isMobile ? 5 : 10)}
                  y={labelY}
                  textAnchor="end"
                  className={`${isMobile ? 'text-[10px]' : 'text-xs'} fill-gray-500 dark:fill-gray-400`}
                  dominantBaseline={ratio === 0 ? 'middle' : 'auto'}
                >
                  {currency(data.maxValue * ratio)}
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
            paddingLeft: '1px' // Pour l'alignement avec l'axe Y
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
              {/* Ligne axe X (niveau 0,00€) - alignée exactement avec le 0 de l'axe Y */}
              <line
                x1={0}
                y1={topPadding + chartHeight}
                x2={chartWidth}
                y2={topPadding + chartHeight}
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
              {data.monthlyData.map((monthData, index) => {
                const x = index * (barWidth * 2 + spacing);
                const incomeHeight = (monthData.income / data.maxValue) * chartHeight;
                const expensesHeight = (monthData.expenses / data.maxValue) * chartHeight;
                const incomeY = topPadding + chartHeight - incomeHeight;
                const expensesY = topPadding + chartHeight - expensesHeight;

                return (
                  <g key={monthData.month}>
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
                          {monthData.monthName} - Revenus: {currency(monthData.income)}
                        </title>
                      </rect>
                      
                      {/* Montant au-dessus de la barre de revenus */}
                      {monthData.income > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={incomeY - 5}
                          textAnchor="middle"
                          className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-semibold fill-green-700 dark:fill-green-300 pointer-events-none`}
                        >
                          {currency(monthData.income)}
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
                          Revenus: {currency(monthData.income)}
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
                          {monthData.monthName} - Dépenses: {currency(monthData.expenses)}
                        </title>
                      </rect>
                      
                      {/* Montant au-dessus de la barre de dépenses */}
                      {monthData.expenses > 0 && (
                        <text
                          x={x + barWidth + barWidth / 2}
                          y={expensesY - 5}
                          textAnchor="middle"
                          className={`${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'} font-semibold fill-red-700 dark:fill-red-300 pointer-events-none`}
                        >
                          {currency(monthData.expenses)}
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
                          Dépenses: {currency(monthData.expenses)}
                        </text>
                      </g>
                    </g>

                    {/* Month label - centré entre les deux barres, aligné juste sous l'axe X (niveau 0) */}
                    <text
                      x={x + barWidth + barWidth / 2}
                      y={topPadding + chartHeight + (isMobile ? 8 : 10)}
                      textAnchor="middle"
                      className={`${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'} font-semibold fill-gray-700 dark:fill-gray-300`}
                      dominantBaseline="hanging"
                    >
                      {monthData.monthName}
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
          ← Faites glisser pour voir tous les mois →
        </div>
      )}
    </div>
  );
}

