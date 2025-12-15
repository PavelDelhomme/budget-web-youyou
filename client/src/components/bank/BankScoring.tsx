import React, { useState, useEffect } from 'react';
import { Api } from '../../core/api';

interface BankScore {
  score: number;
  risk_level: string;
  indicators: {
    scores: {
      debt_ratio: number;
      savings_capacity: number;
      income_stability: number;
      assets: number;
      expense_regularity: number;
      savings_rate: number;
    };
    values: {
      debt_ratio: number;
      savings_capacity: number;
      income_stability: number;
      total_assets: number;
      expense_regularity: number;
      savings_rate: number;
    };
  };
  recommendations: Array<{
    type: 'success' | 'info' | 'warning' | 'error';
    category: string;
    title: string;
    message: string;
  }>;
  calculation_date: string;
}

interface BankScoringProps {
  year?: number;
}

const RISK_LEVEL_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  bon: { label: 'Bon', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  moyen: { label: 'Moyen', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  faible: { label: 'Faible', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  tres_faible: { label: 'Très faible', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

const RECOMMENDATION_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: '✅' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'ℹ️' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: '⚠️' },
  error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '❌' },
};

export function BankScoring({ year }: BankScoringProps) {
  const [scoreData, setScoreData] = useState<BankScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScore();
  }, [year]);

  async function loadScore() {
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getBankScore(year);
      setScoreData(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement du score bancaire:', err);
      setError(err?.message || 'Impossible de charger le score bancaire');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Score Bancaire</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const riskInfo = RISK_LEVEL_LABELS[scoreData.risk_level] || RISK_LEVEL_LABELS.moyen;
  const scorePercentage = (scoreData.score / 1000) * 100;

  // Couleur du score basée sur le niveau
  const scoreColorClass = 
    scoreData.score >= 800 ? 'text-green-600 dark:text-green-400' :
    scoreData.score >= 650 ? 'text-blue-600 dark:text-blue-400' :
    scoreData.score >= 500 ? 'text-yellow-600 dark:text-yellow-400' :
    scoreData.score >= 350 ? 'text-orange-600 dark:text-orange-400' :
    'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Score Bancaire</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
          {riskInfo.label}
        </span>
      </div>

      {/* Score principal */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-2">
          <div className={`text-5xl font-bold ${scoreColorClass}`}>
            {scoreData.score}
          </div>
          <div className="ml-2 text-gray-500 dark:text-gray-400">/ 1000</div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              scoreData.score >= 800 ? 'bg-green-500' :
              scoreData.score >= 650 ? 'bg-blue-500' :
              scoreData.score >= 500 ? 'bg-yellow-500' :
              scoreData.score >= 350 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${scorePercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Indicateurs détaillés */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Ratio d'endettement</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(scoreData.indicators.values.debt_ratio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.debt_ratio / 300) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Capacité d'épargne</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(scoreData.indicators.values.savings_capacity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.savings_capacity / 200) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Stabilité revenus</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(scoreData.indicators.values.income_stability * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.income_stability / 150) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Actifs totaux</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {scoreData.indicators.values.total_assets.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.assets / 150) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Régularité dépenses</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(scoreData.indicators.values.expense_regularity * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.expense_regularity / 100) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Taux d'épargne</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(scoreData.indicators.values.savings_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full"
                style={{ width: `${(scoreData.indicators.scores.savings_rate / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      {scoreData.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-gray-100">Recommandations</h4>
          <div className="space-y-2">
            {scoreData.recommendations.map((rec, idx) => {
              const colors = RECOMMENDATION_COLORS[rec.type] || RECOMMENDATION_COLORS.info;
              return (
                <div
                  key={idx}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-3`}
                >
                  <div className="flex items-start">
                    <span className="mr-2 text-lg">{colors.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {rec.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {rec.message}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Calculé le {new Date(scoreData.calculation_date).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}

