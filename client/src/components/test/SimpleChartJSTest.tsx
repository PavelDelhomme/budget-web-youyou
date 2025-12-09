import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Plugin pour le remplissage sous les lignes
} from 'chart.js';
import { useEffect, useRef } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler // Enregistrer le plugin Filler
);

// Fonction pour afficher les montants au-dessus des barres
function addDataLabels(chart: any) {
  // Gérer différentes structures d'instance Chart.js
  const chartInstance = chart?.chart || chart;
  if (!chartInstance || !chartInstance.ctx) return;
  
  const ctx = chartInstance.ctx;
  const datasets = chartInstance.data?.datasets || chart.data?.datasets;
  if (!datasets) return;
  
  datasets.forEach((dataset: any, datasetIndex: number) => {
    const meta = chartInstance.getDatasetMeta?.(datasetIndex);
    if (!meta || !meta.data) return;
    
    meta.data.forEach((bar: any, index: number) => {
      const value = dataset.data?.[index];
      if (value && value > 0 && bar && typeof bar.x === 'number' && typeof bar.y === 'number') {
        const x = bar.x;
        const y = bar.y;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Couleur adaptée selon le dataset (vert pour revenus, rouge pour dépenses)
        ctx.fillStyle = datasetIndex === 0 ? '#059669' : '#DC2626';
        ctx.font = 'bold 11px Arial';
        // Positionner le texte au-dessus de la barre
        ctx.fillText(Math.round(value) + '€', x, y - 8);
        ctx.restore();
      }
    });
  });
}

// Composant Bar personnalisé avec labels
function BarChartWithLabels({ data, options }: { data: any; options: any }) {
  const chartRef = useRef<any>(null);
  
  useEffect(() => {
    const drawLabels = () => {
      if (!chartRef.current) return;
      
      // Dans react-chartjs-2 v5, l'instance peut être dans différentes propriétés
      const instance = (chartRef.current as any);
      const chartInstance = instance?.chartInstance || instance?.chart || instance;
      
      if (chartInstance && chartInstance.ctx) {
        addDataLabels(chartInstance);
        // Forcer le redessin
        chartInstance.update('none');
      }
    };
    
    // Plusieurs tentatives pour s'assurer que le graphique est rendu
    const timers = [
      setTimeout(drawLabels, 100),
      setTimeout(drawLabels, 500),
      setTimeout(drawLabels, 1000),
    ];
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [data]);
  
  return (
    <Bar
      ref={chartRef}
      data={data}
      options={{
        ...options,
        animation: {
          duration: 800,
          onComplete: (chart: any) => {
            addDataLabels(chart);
          },
        },
        plugins: {
          ...options.plugins,
          afterDraw: (chart: any) => {
            addDataLabels(chart);
          },
        },
      }}
    />
  );
}

export function SimpleChartJSTest() {
  // Données pour 12 mois (pour tester le scroll)
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  const simpleBarData = {
    labels: months,
    datasets: [
      {
        label: 'Revenus',
        data: [2000, 2500, 2300, 2800, 2200, 2700, 2600, 2900, 2400, 3000, 2800, 3100],
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
      },
      {
        label: 'Dépenses',
        data: [1800, 2000, 1900, 2100, 1950, 2050, 2000, 2200, 1850, 2300, 2100, 2400],
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        borderWidth: 1,
      },
    ],
  };

  const simpleLineData = {
    labels: months,
    datasets: [
      {
        label: 'Solde',
        data: [200, 500, 400, 700, 250, 650, 600, 700, 550, 700, 700, 700],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Données pour graphique simple (1 seule série)
  const simpleSingleBarData = {
    labels: months,
    datasets: [
      {
        label: 'Dépenses mensuelles',
        data: [1800, 2000, 1900, 2100, 1950, 2050, 2000, 2200, 1850, 2300, 2100, 2400],
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Graphique en barres SIMPLE - Chart.js (doit partir de 0€) - 12 mois',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true, // CRITICAL: Doit forcer à partir de 0
        min: 0, // Force explicitement le minimum à 0
        grace: 0, // Pas de marge de grâce
        afterDataLimits: (scale: any) => {
          // Forcer explicitement le minimum à 0
          scale.min = 0;
        },
        ticks: {
          callback: function(value: any) {
            return value + '€';
          },
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Graphique en ligne SIMPLE - Chart.js (doit partir de 0€) - 12 mois',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true, // CRITICAL: Doit forcer à partir de 0
        min: 0, // Force explicitement le minimum à 0
        grace: 0, // Pas de marge de grâce
        afterDataLimits: (scale: any) => {
          // Forcer explicitement le minimum à 0
          scale.min = 0;
        },
        ticks: {
          callback: function(value: any) {
            return value + '€';
          },
        },
      },
    },
  };

  const singleBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Graphique en barres SIMPLE (1 série) - Chart.js - 12 mois',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        grace: 0,
        afterDataLimits: (scale: any) => {
          scale.min = 0;
        },
        ticks: {
          callback: function(value: any) {
            return value + '€';
          },
        },
      },
    },
  };

  // Options pour Graphique 1 Bis avec montants sur les barres
  const barOptionsWithLabels = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Graphique 1 Bis - Barres groupées AVEC MONTANTS (doit partir de 0€) - 12 mois',
        font: {
          size: 16,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}€`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        grace: 0,
        afterDataLimits: (scale: any) => {
          scale.min = 0;
        },
        ticks: {
          callback: function(value: any) {
            return value + '€';
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
        <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
          ⚠️ Test Simple Chart.js
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Graphiques Chart.js très simples pour comparer (12 mois). Si ceux-ci partent de 0€ mais pas les autres, 
          c'est un problème de configuration dans MonthlyExpensesIncomeChartChartJS.
        </p>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
          💡 Les graphiques sont scrollables horizontalement si nécessaire. Les labels des mois sont inclinés pour meilleure lisibilité.
        </p>
      </div>

      {/* Graphique en barres groupées (2 séries) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Graphique 1 :</strong> Barres groupées (Revenus + Dépenses) - 12 mois
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar data={simpleBarData} options={barOptions} />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          📊 Faites défiler horizontalement pour voir tous les mois →
        </div>
      </div>

      {/* Graphique 1 Bis - Barres groupées AVEC MONTANTS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border-2 border-purple-300 dark:border-purple-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Graphique 1 Bis :</strong> Barres groupées (Revenus + Dépenses) <span className="font-bold text-purple-600 dark:text-purple-400">AVEC MONTANTS</span> - 12 mois
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <BarChartWithLabels data={simpleBarData} options={barOptionsWithLabels} />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          📊 Faites défiler horizontalement pour voir tous les mois → | 💰 Montants affichés au-dessus des barres
        </div>
      </div>

      {/* Graphique en ligne */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Graphique 2 :</strong> Ligne (Solde) - 12 mois
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Line data={simpleLineData} options={lineOptions} />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          📊 Faites défiler horizontalement pour voir tous les mois →
        </div>
      </div>

      {/* Graphique en barres simple (1 série) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Graphique 3 :</strong> Barres simples (1 série - Dépenses) - 12 mois
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar data={simpleSingleBarData} options={singleBarOptions} />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          📊 Faites défiler horizontalement pour voir tous les mois →
        </div>
      </div>

      {/* Graphiques de test manuels - Différentes configurations */}
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
          🧪 Graphiques de Test Manuels - Différentes Configurations
        </h3>
        <p className="text-sm text-green-800 dark:text-green-200">
          Testez ces graphiques pour voir lesquels fonctionnent correctement (partent de 0€, bien alignés, etc.)
        </p>
      </div>

      {/* Test 1 : Configuration minimale - beginAtZero seulement */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 1 :</strong> Configuration minimale (beginAtZero seulement)
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={simpleBarData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Test 2 : beginAtZero + min: 0 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 2 :</strong> beginAtZero + min: 0
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={simpleBarData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Test 3 : beginAtZero + min: 0 + grace: 0 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 3 :</strong> beginAtZero + min: 0 + grace: 0
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={simpleBarData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                    grace: 0,
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Test 4 : avec afterDataLimits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 4 :</strong> beginAtZero + min: 0 + afterDataLimits
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={simpleBarData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                    afterDataLimits: (scale: any) => {
                      scale.min = 0;
                    },
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Test 5 : Configuration complète (comme dans barOptions) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 5 :</strong> Configuration complète (comme Graphique 1)
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={simpleBarData} 
              options={barOptions} 
            />
          </div>
        </div>
      </div>

      {/* Test 7 : Données très petites (test si ça part bien de 0) - CORRIGÉ 12 mois */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 7 :</strong> Données très petites (100-500€) - Test alignement 0€ - 12 mois
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Revenus',
                    data: [200, 300, 250, 350, 280, 320, 270, 380, 290, 400, 310, 420],
                    backgroundColor: '#10B981',
                  },
                  {
                    label: 'Dépenses',
                    data: [150, 200, 180, 250, 220, 280, 230, 300, 240, 320, 260, 350],
                    backgroundColor: '#EF4444',
                  },
                ],
              }} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                      callback: function(value: any) {
                        return value + '€';
                      },
                    },
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Test 8 : Données très grandes (5000-10000€) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>Test 8 :</strong> Données très grandes (5000-10000€) - Test alignement 0€
        </div>
        <div className="w-full overflow-x-auto" style={{ maxHeight: '450px' }}>
          <div style={{ minWidth: '800px', height: '400px' }}>
            <Bar 
              data={{
                labels: months,
                datasets: [
                  {
                    label: 'Revenus',
                    data: [6000, 7000, 6500, 8000, 7500, 8500, 7200, 9000, 6800, 9500, 8800, 10000],
                    backgroundColor: '#10B981',
                  },
                  {
                    label: 'Dépenses',
                    data: [5500, 6200, 5800, 6800, 6000, 7000, 6500, 7200, 5900, 7500, 7000, 8000],
                    backgroundColor: '#EF4444',
                  },
                ],
              }} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                      callback: function(value: any) {
                        return value + '€';
                      },
                    },
                  },
                  x: {
                    ticks: { maxRotation: 45, minRotation: 45 },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
          📋 Options de test disponibles :
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li><strong>beginAtZero: true</strong> - Force le départ à 0€</li>
          <li><strong>min: 0</strong> - Minimum explicite à 0</li>
          <li><strong>grace: 0</strong> - Pas de marge de grâce</li>
          <li><strong>afterDataLimits</strong> - Force min à 0 dans le scale</li>
          <li><strong>Labels inclinés</strong> - Rotation de 45° pour lisibilité</li>
          <li><strong>Scroll horizontal</strong> - Pour voir tous les 12 mois</li>
          <li><strong>Responsive</strong> - S'adapte à la largeur d'écran</li>
        </ul>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 font-semibold">
          💡 Dites-moi quels graphiques partent correctement de 0€ et lesquels non, je pourrai alors ajuster la configuration !
        </p>
      </div>
    </div>
  );
}

