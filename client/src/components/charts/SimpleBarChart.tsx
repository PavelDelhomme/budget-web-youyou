import { useMemo } from 'react';
import { currency } from '../../lib/utils';

interface SimpleBarChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  height?: number;
  barColor?: string;
  labelColor?: string;
}

export function SimpleBarChart({
  data,
  height = 300,
  barColor = '#3b82f6',
  labelColor = '#6b7280',
}: SimpleBarChartProps) {
  const maxValue = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.value), 1);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-gray-500 dark:text-gray-400">Aucune donnée à afficher</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex items-end justify-between h-full gap-2">
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
                style={{ minWidth: '40px' }}
              >
                {/* Barre */}
                <div className="w-full flex items-end" style={{ height: 'calc(100% - 60px)' }}>
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${barHeight}%`,
                      minHeight: item.value > 0 ? '4px' : '0',
                      backgroundColor: barColor,
                    }}
                    title={`${item.label}: ${currency(item.value)}`}
                  />
                </div>
                
                {/* Label */}
                <div className="text-xs text-center" style={{ color: labelColor, height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="truncate w-full">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

