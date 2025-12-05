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
import { Category } from '../../core/types';
import { currency } from '../../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CategoryEvolutionChartProps {
  categoryData: {
    category: Category;
    months: Array<{ month: string; total: number }>;
  };
  height?: number;
}

export function CategoryEvolutionChart({
  categoryData,
  height = 200,
}: CategoryEvolutionChartProps) {
  const { chartData, maxYAxis } = useMemo(() => {
    const labels = categoryData.months.map(m => m.month.substring(0, 3));
    const values = categoryData.months.map(m => m.total);

    const maxValue = Math.max(...values, 1);
    const roundToNiceNumber = (value: number): number => {
      if (value <= 0) return 1000;
      if (value < 1000) return Math.ceil(value / 100) * 100;
      if (value < 10000) return Math.ceil(value / 1000) * 1000;
      if (value < 100000) return Math.ceil(value / 10000) * 10000;
      return Math.ceil(value / 10000) * 10000 + 10000;
    };
    const maxYAxis = roundToNiceNumber(maxValue);

    return {
      chartData: {
        labels,
        datasets: [
          {
            label: categoryData.category.name,
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      maxYAxis,
    };
  }, [categoryData]);

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            return `${currency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxYAxis,
        ticks: {
          callback: function(value) {
            return currency(Number(value));
          },
          color: '#6b7280',
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  }), [maxYAxis]);

  // Dark mode support
  const isDark = document.documentElement.classList.contains('dark');
  
  const darkModeOptions: ChartOptions<'bar'> = useMemo(() => ({
    ...options,
    plugins: {
      ...options.plugins,
      tooltip: {
        ...options.plugins?.tooltip,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
      },
    },
    scales: {
      ...options.scales,
      y: {
        ...options.scales?.y,
        ticks: {
          ...options.scales?.y?.ticks,
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      x: {
        ...options.scales?.x,
        ticks: {
          ...options.scales?.x?.ticks,
          color: '#9ca3af',
        },
      },
    },
  }), [options]);

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Bar
        data={chartData}
        options={isDark ? darkModeOptions : options}
      />
    </div>
  );
}

