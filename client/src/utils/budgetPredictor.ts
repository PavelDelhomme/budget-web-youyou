import { Category, Expense, Subscription, YearData } from '../types';

/**
 * Analyse les années passées et génère des prévisions pour les années futures
 * Simple algorithme interne basé sur les moyennes et tendances
 */

export interface PredictedYearData {
  year: number;
  isPredicted: true;
  categories: Category[];
  subs: Subscription[];
  monthlySalary: number;
  projectedExpenses: number;
  projectedSavings: number;
}

interface HistoricalYearData {
  year: number;
  data: YearData;
}

/**
 * Analyse les données historiques et génère des prévisions
 */
export function generatePredictions(
  historicalYears: HistoricalYearData[],
  futureYears: number[]
): PredictedYearData[] {
  if (historicalYears.length === 0) {
    return [];
  }

  // Calculer les moyennes et tendances
  const avgCategories = calculateAverageCategories(historicalYears);
  const avgSubs = calculateAverageSubscriptions(historicalYears);
  const avgSalary = calculateAverageSalary(historicalYears);
  const avgSpending = calculateAverageSpending(historicalYears);
  
  // Calculer la tendance d'évolution (augmentation/diminution moyenne par an)
  const spendingTrend = calculateTrend(historicalYears.map(h => ({
    year: h.year,
    value: calculateTotalSpending(h.data)
  })));

  // Générer les prévisions pour chaque année future
  return futureYears.map(year => {
    const yearsAhead = year - Math.max(...historicalYears.map(h => h.year));
    const projectedSpending = avgSpending * (1 + spendingTrend * yearsAhead);
    
    // Ajuster les catégories selon la tendance
    const predictedCategories = avgCategories.map(cat => ({
      ...cat,
      target: Math.max(0, cat.target * (1 + spendingTrend * yearsAhead * 0.5))
    }));

    return {
      year,
      isPredicted: true,
      categories: predictedCategories,
      subs: avgSubs.map(sub => ({ ...sub, id: crypto.randomUUID() })),
      monthlySalary: avgSalary * (1 + 0.02 * yearsAhead), // Augmentation moyenne de 2% par an
      projectedExpenses: projectedSpending,
      projectedSavings: avgSalary * 12 * (1 + 0.02 * yearsAhead) - projectedSpending
    };
  });
}

/**
 * Calcule la moyenne des catégories sur les années historiques
 */
function calculateAverageCategories(historicalYears: HistoricalYearData[]): Category[] {
  if (historicalYears.length === 0) return [];
  
  const categoryMap = new Map<string, { total: number; count: number; name: string }>();
  
  historicalYears.forEach(({ data }) => {
    data.categories?.forEach(cat => {
      const existing = categoryMap.get(cat.id) || { total: 0, count: 0, name: cat.name };
      categoryMap.set(cat.id, {
        total: existing.total + cat.target,
        count: existing.count + 1,
        name: cat.name || existing.name
      });
    });
  });
  
  return Array.from(categoryMap.entries()).map(([id, stats]) => ({
    id,
    name: stats.name,
    target: Math.round(stats.total / stats.count)
  }));
}

/**
 * Calcule la moyenne des abonnements sur les années historiques
 */
function calculateAverageSubscriptions(historicalYears: HistoricalYearData[]): Subscription[] {
  if (historicalYears.length === 0) return [];
  
  const subMap = new Map<string, { total: number; count: number; name: string; months: number[] }>();
  
  historicalYears.forEach(({ data }) => {
    data.subs?.forEach(sub => {
      const key = sub.name.toLowerCase();
      const existing = subMap.get(key) || { total: 0, count: 0, name: sub.name, months: [] };
      subMap.set(key, {
        total: existing.total + sub.monthly,
        count: existing.count + 1,
        name: sub.name,
        months: [...existing.months, sub.startMonth, sub.endMonth]
      });
    });
  });
  
  return Array.from(subMap.entries()).map(([key, stats]) => {
    const avgMonthly = Math.round(stats.total / stats.count);
    const months = stats.months.filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b);
    
    return {
      id: key,
      name: stats.name,
      monthly: avgMonthly,
      startMonth: months[0] || 1,
      endMonth: months[months.length - 1] || 12,
      ongoing: true
    };
  });
}

/**
 * Calcule le salaire moyen
 */
function calculateAverageSalary(historicalYears: HistoricalYearData[]): number {
  const salaries = historicalYears
    .map(h => h.data.monthlySalary || 0)
    .filter(s => s > 0);
  
  if (salaries.length === 0) return 0;
  return salaries.reduce((sum, s) => sum + s, 0) / salaries.length;
}

/**
 * Calcule les dépenses moyennes totales
 */
function calculateAverageSpending(historicalYears: HistoricalYearData[]): number {
  return historicalYears.reduce((sum, h) => sum + calculateTotalSpending(h.data), 0) / historicalYears.length;
}

/**
 * Calcule les dépenses totales pour une année
 */
function calculateTotalSpending(data: YearData): number {
  const categoriesTotal = data.categories?.reduce((sum, cat) => sum + (cat.target || 0), 0) || 0;
  const subsTotal = (data.subs?.reduce((sum, sub) => {
    const months = sub.endMonth >= sub.startMonth 
      ? sub.endMonth - sub.startMonth + 1
      : 12 - sub.startMonth + sub.endMonth + 1;
    return sum + (sub.monthly * months);
  }, 0) || 0);
  
  return categoriesTotal + subsTotal;
}

/**
 * Calcule la tendance d'évolution (taux de croissance/décroissance moyen)
 */
function calculateTrend(values: { year: number; value: number }[]): number {
  if (values.length < 2) return 0;
  
  const sorted = values.sort((a, b) => a.year - b.year);
  const trends: number[] = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].value;
    const curr = sorted[i].value;
    if (prev > 0) {
      trends.push((curr - prev) / prev);
    }
  }
  
  return trends.length > 0 
    ? trends.reduce((sum, t) => sum + t, 0) / trends.length
    : 0;
}

/**
 * Identifie les années futures qui n'ont pas encore de données
 */
export function getFutureYears(allYears: number[], currentYear: number): number[] {
  const maxHistoricalYear = Math.max(...allYears);
  const futureYears: number[] = [];
  
  // Générer les 3 prochaines années après la dernière année connue
  for (let i = 1; i <= 3; i++) {
    const futureYear = maxHistoricalYear + i;
    if (!allYears.includes(futureYear) && futureYear >= currentYear) {
      futureYears.push(futureYear);
    }
  }
  
  return futureYears;
}

/**
 * Identifie les années passées avec des données complètes
 */
export function getHistoricalYears(allYears: number[], currentYear: number): number[] {
  return allYears.filter(y => y < currentYear);
}

