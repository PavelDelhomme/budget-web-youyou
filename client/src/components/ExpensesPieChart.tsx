import React, { useMemo } from 'react';
import { Category, Expense } from '../types';
import { currency, parseAmount } from '../utils';

interface ExpensesPieChartProps {
  categories: Category[];
  expenses: Expense[];
  size?: number;
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

export function ExpensesPieChart({ categories, expenses, size = 300 }: ExpensesPieChartProps) {
  const data = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    
    expenses.forEach(exp => {
      const amount = exp.share?.yourAmount || exp.amount || 0;
      const current = categoryTotals.get(exp.categoryId) || 0;
      categoryTotals.set(exp.categoryId, current + amount);
    });

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
        <p className="text-gray-500 dark:text-gray-400">Aucune dépense à afficher</p>
      </div>
    );
  }

  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  const getPath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Répartition des dépenses par catégorie
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg width={size} height={size} className="flex-shrink-0">
          {data.slices.map((slice, index) => (
            <path
              key={slice.categoryId}
              d={getPath(slice.startAngle, slice.endAngle)}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-80 transition-opacity cursor-pointer"
              title={`${slice.categoryName}: ${currency(slice.total)} (${slice.percentage.toFixed(1)}%)`}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-2">
          {data.slices.map((slice, index) => (
            <div
              key={slice.categoryId}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 text-sm text-gray-900 dark:text-white">
                {slice.categoryName}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {currency(slice.total)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {currency(data.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

