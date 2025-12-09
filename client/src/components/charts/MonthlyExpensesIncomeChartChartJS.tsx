import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Expense, AnnualFixedExpense, Subscription, MonthlyAdditionalIncome, MonthlyIncomeSource } from '../../core/types';
import { currency } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyExpensesIncomeChartChartJSProps {
  expenses: Expense[];
  monthlySalary: number;
  variableMonthlyIncomes?: number[];
  additionalMonthlyIncomes?: MonthlyAdditionalIncome[];
  temporaryIncomes?: Array<{
    amount: number;
    startDate: string;
    endDate?: string;
    duration: 'once' | 'temporary' | 'permanent';
  }>;
  salaryHistory?: Array<{
    amount: number;
    startDate: string;
    endDate?: string | null;
  }>;
  year: number;
  height?: number;
  isPrediction?: boolean;
  categories?: Array<{ monthlyTargets?: number[]; target?: number }>;
  annualFixedExpenses?: AnnualFixedExpense[];
  subs?: Subscription[];
  incomeColor?: string;
  expenseColor?: string;
  variant?: string;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MonthlyExpensesIncomeChartChartJS({
  expenses,
  monthlySalary,
  variableMonthlyIncomes,
  additionalMonthlyIncomes = [],
  temporaryIncomes = [],
  salaryHistory = [],
  year,
  height = 400,
  isPrediction = false,
  categories = [],
  annualFixedExpenses = [],
  subs = [],
  incomeColor = '#10B981',
  expenseColor = '#EF4444',
  variant,
}: MonthlyExpensesIncomeChartChartJSProps) {
  const { chartData, maxValue } = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      
      let monthExpenses = 0;
      
      if (isPrediction) {
        // Pour les prédictions, calculer les dépenses projetées par mois
        categories.forEach(cat => {
          if (cat.monthlyTargets && cat.monthlyTargets.length === 12) {
            monthExpenses += cat.monthlyTargets[month - 1] || 0;
          } else if (cat.target) {
            monthExpenses += cat.target / 12;
          }
        });
        
        subs.forEach(sub => {
          if (sub.ongoing || (sub.startMonth <= month && sub.endMonth >= month)) {
            monthExpenses += sub.monthly || 0;
          }
        });
        
        annualFixedExpenses
          .filter(exp => exp.month === month)
          .forEach(exp => {
            monthExpenses += exp.amount || 0;
          });
      } else {
        monthExpenses = expenses
          .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year;
          })
          .reduce((sum, e) => sum + (e.share?.yourAmount || e.amount || 0), 0);
      }

      // Calculer le revenu pour ce mois
      let monthIncome = 0;
      
      if (variableMonthlyIncomes && variableMonthlyIncomes.length === 12) {
        monthIncome = variableMonthlyIncomes[index];
      } else {
        if (salaryHistory && salaryHistory.length > 0) {
          const monthDate = new Date(year, month - 1, 1);
          const monthEndDate = new Date(year, month, 0);
          
          const sortedSalaries = [...salaryHistory].sort((a, b) => {
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
          
          for (const salary of sortedSalaries) {
            const startDate = new Date(salary.startDate);
            const endDate = salary.endDate ? new Date(salary.endDate) : null;
            
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth() + 1;
            const endYear = endDate ? endDate.getFullYear() : null;
            const endMonth = endDate ? endDate.getMonth() + 1 : null;
            
            const startedBeforeOrDuring = startYear < year || (startYear === year && startMonth <= month);
            const notEndedYet = !endDate || (endYear && (endYear > year || (endYear === year && endMonth >= month)));
            
            if (startedBeforeOrDuring && notEndedYet) {
              monthIncome = salary.amount;
              break;
            }
          }
        } else {
          monthIncome = monthlySalary;
        }
      }

      const additionalForMonth = additionalMonthlyIncomes
        .filter(inc => inc.month === month)
        .reduce((sum, inc) => sum + inc.amount, 0);

      monthIncome += additionalForMonth;

      const monthDate = new Date(year, month - 1, 1);
      const monthEndDate = new Date(year, month, 0);
      
      for (const tempIncome of temporaryIncomes) {
        const startDate = new Date(tempIncome.startDate);
        const endDate = tempIncome.endDate ? new Date(tempIncome.endDate) : null;
        
        if (tempIncome.duration === 'permanent') {
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth() + 1;
          
          if (startYear < year || (startYear === year && startMonth <= month)) {
            monthIncome += tempIncome.amount;
          }
        }
        
        if (tempIncome.duration === 'temporary') {
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth() + 1;
          const endYear = endDate ? endDate.getFullYear() : null;
          const endMonth = endDate ? endDate.getMonth() + 1 : null;
          
          const isActive = (startYear < year || (startYear === year && startMonth <= month)) &&
                          (!endDate || (endYear && (endYear > year || (endYear === year && endMonth >= month))));
          
          if (isActive) {
            monthIncome += tempIncome.amount;
          }
        }
        
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
    
    const roundToNiceNumber = (value: number): number => {
      if (value <= 0) return 1000;
      if (value < 1000) return Math.ceil(value / 100) * 100;
      if (value < 10000) return Math.ceil(value / 1000) * 1000;
      if (value < 100000) return Math.ceil(value / 10000) * 10000;
      return Math.ceil(value / 10000) * 10000 + 10000;
    };
    
    const maxValue = roundToNiceNumber(rawMaxValue);

    return {
      chartData: {
        labels: monthlyData.map(d => d.monthName),
        datasets: [
          {
            label: 'Revenus',
            data: monthlyData.map(d => d.income),
            backgroundColor: incomeColor,
            borderColor: incomeColor,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Dépenses',
            data: monthlyData.map(d => d.expenses),
            backgroundColor: expenseColor,
            borderColor: expenseColor,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      maxValue,
    };
  }, [expenses, monthlySalary, variableMonthlyIncomes, additionalMonthlyIncomes, temporaryIncomes, salaryHistory, year, isPrediction, categories, annualFixedExpenses, subs, incomeColor, expenseColor]);

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 0, // Pas de padding à droite pour éviter l'espace après décembre
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        position: 'nearest',
        // Configuration pour que Chart.js adapte automatiquement la position
        // Le tooltip s'affichera à gauche si pas de place à droite
        xAlign: 'auto', // Auto : Chart.js choisit automatiquement gauche/droite selon l'espace
        yAlign: 'auto', // Auto : Chart.js choisit automatiquement haut/bas selon l'espace
        displayColors: true,
        // Mode 'index' pour afficher toutes les valeurs du mois au survol
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${currency(context.parsed.y)}`;
          },
        },
      },
      title: {
        display: !!variant,
        text: variant,
        font: {
          size: 18,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false, // Afficher tous les labels
        },
        // offset et bounds retirés pour permettre le scroll horizontal sur mobile
      },
      y: {
        beginAtZero: true, // Configuration exacte Graphique 1
        min: 0, // Force explicitement le minimum à 0
        grace: 0, // Pas de marge de grâce
        afterDataLimits: (scale: any) => {
          // Forcer explicitement le minimum à 0
          scale.min = 0;
        },
        ticks: {
          callback: function(value) {
            return currency(Number(value));
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }), [maxValue, variant]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4 sm:p-5 md:p-6 w-full min-w-0 overflow-hidden">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5">
        {variant ? `${variant} (Chart.js)` : `${isPrediction ? `Dépenses et revenus prévus par mois (${year})` : `Dépenses et revenus par mois (${year})`} (Chart.js)`}
      </h3>
      <div className="w-full min-w-0 overflow-x-auto" style={{ maxHeight: `${height + 100}px` }}>
        <div style={{ minWidth: '800px', height: `${height}px`, width: '100%' }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        📊 Faites glisser horizontalement pour voir tous les mois →
      </div>
    </div>
  );
}

