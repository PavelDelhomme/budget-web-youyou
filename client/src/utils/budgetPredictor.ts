import { Category, Subscription, YearData, UserGlobalData } from '../types';

/**
 * Analyse les années passées et génère des prévisions pour les années futures
 * Simple algorithme interne basé sur les moyennes et tendances
 * 
 * Taux d'inflation annuel utilisé pour les prévisions (2.5% par an, proche de la moyenne européenne)
 */
const INFLATION_RATE = 0.025; // 2.5% par an

export interface PredictedYearData {
  year: number;
  isPredicted: true;
  categories: Category[];
  subs: Subscription[];
  monthlySalary: number;
  projectedExpenses: number;
  projectedSavings: number;
  projectedAnnualIncome?: number; // Revenus annuels totaux (incluant revenus supplémentaires)
  projectedInvestments?: number;
  projectedBankAccounts?: number; // Total des comptes bancaires projetés
  projectedTotalAssets?: number; // Total actifs (comptes + investissements)
  projectedSavingsProjects?: { totalCurrent: number; totalTarget: number };
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
  futureYears: number[],
  globalData?: UserGlobalData | null
): PredictedYearData[] {
  if (historicalYears.length === 0) {
    return [];
  }

  // Calculer les moyennes et tendances
  const avgCategories = calculateAverageCategories(historicalYears);
  const avgSubs = calculateAverageSubscriptions(historicalYears);
  const avgSalary = calculateAverageSalary(historicalYears);
  const avgSpending = calculateAverageSpending(historicalYears);
  const avgAnnualFixedExpenses = calculateAverageAnnualFixedExpenses(historicalYears);
  
  // Calculer la tendance d'évolution (augmentation/diminution moyenne par an)
  const spendingTrend = calculateTrend(historicalYears.map(h => ({
    year: h.year,
    value: calculateTotalSpending(h.data)
  })));

  // Calculer l'évolution de l'épargne basée sur les transactions historiques
  const savingsTrend = calculateSavingsTrend(historicalYears);
  const avgCurrentSavings = calculateAverageCurrentSavings(historicalYears);

  // Calculer les revenus supplémentaires pour chaque année future
  const calculateAdditionalIncome = (year: number): number => {
    if (!globalData?.temporaryIncomes) return 0;
    
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    let total = 0;
    for (const income of globalData.temporaryIncomes) {
      const startDate = new Date(income.startDate);
      const endDate = income.endDate ? new Date(income.endDate) : null;
      
      // Revenus permanents : 12 mois si l'année est après la date de début
      if (income.duration === 'permanent' && startDate <= yearEnd) {
        if (startDate <= yearStart) {
          total += income.amount * 12;
        } else {
          const monthsActive = 12 - startDate.getMonth();
          total += income.amount * monthsActive;
        }
      }
      
      // Revenus temporaires sur plusieurs mois
      if (income.duration === 'months' && endDate) {
        if (startDate <= yearEnd && endDate >= yearStart) {
          const start = startDate < yearStart ? yearStart : startDate;
          const end = endDate > yearEnd ? yearEnd : endDate;
          const monthsActive = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
          total += income.amount * Math.max(0, monthsActive);
        }
      }
      
      // Revenus ponctuels
      if (income.duration === 'once' && startDate >= yearStart && startDate <= yearEnd) {
        total += income.amount;
      }
    }
    
    return total;
  };

  // Calculer l'évolution prévue des investissements
  const calculateProjectedInvestments = (year: number): number => {
    if (!globalData?.investments) return 0;
    
    const lastHistoricalYear = Math.max(...historicalYears.map(h => h.year));
    const yearsAhead = year - lastHistoricalYear;
    
    return globalData.investments.reduce((total, inv) => {
      // Valeur actuelle + contributions mensuelles × 12 × années
      const currentValue = inv.currentValue || 0;
      const monthlyContrib = inv.monthlyContribution || 0;
      const annualContrib = monthlyContrib * 12;
      
      // Estimation de croissance des investissements (conservative: 4% par an)
      const growthRate = 0.04;
      const projectedValue = currentValue * Math.pow(1 + growthRate, yearsAhead) + 
                            (annualContrib * yearsAhead * (1 + growthRate / 2));
      
      return total + projectedValue;
    }, 0);
  };

  // Calculer l'évolution prévue des comptes bancaires
  const calculateProjectedBankAccounts = (year: number, projectedSavings: number): number => {
    if (!globalData?.bankAccounts) return projectedSavings;
    
    // Total actuel des comptes bancaires
    const currentTotal = globalData.bankAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    
    // Calculer l'évolution : solde actuel + épargne projetée accumulée
    // On part du principe que l'épargne va principalement dans les comptes bancaires
    // (une partie peut aussi aller dans les investissements, mais on simplifie)
    const savingsFromIncome = projectedSavings - (avgCurrentSavings || 0);
    const projectedTotal = currentTotal + savingsFromIncome;
    
    return Math.max(0, projectedTotal);
  };

  // Calculer l'évolution prévue des projets d'épargne
  const calculateProjectedSavingsProjects = (year: number) => {
    if (!globalData?.savingsProjects || globalData.savingsProjects.length === 0) {
      return undefined;
    }
    
    const lastHistoricalYear = Math.max(...historicalYears.map(h => h.year));
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    let totalCurrent = 0;
    let totalTarget = 0;
    let totalContributions = 0;
    
    globalData.savingsProjects.forEach(project => {
      const targetDate = new Date(project.targetDate);
      
      // Si le projet est actif pour cette année (la date cible est dans cette année ou après)
      if (targetDate >= yearStart && targetDate <= yearEnd) {
        const monthlyContrib = project.monthlyContribution || 0;
        
        // Pour l'année en question, calculer les contributions sur toute l'année
        // (puisque c'est une prédiction pour une année complète)
        const contributionsForYear = monthlyContrib * 12;
        
        // Valeur actuelle du projet au début de l'année
        // Pour les années futures, partir de la valeur actuelle + contributions des années précédentes
        const yearsBeforeThis = Math.max(0, year - lastHistoricalYear - 1);
        const currentValueAtYearStart = project.currentAmount + (monthlyContrib * 12 * yearsBeforeThis);
        
        // Projeter le montant en fin d'année : valeur au début + contributions de l'année
        const projectedCurrent = Math.min(
          project.targetAmount,
          currentValueAtYearStart + contributionsForYear
        );
        
        totalCurrent += projectedCurrent;
        totalTarget += project.targetAmount;
        totalContributions += contributionsForYear;
      } else if (targetDate < yearStart) {
        // Projet terminé avant cette année, compter le montant cible comme atteint
        totalCurrent += project.targetAmount;
        totalTarget += project.targetAmount;
      }
      // Si targetDate > yearEnd, le projet commence après cette année, on ne l'inclut pas
    });
    
    return { totalCurrent, totalTarget, totalContributions };
  };

  // Générer les prévisions pour chaque année future
  return futureYears.map(year => {
    const lastHistoricalYear = Math.max(...historicalYears.map(h => h.year));
    const yearsAhead = year - lastHistoricalYear;
    
    // Calculer le facteur d'inflation cumulé
    const inflationFactor = Math.pow(1 + INFLATION_RATE, yearsAhead);
    
    // Revenus : Ne pas augmenter automatiquement, garder le salaire moyen
    // (Les augmentations de salaire doivent venir de l'historique utilisateur, pas de l'IA)
    const baseSalary = avgSalary; // Pas d'augmentation automatique
    const additionalIncome = calculateAdditionalIncome(year);
    const annualIncome = (baseSalary * 12) + additionalIncome;
    
    // Dépenses : Appliquer l'inflation + tendance historique
    // L'inflation s'applique à toutes les dépenses (catégories, abonnements, fixes)
    const inflationAdjustedSpending = avgSpending * inflationFactor;
    const trendAdjustedSpending = avgSpending * (1 + spendingTrend * yearsAhead);
    // Prendre le maximum entre inflation et tendance pour être réaliste
    const projectedSpending = Math.max(inflationAdjustedSpending, trendAdjustedSpending) + (avgAnnualFixedExpenses * inflationFactor);
    
    // Ajuster les catégories : inflation + tendance historique
    const predictedCategories = avgCategories.map(cat => {
      const inflationAdjusted = cat.target * inflationFactor;
      const trendAdjusted = cat.target * (1 + spendingTrend * yearsAhead * 0.5);
      // Prendre le maximum pour être réaliste
      return {
        ...cat,
        target: Math.max(0, Math.max(inflationAdjusted, trendAdjusted))
      };
    });

    // Calculer l'épargne projetée
    // Épargne de départ + épargne accumulée selon la tendance
    const projectedSavingsFromIncome = annualIncome - projectedSpending;
    const startingSavings = avgCurrentSavings || 0;
    const savingsGrowth = savingsTrend * yearsAhead;
    const baseProjectedSavings = startingSavings + (projectedSavingsFromIncome * (1 + savingsGrowth));
    
    // Ajouter les contributions aux projets d'épargne pour cette année
    const projectedSavingsProjectsData = calculateProjectedSavingsProjects(year);
    const projectsContributions = projectedSavingsProjectsData?.totalContributions || 0;
    
    // L'épargne projetée inclut les contributions aux projets d'épargne
    // Les projets sont considérés comme de l'épargne allouée
    const projectedSavings = baseProjectedSavings + projectsContributions;

    // Calculer les projections
    const projectedInvestmentsValue = calculateProjectedInvestments(year);
    const projectedBankAccountsValue = calculateProjectedBankAccounts(year, projectedSavings);
    const projectedTotalAssetsValue = projectedBankAccountsValue + projectedInvestmentsValue;

    // Ajuster les abonnements avec l'inflation
    const predictedSubs = avgSubs.map(sub => ({
      ...sub,
      id: crypto.randomUUID(),
      monthly: Math.round(sub.monthly * inflationFactor) // Appliquer l'inflation aux abonnements
    }));

    return {
      year,
      isPredicted: true,
      categories: predictedCategories,
      subs: predictedSubs,
      monthlySalary: baseSalary, // Pas d'augmentation automatique
      projectedExpenses: projectedSpending,
      projectedSavings: projectedSavings,
      projectedAnnualIncome: annualIncome,
      projectedInvestments: projectedInvestmentsValue,
      projectedBankAccounts: projectedBankAccountsValue,
      projectedTotalAssets: projectedTotalAssetsValue,
      projectedSavingsProjects: calculateProjectedSavingsProjects(year),
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
  
  const annualFixedTotal = (data.annualFixedExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0);
  
  return categoriesTotal + subsTotal + annualFixedTotal;
}

/**
 * Calcule la moyenne des dépenses fixes annuelles
 */
function calculateAverageAnnualFixedExpenses(historicalYears: HistoricalYearData[]): number {
  const totals = historicalYears
    .map(h => (h.data.annualFixedExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0))
    .filter(v => v > 0);
  
  if (totals.length === 0) return 0;
  return totals.reduce((sum, v) => sum + v, 0) / totals.length;
}

/**
 * Calcule la moyenne de l'épargne actuelle
 */
function calculateAverageCurrentSavings(historicalYears: HistoricalYearData[]): number {
  const savings = historicalYears
    .map(h => h.data.currentSavings || 0)
    .filter(s => s > 0);
  
  if (savings.length === 0) return 0;
  return savings.reduce((sum, s) => sum + s, 0) / savings.length;
}

/**
 * Calcule la tendance d'évolution de l'épargne basée sur les transactions
 */
function calculateSavingsTrend(historicalYears: HistoricalYearData[]): number {
  if (historicalYears.length < 2) return 0;
  
  const savingsByYear = historicalYears.map(h => {
    const transactions = h.data.savingsTransactions || [];
    const totalAdded = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netSavings = totalAdded - totalWithdrawn;
    
    return {
      year: h.year,
      savings: (h.data.currentSavings || 0),
      netMonthlySavings: netSavings / 12 // Épargne nette mensuelle moyenne
    };
  });
  
  // Calculer la tendance de l'épargne nette mensuelle
  const sorted = savingsByYear.sort((a, b) => a.year - b.year);
  const trends: number[] = [];
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].netMonthlySavings;
    const curr = sorted[i].netMonthlySavings;
    if (prev !== 0) {
      trends.push((curr - prev) / Math.abs(prev));
    }
  }
  
  return trends.length > 0 
    ? trends.reduce((sum, t) => sum + t, 0) / trends.length
    : 0;
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
 * Exclut toutes les années qui sont déjà dans allYears (années réelles créées par l'utilisateur)
 * @param allYears - Liste de toutes les années réelles
 * @param currentYear - Année actuelle
 * @param excludedYears - Années à exclure de la génération (années prédites supprimées par l'utilisateur)
 * @param maxYears - Nombre maximum d'années à générer (défaut: 3)
 */
export function getFutureYears(allYears: number[], currentYear: number, excludedYears: number[] = [], maxYears: number = 3): number[] {
  // Trouver la dernière année réelle (année la plus récente dans allYears qui est >= currentYear)
  // Si aucune année future réelle, utiliser currentYear
  const futureRealYears = allYears.filter(y => y >= currentYear);
  const maxRealYear = futureRealYears.length > 0 
    ? Math.max(...futureRealYears)
    : currentYear - 1;
  
  const futureYears: number[] = [];
  
  // Générer seulement les années futures qui ne sont PAS déjà dans allYears (années réelles)
  // et qui ne sont PAS dans excludedYears (années exclues par l'utilisateur)
  // Générer jusqu'à maxYears années après la dernière année réelle
  for (let i = 1; i <= maxYears && futureYears.length < maxYears; i++) {
    const futureYear = maxRealYear + i;
    // Ne pas inclure si :
    // - l'année est déjà dans allYears (année réelle)
    // - l'année est dans excludedYears (exclue par l'utilisateur)
    // - l'année est dans le passé
    if (!allYears.includes(futureYear) && 
        !excludedYears.includes(futureYear) && 
        futureYear >= currentYear) {
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

