import { BudgetSuggestion, YearData } from '../types';

/**
 * Analyse le budget et génère des suggestions d'amélioration
 */
export function analyzeBudget(
  currentYearData: YearData,
  historicalData: YearData[]
): BudgetSuggestion[] {
  const suggestions: BudgetSuggestion[] = [];

  if (historicalData.length === 0) {
    return suggestions;
  }

  // Analyser les catégories
  const avgSpendingByCategory = calculateAverageSpendingByCategory(historicalData);
  const currentSpendingByCategory = calculateCurrentSpendingByCategory(currentYearData);

  currentYearData.categories.forEach((cat) => {
    const avgSpent = avgSpendingByCategory.get(cat.id) || 0;
    const currentTarget = cat.target;
    const currentSpent = currentSpendingByCategory.get(cat.id) || 0;

    // Suggestion si la cible est beaucoup plus élevée que les dépenses moyennes
    if (avgSpent > 0 && currentTarget > avgSpent * 1.5) {
      const suggested = Math.round(avgSpent * 1.2); // 20% au-dessus de la moyenne
      suggestions.push({
        id: `cat-${cat.id}-reduce`,
        type: 'reduce',
        category: cat.name,
        currentValue: currentTarget,
        suggestedValue: suggested,
        reason: `Vos dépenses réelles sont en moyenne de ${avgSpent.toFixed(0)}€, mais votre cible est de ${currentTarget}€. Vous pourriez réduire cette cible.`,
        priority: currentTarget > avgSpent * 2 ? 'high' : 'medium',
      });
    }

    // Suggestion si les dépenses réelles dépassent souvent la cible
    if (avgSpent > currentTarget * 1.1) {
      suggestions.push({
        id: `cat-${cat.id}-increase`,
        type: 'increase',
        category: cat.name,
        currentValue: currentTarget,
        suggestedValue: Math.round(avgSpent * 1.1),
        reason: `Vos dépenses réelles (${avgSpent.toFixed(0)}€) dépassent souvent votre cible. Augmenter la cible éviterait les dépassements.`,
        priority: 'medium',
      });
    }

    // Identifier les catégories où on dépense peu mais on a une grosse cible
    if (currentSpent < currentTarget * 0.5 && currentTarget > 1000) {
      suggestions.push({
        id: `cat-${cat.id}-optimize`,
        type: 'optimize',
        category: cat.name,
        currentValue: currentTarget,
        suggestedValue: Math.round(currentTarget * 0.7),
        reason: `Vous avez dépensé seulement ${currentSpent.toFixed(0)}€ sur une cible de ${currentTarget}€. Réduire la cible libérerait du budget.`,
        priority: 'low',
      });
    }
  });

  // Analyser les abonnements
  const avgSubs = calculateAverageSubscriptions(historicalData);
  const currentSubsTotal = currentYearData.subs.reduce(
    (sum, sub) => sum + sub.monthly * 12,
    0
  );

  if (avgSubs > 0 && currentSubsTotal > avgSubs * 1.3) {
    suggestions.push({
      id: 'subs-optimize',
      type: 'optimize',
      category: 'Abonnements',
      currentValue: currentSubsTotal,
      suggestedValue: Math.round(avgSubs * 1.1),
      reason: `Vos abonnements annuels (${currentSubsTotal.toFixed(0)}€) sont supérieurs à la moyenne (${avgSubs.toFixed(0)}€). Pensez à annuler les abonnements inutilisés.`,
      priority: 'medium',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function calculateAverageSpendingByCategory(
  historicalData: YearData[]
): Map<string, number> {
  const categoryMap = new Map<string, { total: number; count: number }>();

  historicalData.forEach((yearData) => {
    const spendingByCategory = calculateCurrentSpendingByCategory(yearData);
    spendingByCategory.forEach((spent, categoryId) => {
      const existing = categoryMap.get(categoryId) || { total: 0, count: 0 };
      categoryMap.set(categoryId, {
        total: existing.total + spent,
        count: existing.count + 1,
      });
    });
  });

  const averages = new Map<string, number>();
  categoryMap.forEach((stats, categoryId) => {
    averages.set(categoryId, stats.total / stats.count);
  });

  return averages;
}

function calculateCurrentSpendingByCategory(
  yearData: YearData
): Map<string, number> {
  const spending = new Map<string, number>();

  yearData.expenses.forEach((expense) => {
    const current = spending.get(expense.categoryId) || 0;
    spending.set(expense.categoryId, current + expense.amount);
  });

  return spending;
}

function calculateAverageSubscriptions(historicalData: YearData[]): number {
  const totals = historicalData.map((yearData) =>
    yearData.subs.reduce((sum, sub) => {
      const months = sub.endMonth >= sub.startMonth
        ? sub.endMonth - sub.startMonth + 1
        : 12 - sub.startMonth + sub.endMonth + 1;
      return sum + sub.monthly * months;
    }, 0)
  );

  if (totals.length === 0) return 0;
  return totals.reduce((sum, t) => sum + t, 0) / totals.length;
}

