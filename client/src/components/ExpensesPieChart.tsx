import { useMemo, useState, useEffect } from 'react';
import { Category, Expense } from '../types';
import { currency } from '../utils';

interface ExpensesPieChartProps {
  categories: Category[];
  expenses: Expense[];
  size?: number;
  isPrediction?: boolean;
}

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

export function ExpensesPieChart({ categories, expenses, size = 300, isPrediction = false }: ExpensesPieChartProps) {
  const data = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    if (isPrediction) {
      // Pour les prédictions, utiliser les budgets des catégories
      categories.forEach(cat => {
        // Utiliser monthlyTargets si disponible, sinon target/12
        const annualTarget = cat.monthlyTargets && cat.monthlyTargets.length === 12
          ? cat.monthlyTargets.reduce((sum, val) => sum + val, 0)
          : (cat.target || 0);
        if (annualTarget > 0) {
          categoryTotals.set(cat.id, annualTarget);
        }
      });
    } else {
      // Pour les années réelles, utiliser les dépenses réelles
      expenses.forEach(exp => {
        const amount = exp.share?.yourAmount || exp.amount || 0;
        const current = categoryTotals.get(exp.categoryId) || 0;
        categoryTotals.set(exp.categoryId, current + amount);
      });
    }

    const totals = Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Inconnu',
          total,
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const total = totals.reduce((sum, item) => sum + item.total, 0);

    let currentAngle = -90; // Start at top
    const slices = totals.map((item, index) => {
      const percentage = (item.total / total) * 100;
      const angle = (item.total / total) * 360;
      
      const slice = {
        ...item,
        percentage,
        angle,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: COLORS[index % COLORS.length],
      };
      
      currentAngle += angle;
      return slice;
    });

    return { slices, total };
  }, [categories, expenses]);

  if (data.slices.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          {isPrediction ? 'Aucun budget à afficher' : 'Aucune dépense à afficher'}
        </p>
      </div>
    );
  }


  // Responsive size calculation
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
  
  const responsiveSize = useMemo(() => {
    if (windowWidth < 640) {
      return Math.min(280, windowWidth - 40);
    } else if (windowWidth < 1024) {
      return Math.min(350, windowWidth - 80);
    }
    return size;
  }, [windowWidth, size]);
  
  const chartRadius = responsiveSize / 2 - 10;
  const chartCenterX = responsiveSize / 2;
  const chartCenterY = responsiveSize / 2;

  const getResponsivePath = useMemo(() => (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = chartCenterX + chartRadius * Math.cos(startRad);
    const y1 = chartCenterY + chartRadius * Math.sin(startRad);
    const x2 = chartCenterX + chartRadius * Math.cos(endRad);
    const y2 = chartCenterY + chartRadius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${chartCenterX} ${chartCenterY} L ${x1} ${y1} A ${chartRadius} ${chartRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }, [chartCenterX, chartCenterY, chartRadius]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2 sm:px-0">
        {isPrediction ? 'Répartition des budgets par catégorie (prévu)' : 'Répartition des dépenses par catégorie'}
      </h3>
      <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
        <div className="w-full lg:w-auto flex justify-center">
          <svg 
            width={responsiveSize} 
            height={responsiveSize} 
            viewBox={`0 0 ${responsiveSize} ${responsiveSize}`}
            className="w-full max-w-full h-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {data.slices.map((slice) => (
              <path
                key={slice.categoryId}
                d={getResponsivePath(slice.startAngle, slice.endAngle)}
                fill={slice.color}
                stroke="white"
                strokeWidth={2}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                data-title={`${slice.categoryName}: ${currency(slice.total)} (${slice.percentage.toFixed(1)}%)`}
              />
            ))}
          </svg>
        </div>
        <div className="flex-1 w-full space-y-2">
          {data.slices.map((slice) => (
            <div
              key={slice.categoryId}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                {slice.categoryName}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap ml-2">
                {currency(slice.total)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-1">
                ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                {currency(data.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

