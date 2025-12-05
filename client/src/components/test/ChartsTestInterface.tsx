import { useMemo } from 'react';
import { UserGlobalData, YearData, Category, Expense } from '../../core/types';
import { MonthlyExpensesIncomeChart } from '../charts/MonthlyExpensesIncomeChart';
import { CategoryEvolutionChart } from '../charts/CategoryEvolutionChart';
import { ExpensesPieChart } from '../charts/ExpensesPieChart';
import { SimpleBarChart } from '../charts/SimpleBarChart';
import { AnnualEvolutionChart } from '../charts/AnnualEvolutionChart';
import { currency } from '../../lib/utils';

interface ChartsTestInterfaceProps {
  currentYear: number;
  yearData: YearData;
  historicalData: Map<number, YearData>;
  globalData: UserGlobalData | null;
  predictedYears: any[];
}

// Générer des données d'exemple pour les tests
function generateDemoData(currentYear: number) {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Catégories d'exemple
  const demoCategories: Category[] = [
    { id: 'alimentation', name: 'Alimentation', target: 300 },
    { id: 'transport', name: 'Transport', target: 200 },
    { id: 'logement', name: 'Logement', target: 800 },
    { id: 'loisirs', name: 'Loisirs', target: 150 },
    { id: 'sante', name: 'Santé', target: 100 },
  ];

  // Dépenses d'exemple pour les 12 derniers mois
  const demoExpenses: Expense[] = [];
  const categoryIds = demoCategories.map(c => c.id);
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 15);
    const monthNum = currentMonth - i;
    
    // Générer 3-5 dépenses par mois avec des montants variés
    const expensesPerMonth = 3 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < expensesPerMonth; j++) {
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const baseAmount = demoCategories.find(c => c.id === categoryId)?.target || 100;
      const amount = Math.floor(baseAmount * 0.8 + Math.random() * baseAmount * 0.4);
      
      demoExpenses.push({
        id: `demo-${i}-${j}`,
        amount,
        date: date.toISOString().split('T')[0],
        categoryId,
        note: `Dépense ${categoryId} - ${date.toLocaleDateString('fr-FR', { month: 'long' })}`,
      });
    }
  }

  // Données historiques d'exemple (3 dernières années)
  const demoHistoricalData: Map<number, YearData> = new Map();
  for (let year = currentYear - 2; year <= currentYear; year++) {
    const annualExpenses: Expense[] = [];
    for (let month = 0; month < 12; month++) {
      for (let j = 0; j < 3; j++) {
        const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
        const baseAmount = demoCategories.find(c => c.id === categoryId)?.target || 100;
        annualExpenses.push({
          id: `demo-hist-${year}-${month}-${j}`,
          amount: Math.floor(baseAmount * 0.7 + Math.random() * baseAmount * 0.6),
          date: new Date(year, month, 15).toISOString().split('T')[0],
          categoryId,
          note: `Dépense ${year}`,
        });
      }
    }
    
    demoHistoricalData.set(year, {
      categories: demoCategories,
      expenses: annualExpenses,
      subs: [],
      annualFixedExpenses: [],
      monthlySalary: 2500,
      currentSavings: 0,
      savingsTransactions: [],
    });
  }

  return {
    categories: demoCategories,
    expenses: demoExpenses,
    historicalData: demoHistoricalData,
    monthlySalary: 2500,
  };
}

export function ChartsTestInterface({
  currentYear,
  yearData,
  historicalData,
  globalData,
  predictedYears,
}: ChartsTestInterfaceProps) {
  // Générer des données d'exemple si pas de données réelles
  const hasRealData = (yearData.expenses && yearData.expenses.length > 0) || 
                      (yearData.categories && yearData.categories.length > 0) ||
                      historicalData.size > 0;
  
  const demoData = useMemo(() => generateDemoData(currentYear), [currentYear]);
  
  // Utiliser les données réelles si disponibles, sinon les données d'exemple
  const testYearData: YearData = hasRealData ? yearData : {
    ...yearData,
    categories: demoData.categories,
    expenses: demoData.expenses,
    monthlySalary: demoData.monthlySalary || yearData.monthlySalary || 2500,
  };
  
  const testHistoricalData = historicalData.size > 0 ? historicalData : demoData.historicalData;
  
  // Calculer les données nécessaires pour les graphiques
  const monthlySalary = testYearData.monthlySalary || 2500;
  const temporaryIncomes = globalData?.temporaryIncomes || [];
  
  // Calculer categoryExpenses pour le graphique d'évolution par catégorie
  const { categoryExpenses, monthlyExpenses } = useMemo(() => {
    const allExpenses: Expense[] = [];
    const allCategoriesList: Category[] = [];
    
    // Collecter toutes les dépenses et catégories de toutes les années
    testHistoricalData.forEach((data) => {
      allExpenses.push(...(data.expenses || []));
      data.categories?.forEach((cat) => {
        if (!allCategoriesList.find((c) => c.id === cat.id)) {
          allCategoriesList.push(cat);
        }
      });
    });
    
    // Ajouter les dépenses et catégories de l'année courante
    allExpenses.push(...(testYearData.expenses || []));
    testYearData.categories?.forEach((cat) => {
      if (!allCategoriesList.find((c) => c.id === cat.id)) {
        allCategoriesList.push(cat);
      }
    });
    
    const currentMonth = new Date().getMonth();
    const currentSystemYear = new Date().getFullYear();
    const monthlyData: Array<{ month: string; year: number; monthNum: number; total: number }> = [];
    
    // Générer les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentSystemYear, currentMonth - i, 1);
      const monthNum = date.getMonth();
      const yearNum = date.getFullYear();
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthExpenses = allExpenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() === monthNum && expenseDate.getFullYear() === yearNum;
        })
        .reduce((sum, e) => {
          const amount = e.share?.yourAmount || e.amount || 0;
          return sum + amount;
        }, 0);
      
      monthlyData.push({
        month: monthName,
        year: yearNum,
        monthNum: monthNum + 1,
        total: monthExpenses,
      });
    }
    
    // Calculer les dépenses par catégorie pour les 12 derniers mois
    const categoryExpensesMap = new Map<string, { category: Category; months: Array<{ month: string; total: number }> }>();
    
    allCategoriesList.forEach(cat => {
      categoryExpensesMap.set(cat.id, {
        category: cat,
        months: monthlyData.map(monthData => ({
          month: monthData.month,
          total: allExpenses
            .filter(e => {
              const expenseDate = new Date(e.date);
              return e.categoryId === cat.id &&
                     expenseDate.getMonth() === monthData.monthNum - 1 &&
                     expenseDate.getFullYear() === monthData.year;
            })
            .reduce((sum, e) => {
              const amount = e.share?.yourAmount || e.amount || 0;
              return sum + amount;
            }, 0),
        })),
      });
    });
    
    return {
      monthlyExpenses: monthlyData,
      categoryExpenses: Object.fromEntries(categoryExpensesMap),
    };
  }, [testHistoricalData, testYearData, currentYear]);

  // Préparer les données pour AnnualEvolutionChart
  const historicalArray = useMemo(() => {
    const array: Array<{ year: number; data: YearData }> = [];
    testHistoricalData.forEach((data, year) => {
      array.push({ year, data });
    });
    return array.sort((a, b) => a.year - b.year);
  }, [testHistoricalData]);

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header avec indicateur de données */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">🧪 Interface de Test des Graphiques</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Vérifiez le rendu de tous les graphiques en grand et petit écran
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
              hasRealData 
                ? 'bg-green-500/30 text-green-100' 
                : 'bg-yellow-500/30 text-yellow-100'
            }`}>
              {hasRealData ? '📊 Données réelles' : '🎲 Données d\'exemple'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Graphique Dépenses et revenus par mois */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          1️⃣ Dépenses et revenus par mois
        </h2>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChart
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
          />
        </div>
      </div>

      {/* 2. Graphique Évolution par catégorie */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          2️⃣ Évolution par catégorie (12 derniers mois)
        </h2>
        {Object.keys(categoryExpenses).length > 0 ? (
          <div className="space-y-4 sm:space-y-6 w-full min-w-0">
            {Object.values(categoryExpenses)
              .filter((ce: { category: Category; months: Array<{ month: string; total: number }> }) => 
                ce.months.some((m: { total: number }) => m.total > 0)
              )
              .sort((a: { months: Array<{ total: number }> }, b: { months: Array<{ total: number }> }) => {
                const totalA = a.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                const totalB = b.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                return totalB - totalA;
              })
              .slice(0, 8)
              .map((categoryData: { category: Category; months: Array<{ month: string; total: number }> }) => {
                const categoryTotal = categoryData.months.reduce((sum: number, m: { total: number }) => sum + m.total, 0);
                const categoryAvg = categoryTotal / categoryData.months.length;
                
                return (
                  <div 
                    key={categoryData.category.id} 
                    className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0 w-full min-w-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                          {categoryData.category.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Total: {currency(categoryTotal)} | Moyenne: {currency(categoryAvg)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full min-w-0">
                      <CategoryEvolutionChart
                        categoryData={categoryData}
                        height={200}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm sm:text-base">Aucune donnée à afficher</p>
          </div>
        )}
      </div>

      {/* 3. Graphique Répartition des dépenses par catégorie (Pie Chart) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          3️⃣ Répartition des dépenses par catégorie
        </h2>
        <div className="w-full flex justify-center min-w-0 overflow-x-auto">
          <ExpensesPieChart
            categories={testYearData.categories || []}
            expenses={testYearData.expenses || []}
            size={Math.min(400, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 400)}
          />
        </div>
      </div>

      {/* 4. Graphique Simple Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          4️⃣ Graphique en barres simple
        </h2>
        <div className="w-full min-w-0 overflow-x-auto">
          <SimpleBarChart
            data={[
              { label: 'Jan', value: 1200 },
              { label: 'Fév', value: 1800 },
              { label: 'Mar', value: 1500 },
              { label: 'Avr', value: 2100 },
              { label: 'Mai', value: 1700 },
              { label: 'Jun', value: 1900 },
            ]}
            height={300}
          />
        </div>
      </div>

      {/* 5. Graphique Évolution annuelle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          5️⃣ Évolution des dépenses et revenus par année
        </h2>
        {historicalArray.length > 0 ? (
          <div className="w-full min-w-0">
            <AnnualEvolutionChart
              historicalData={historicalArray}
              globalData={globalData || undefined}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm sm:text-base">Aucune donnée historique disponible</p>
          </div>
        )}
      </div>

      {/* 6. Graphique de comparaison mensuelle (Dépenses vs Budget) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          6️⃣ Comparaison Dépenses par mois
        </h2>
        <div className="w-full min-w-0">
          <SimpleBarChart
            data={monthlyExpenses.slice(0, 12).map(m => ({
              label: m.month,
              value: m.total,
            }))}
            height={300}
            barColor="#EF4444"
          />
        </div>
      </div>

      {/* 7. Graphique de tendances (Ligne) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          7️⃣ Tendance des dépenses (12 derniers mois)
        </h2>
        <div className="w-full min-w-0 overflow-x-auto">
          <div className="inline-block min-w-full">
            <svg width="100%" height="300" className="w-full">
              <defs>
                <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                </linearGradient>
              </defs>
              {/* Ligne de tendance des dépenses */}
              <polyline
                points={monthlyExpenses.map((m, i) => {
                  const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                  const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                  const y = 250 - (m.total / maxExpense) * 200;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Zone remplie sous la ligne */}
              <polygon
                points={`50,250 ${monthlyExpenses.map((m, i) => {
                  const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                  const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                  const y = 250 - (m.total / maxExpense) * 200;
                  return `${x},${y}`;
                }).join(' ')} ${(monthlyExpenses.length - 1 ? 850 : 50)},250`}
                fill="url(#expenseGradient)"
              />
              {/* Points sur la ligne */}
              {monthlyExpenses.map((m, i) => {
                const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                const y = 250 - (m.total / maxExpense) * 200;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#EF4444" stroke="white" strokeWidth="2" />
                    <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
                      {currency(m.total)}
                    </text>
                  </g>
                );
              })}
              {/* Labels des mois */}
              {monthlyExpenses.map((m, i) => {
                const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                return (
                  <text key={i} x={x} y={270} textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
                    {m.month}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 8. Graphique de répartition mensuelle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          8️⃣ Répartition des dépenses par mois (Camembert mensuel)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {monthlyExpenses.slice(0, 6).map((month, index) => {
            const total = month.total;
            const percentage = total > 0 ? (total / monthlyExpenses.reduce((sum, m) => sum + m.total, 0)) * 100 : 0;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{month.month}</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{currency(total)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-900 dark:text-white">
          📝 Instructions de test
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
          <div>
            <p className="font-semibold mb-2">✅ À vérifier :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Alignement des montants avec l'axe Y</li>
              <li>Lisibilité des labels et valeurs</li>
              <li>Responsivité (grand/petit écran)</li>
              <li>Support du mode sombre</li>
              <li>Scroll horizontal si nécessaire</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">📱 Test responsive :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Réduire la largeur du navigateur</li>
              <li>Vérifier sur mobile/tablette</li>
              <li>Vérifier que tout reste lisible</li>
              <li>Noter les problèmes visuels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
