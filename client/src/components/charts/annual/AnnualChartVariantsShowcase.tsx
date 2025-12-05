import { YearData } from '../../../core/types';
import { AnnualEvolutionChart } from '../AnnualEvolutionChart';

interface AnnualChartVariantsShowcaseProps {
  historicalData: Array<{ year: number; data: YearData }>;
  globalData?: {
    monthlySalary?: number;
    temporaryIncomes?: Array<{ amount: number; startDate: string; endDate?: string; duration: string }>;
    salaryHistory?: Array<{ id: string; amount: number; startDate: string; endDate?: string; type: string }>;
  };
}

export function AnnualChartVariantsShowcase({ historicalData, globalData }: AnnualChartVariantsShowcaseProps) {
  return (
    <div className="w-full space-y-8 p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📊 5 Variantes de Graphique Annuel
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choisissez la variante qui vous convient le mieux pour afficher l'évolution des dépenses et revenus par année
        </p>
      </div>

      {/* Variante 1 : Barres Groupées */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-blue-500">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-blue-600">1</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Barres Groupées (Style actuel)
            </h3>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
              Recommandé
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Barres vertes (revenus) et rouges (dépenses) côte à côte pour chaque année. Structure identique au graphique mensuel.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <AnnualEvolutionChart historicalData={historicalData} globalData={globalData} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-green-600">✅ Avantages:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Comparaison directe revenus vs dépenses</li>
              <li>Cohérent avec graphique mensuel</li>
              <li>Facile à lire et intuitif</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-orange-600">⚠️ Inconvénients:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Peut être large avec beaucoup d'années</li>
              <li>Nécessite scroll horizontal sur mobile</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Variante 2 : Area Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-purple-600">2</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Lignes avec Zone (Area Chart)
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Deux lignes courbes avec zones colorées pour visualiser les tendances dans le temps.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">📈</div>
            <p className="text-lg font-semibold mb-2">Variante 2 : Area Chart</p>
            <p className="text-sm">À implémenter - Visualise très bien les tendances</p>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-400 dark:text-gray-500 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span>Revenus (ligne verte)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span>Dépenses (ligne rouge)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-green-600">✅ Avantages:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Visualise bien les tendances</li>
              <li>Compact, moins de largeur</li>
              <li>Facile à voir les évolutions</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-orange-600">⚠️ Inconvénients:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Moins précis pour valeurs exactes</li>
              <li>Difficile de comparer sur une année</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Variante 3 : Stacked Bars */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-indigo-500">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-indigo-600">3</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Barres Empilées (Stacked)
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Une seule barre par année avec deux segments (revenus en bas, dépenses en haut).
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-semibold mb-2">Variante 3 : Barres Empilées</p>
            <p className="text-sm">À implémenter - Compact et simple visuellement</p>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-400 dark:text-gray-500 text-left space-y-2">
                <div>
                  <div className="mb-1">2020</div>
                  <div className="h-4 bg-green-400 rounded-t"></div>
                  <div className="h-3 bg-red-400 rounded-b"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-green-600">✅ Avantages:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Compact, moins de largeur</li>
              <li>Visualise bien l'épargne</li>
              <li>Simple visuellement</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-orange-600">⚠️ Inconvénients:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Difficile de comparer entre années</li>
              <li>Peut être confus si dépenses > revenus</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Variante 4 : Radar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-pink-500">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-pink-600">4</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Radar/Polaire
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Graphique en radar avec axes radiaux. Vue d'ensemble originale et moderne.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-semibold mb-2">Variante 4 : Graphique Radar</p>
            <p className="text-sm">À implémenter - Design unique et moderne</p>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <div className="w-32 h-32 mx-auto border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                <div className="text-xs text-gray-400 dark:text-gray-500">Radar Chart</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-green-600">✅ Avantages:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Vue d'ensemble très visuelle</li>
              <li>Compact en forme circulaire</li>
              <li>Design unique et moderne</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-orange-600">⚠️ Inconvénients:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Difficile à lire avec beaucoup d'années</li>
              <li>Moins intuitif pour la plupart</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Variante 5 : Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-teal-500">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-teal-600">5</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Cartes Individuelles
            </h3>
            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-semibold rounded-full">
              Recommandé mobile
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Cartes individuelles pour chaque année avec toutes les informations détaillées. Parfait pour mobile.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-gray-500 dark:text-gray-400 w-full">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-lg font-semibold mb-2">Variante 5 : Cartes Individuelles</p>
            <p className="text-sm mb-4">À implémenter - Très lisible et détaillé</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-lg font-bold mb-2">2020</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Revenus: 12 000€</div>
                  <div>Dépenses: 10 000€</div>
                  <div className="text-green-600 font-semibold">Épargne: +2 000€</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-lg font-bold mb-2">2021</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Revenus: 15 000€</div>
                  <div>Dépenses: 12 000€</div>
                  <div className="text-green-600 font-semibold">Épargne: +3 000€</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-green-600">✅ Avantages:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Très lisible et détaillé</li>
              <li>Parfait pour mobile</li>
              <li>Beaucoup d'informations par année</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-orange-600">⚠️ Inconvénients:</span>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1 space-y-1">
              <li>Prend plus de place verticalement</li>
              <li>Moins adapté pour comparaison rapide</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-600">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          💡 Quelle variante choisir ?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Pour la cohérence</strong> : Choisissez la <strong className="text-blue-600">Variante 1</strong> (Barres Groupées) car elle est identique au graphique mensuel.
            </p>
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              <strong>Pour mobile</strong> : Choisissez la <strong className="text-teal-600">Variante 5</strong> (Cartes) qui s'adapte parfaitement aux petits écrans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

