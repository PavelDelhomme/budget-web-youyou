import { useState } from 'react';
import { YearData } from '../../../core/types';
import { AnnualChartVariant1 } from './variants/Variant1_GroupedBars';
import { AnnualChartVariant2 } from './variants/Variant2_AreaChart';
import { AnnualChartVariant3 } from './variants/Variant3_StackedBars';
import { AnnualChartVariant4 } from './variants/Variant4_Radar';
import { AnnualChartVariant5 } from './variants/Variant5_Cards';

interface AnnualChartVariantsDemoProps {
  historicalData: Array<{ year: number; data: YearData }>;
  globalData?: {
    monthlySalary?: number;
    temporaryIncomes?: Array<{ amount: number; startDate: string; endDate?: string; duration: string }>;
    salaryHistory?: Array<{ id: string; amount: number; startDate: string; endDate?: string; type: string }>;
  };
}

export function AnnualChartVariantsDemo({ historicalData, globalData }: AnnualChartVariantsDemoProps) {
  const [selectedVariant, setSelectedVariant] = useState<number>(1);

  const variants = [
    {
      id: 1,
      name: 'Variante 1 : Barres Groupées',
      description: 'Barres côte à côte (cohérent avec mensuel)',
      component: AnnualChartVariant1,
    },
    {
      id: 2,
      name: 'Variante 2 : Lignes avec Zone',
      description: 'Area chart pour visualiser les tendances',
      component: AnnualChartVariant2,
    },
    {
      id: 3,
      name: 'Variante 3 : Barres Empilées',
      description: 'Barres empilées compactes',
      component: AnnualChartVariant3,
    },
    {
      id: 4,
      name: 'Variante 4 : Radar/Polaire',
      description: 'Graphique radar original',
      component: AnnualChartVariant4,
    },
    {
      id: 5,
      name: 'Variante 5 : Cartes Individuelles',
      description: 'Cartes détaillées par année',
      component: AnnualChartVariant5,
    },
  ];

  const SelectedComponent = variants.find(v => v.id === selectedVariant)?.component || AnnualChartVariant1;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Choix du Graphique Annuel
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sélectionnez la variante qui vous convient le mieux pour afficher l'évolution des dépenses et revenus par année.
        </p>
      </div>

      {/* Variants Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedVariant === variant.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="text-sm font-semibold">{variant.name.split(' : ')[1]}</div>
              <div className={`text-xs ${selectedVariant === variant.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {variant.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Variant Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {variants.find(v => v.id === selectedVariant)?.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {variants.find(v => v.id === selectedVariant)?.description}
          </p>
        </div>
        <SelectedComponent historicalData={historicalData} globalData={globalData} />
      </div>

      {/* All Variants Preview (Compact) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aperçu de toutes les variantes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant) => {
            const VariantComponent = variant.component;
            return (
              <div
                key={variant.id}
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  selectedVariant === variant.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedVariant(variant.id)}
              >
                <div className="mb-2">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    Variante {variant.id}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {variant.name.split(' : ')[1]}
                  </div>
                </div>
                <div className="h-48 overflow-hidden rounded bg-gray-50 dark:bg-gray-900/50">
                  <VariantComponent historicalData={historicalData} globalData={globalData} height={200} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

