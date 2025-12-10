import { useMemo } from 'react';
import { UserGlobalData, YearData, Category, Expense } from '../../core/types';
import { MonthlyExpensesIncomeChartChartJS } from '../charts/MonthlyExpensesIncomeChartChartJS';
import { CategoryEvolutionChart } from '../charts/CategoryEvolutionChart';
import { ExpensesPieChart } from '../charts/ExpensesPieChart';
import { SimpleBarChart } from '../charts/SimpleBarChart';
import { AnnualEvolutionChart } from '../charts/AnnualEvolutionChart';
import { SimpleChartJSTest } from './SimpleChartJSTest';
import { LazySection } from '../ui/LazySection';
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

      {/* Test Simple Chart.js - Comparaison */}
      <LazySection rootMargin="50px">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg p-4 sm:p-6 text-white mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            🧪 Test Simple Chart.js - Comparaison
          </h2>
          <p className="text-yellow-100 text-sm sm:text-base">
            Graphiques Chart.js très simples pour vérifier que beginAtZero fonctionne correctement
          </p>
        </div>

        <SimpleChartJSTest />
      </LazySection>

      {/* 1-10. 10 Variantes du Graphique Dépenses et revenus par mois */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          📊 10 Variantes - Dépenses et revenus par mois
        </h2>
        <p className="text-purple-100 text-sm sm:text-base">
          Testez différentes configurations de style, couleurs, espacements et tailles
        </p>
      </div>

      {/* Variante 1 : Standard (par défaut) - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          1️⃣ Standard (Par défaut) - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales</strong> - Chart.js, configuration standard avec barres côte à côte (barres partent de 0€)
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
            variant="Standard - Barres groupées verticales"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 2 : Compacte (barres fines, espacement réduit) - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          2️⃣ Compacte - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales compactes</strong> - Chart.js, hauteur réduite 350px
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={350}
            variant="Compacte - Barres groupées verticales compactes"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 3 : Large (hauteur augmentée) - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          3️⃣ Large - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales larges</strong> - Chart.js, hauteur 450px pour meilleure visibilité
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={450}
            variant="Large - Barres groupées verticales larges"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 4 : Couleurs bleues/violettes - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          4️⃣ Couleurs bleues/violettes - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales</strong> - Chart.js, Revenus bleu (#3B82F6), Dépenses violet (#8B5CF6)
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
            variant="Bleu/Violet - Barres groupées verticales"
            incomeColor="#3B82F6"
            expenseColor="#8B5CF6"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 5 : Couleurs orange/rouge - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          5️⃣ Couleurs orange/rouge - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales</strong> - Chart.js, Revenus orange (#F59E0B), Dépenses rouge (#DC2626)
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
            variant="Orange/Rouge - Barres groupées verticales"
            incomeColor="#F59E0B"
            expenseColor="#DC2626"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 6 : Minimaliste - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          6️⃣ Minimaliste - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales minimalistes</strong> - Chart.js, hauteur 350px
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={350}
            variant="Minimaliste - Barres groupées verticales minimalistes"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 7 : Couleurs sombres - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          7️⃣ Sombre - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales sombres</strong> - Chart.js, couleurs assombries
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={400}
            variant="Sombre - Barres groupées verticales sombres"
            incomeColor="#059669"
            expenseColor="#B91C1C"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 8 : Hauteur réduite - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          8️⃣ Hauteur réduite (300px) - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales</strong> - Chart.js, hauteur 300px pour affichage compact
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={300}
            variant="Hauteur réduite - Barres groupées verticales"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 9 : Hauteur augmentée - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          9️⃣ Hauteur augmentée (500px) - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales</strong> - Chart.js, hauteur 500px pour meilleure visibilité des détails
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={500}
            variant="Hauteur augmentée - Barres groupées verticales"
          />
        </div>
        </div>
      </LazySection>

      {/* Variante 10 : Mix (couleurs personnalisées) - Chart.js */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700 w-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-bold mb-2 text-gray-900 dark:text-white">
          🔟 Mix - Chart.js
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
          Type : <strong>Barres groupées verticales mix</strong> - Chart.js, couleurs personnalisées, hauteur 380px
        </p>
        <div className="w-full min-w-0">
          <MonthlyExpensesIncomeChartChartJS
            expenses={testYearData.expenses || []}
            monthlySalary={monthlySalary}
            variableMonthlyIncomes={testYearData.variableMonthlyIncomes}
            additionalMonthlyIncomes={testYearData.additionalMonthlyIncomes || []}
            temporaryIncomes={temporaryIncomes}
            salaryHistory={globalData?.salaryHistory}
            year={currentYear}
            height={380}
            variant="Mix - Barres groupées verticales mix"
            incomeColor="#10B981"
            expenseColor="#EF4444"
          />
        </div>
        </div>
      </LazySection>

      {/* 2. Graphique Évolution par catégorie */}
      <LazySection rootMargin="50px">
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
      </LazySection>

      {/* 3. Graphique Répartition des dépenses par catégorie (Pie Chart) */}
      <LazySection rootMargin="50px">
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
      </LazySection>

      {/* 4. Graphique Simple Bar Chart */}
      <LazySection rootMargin="50px">
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
      </LazySection>

      {/* 6. Graphique de comparaison mensuelle (Dépenses vs Budget) */}
      <LazySection rootMargin="50px">
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
      </LazySection>

      {/* 7. Graphique de tendances (Ligne) - VALIDÉ ET INTÉGRÉ */}
      <LazySection rootMargin="50px">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border-2 border-green-500 dark:border-green-600 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            7️⃣ Tendance des dépenses (12 derniers mois)
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500 text-white text-xs sm:text-sm font-semibold rounded-full flex items-center gap-1">
              <span>✅</span>
              <span>VALIDÉ - DÉJÀ INTÉGRÉ</span>
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <strong>Statut :</strong> Ce graphique a été validé et est déjà intégré dans l'application. 
          Il affiche les tendances des dépenses sur les 12 derniers mois avec un graphique en ligne SVG personnalisé, 
          partant de 0€ sur l'axe Y et avec scroll horizontal pour mobile.
        </p>
        <div className="w-full min-w-0 overflow-x-auto">
          <div className="inline-block" style={{ minWidth: '900px' }}>
            <svg width="900" height="300" className="w-full" viewBox="0 0 900 300" preserveAspectRatio="xMinYMid">
              <defs>
                <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                </linearGradient>
              </defs>
              {/* Ligne horizontale à y=250 pour représenter 0€ */}
              <line
                x1={50}
                y1={250}
                x2={850}
                y2={250}
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Labels de l'axe Y */}
              {(() => {
                const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                const minExpense = 0; // Toujours partir de 0€
                const range = maxExpense - minExpense || 1;
                const chartHeight = 200; // Hauteur utilisable pour le graphique
                const topY = 50; // Position Y du haut du graphique
                
                return [0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const value = minExpense + (range * ratio);
                  const y = 250 - (chartHeight * ratio);
                  return (
                    <text
                      key={ratio}
                      x={45}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                    >
                      {currency(value)}
                    </text>
                  );
                });
              })()}
              {/* Ligne de tendance des dépenses - CORRIGÉ pour partir de 0€ */}
              <polyline
                points={monthlyExpenses.map((m, i) => {
                  const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                  const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                  const minExpense = 0; // Toujours partir de 0€
                  const range = maxExpense - minExpense || 1;
                  // y = 250 (0€) - (valeur / range) * 200 (hauteur du graphique)
                  const y = 250 - ((m.total - minExpense) / range) * 200;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Zone remplie sous la ligne - CORRIGÉ pour partir de 0€ */}
              <polygon
                points={`50,250 ${monthlyExpenses.map((m, i) => {
                  const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                  const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                  const minExpense = 0; // Toujours partir de 0€
                  const range = maxExpense - minExpense || 1;
                  const y = 250 - ((m.total - minExpense) / range) * 200;
                  return `${x},${y}`;
                }).join(' ')} ${(monthlyExpenses.length - 1 ? 850 : 50)},250`}
                fill="url(#expenseGradient)"
              />
              {/* Points sur la ligne - CORRIGÉ pour partir de 0€ */}
              {monthlyExpenses.map((m, i) => {
                const x = (i / (monthlyExpenses.length - 1 || 1)) * 800 + 50;
                const maxExpense = Math.max(...monthlyExpenses.map(m => m.total), 1);
                const minExpense = 0; // Toujours partir de 0€
                const range = maxExpense - minExpense || 1;
                const y = 250 - ((m.total - minExpense) / range) * 200;
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
      </LazySection>

      {/* 8. Graphique de répartition mensuelle */}
      <LazySection rootMargin="50px">
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
      </LazySection>

      {/* Instructions */}
      <LazySection rootMargin="50px">
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
      </LazySection>
    </div>
  );
}
