import { useMemo } from 'react';
import { parseAmount, today } from '../utils';
import { Category, Expense, Subscription, AnnualFixedExpense } from '../types';

export function useBudgetCalculations(
  year: number,
  categories: Category[],
  expenses: Expense[],
  subs: Subscription[],
  annualFixedExpenses?: AnnualFixedExpense[]
) {
  const monthNow = useMemo(
    () => (today.getFullYear() === year ? today.getMonth() + 1 : 12),
    [year]
  );

  const variableTargets = useMemo(
    () => categories.reduce((s, c) => {
      // Si monthlyTargets est défini, utiliser la somme des budgets mensuels
      // Sinon, utiliser le target annuel
      if (c.monthlyTargets && c.monthlyTargets.length === 12) {
        return s + c.monthlyTargets.reduce((sum, val) => sum + parseAmount(val), 0);
      }
      return s + parseAmount(c.target);
    }, 0),
    [categories]
  );

  const variableSpentByCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of categories) m[c.id] = 0;
    for (const e of expenses) {
      const amt = parseAmount(e.amount);
      m[e.categoryId] = (m[e.categoryId] || 0) + amt;
    }
    return m;
  }, [categories, expenses]);

  const variableSpentTotal = useMemo(
    () => Object.values(variableSpentByCat).reduce((a, b) => a + b, 0),
    [variableSpentByCat]
  );

  const monthsOverlapFullYear = (s: Subscription) => {
    const a = Math.max(1, Math.min(12, s.startMonth || 1));
    const b = s.ongoing || !s.endMonth ? 12 : Math.max(a, Math.min(12, s.endMonth));
    return Math.max(0, b - a + 1);
  };

  const monthsOverlapInYear = (s: Subscription, upToMonth: number = 12) => {
    const a = Math.max(1, Math.min(12, s.startMonth || 1));
    const b = s.ongoing || !s.endMonth ? 12 : Math.max(a, Math.min(12, s.endMonth));
    const m = Math.max(1, Math.min(12, upToMonth));
    return Math.max(0, Math.min(b, m) - a + 1);
  };

  const subsAnnualCommitted = useMemo(
    () =>
      subs.reduce(
        (sum, s) => sum + parseAmount(s.monthly) * monthsOverlapFullYear(s),
        0
      ),
    [subs]
  );

  const subsPaidToDate = useMemo(
    () =>
      subs.reduce(
        (sum, s) =>
          sum + parseAmount(s.monthly) * monthsOverlapInYear(s, monthNow),
        0
      ),
    [subs, monthNow]
  );

  const annualFixedExpensesTotal = useMemo(
    () => (annualFixedExpenses || []).reduce((sum, exp) => sum + parseAmount(exp.amount), 0),
    [annualFixedExpenses]
  );

  const annualBudgetTotal = useMemo(
    () => variableTargets + subsAnnualCommitted + annualFixedExpensesTotal,
    [variableTargets, subsAnnualCommitted, annualFixedExpensesTotal]
  );

  const spentToDateTotal = useMemo(
    () => variableSpentTotal + subsPaidToDate,
    [variableSpentTotal, subsPaidToDate]
  );

  const remainingYearTotal = useMemo(
    () => Math.max(0, annualBudgetTotal - spentToDateTotal),
    [annualBudgetTotal, spentToDateTotal]
  );

  const variableRemainingByCat = useMemo(() => {
    const m: Record<string, number> = {};
    const currentMonth = monthNow;
    
    for (const c of categories) {
      const spent = variableSpentByCat[c.id] || 0;
      
      // Si monthlyTargets est défini, calculer le budget jusqu'au mois actuel
      if (c.monthlyTargets && c.monthlyTargets.length === 12) {
        const targetUpToMonth = c.monthlyTargets
          .slice(0, currentMonth)
          .reduce((sum, val) => sum + parseAmount(val), 0);
        m[c.id] = Math.max(0, targetUpToMonth - spent);
      } else {
        // Budget annuel : calculer proportionnellement au mois actuel
        const annualTarget = parseAmount(c.target);
        const targetUpToMonth = (annualTarget / 12) * currentMonth;
        m[c.id] = Math.max(0, targetUpToMonth - spent);
      }
    }
    return m;
  }, [categories, variableSpentByCat, monthNow]);

  const variableRemainingTotal = useMemo(
    () => Object.values(variableRemainingByCat).reduce((a, b) => a + b, 0),
    [variableRemainingByCat]
  );

  const daysInYear = useMemo(
    () =>
      (new Date(year, 11, 31).getTime() - new Date(year, 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
    [year]
  );

  const dayOfYear = useMemo(() => {
    const d = today.getFullYear() === year ? today : new Date(year, 11, 31);
    const start = new Date(year, 0, 0);
    return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [year]);

  const daysRemaining = Math.max(0, Math.floor(daysInYear - dayOfYear));

  return {
    monthNow,
    variableTargets,
    variableSpentByCat,
    variableSpentTotal,
    subsAnnualCommitted,
    subsPaidToDate,
    annualFixedExpensesTotal,
    annualBudgetTotal,
    spentToDateTotal,
    remainingYearTotal,
    variableRemainingByCat,
    variableRemainingTotal,
    daysRemaining,
    monthsOverlapFullYear,
    monthsOverlapInYear,
  };
}

