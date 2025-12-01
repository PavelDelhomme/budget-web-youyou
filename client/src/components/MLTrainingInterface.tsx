import { useState, useEffect } from 'react';
import { Api } from '../api';
import { currency } from '../utils';

interface MLTrainingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationResult {
  is_ready_for_training: boolean;
  years_validated: number;
  valid_years: number;
  total_errors: number;
  total_warnings: number;
  average_completeness: number;
  year_results: Array<{
    year: number;
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    completeness_score: number;
    recommendations: string[];
  }>;
  recommendations: string[];
}

interface TrainingScores {
  total_expenses?: { mae: number; r2: number; rmse: number };
  annual_income?: { mae: number; r2: number; rmse: number };
  savings?: { mae: number; r2: number; rmse: number };
}

export function MLTrainingInterface({ isOpen, onClose }: MLTrainingInterfaceProps) {
  const [isTraining, setIsTraining] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [trainingScores, setTrainingScores] = useState<TrainingScores | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadModelInfo();
      validateData();
    }
  }, [isOpen]);

  const loadModelInfo = async () => {
    try {
      const response = await fetch('/api/ml/info');
      const data = await response.json();
      setModelInfo(data);
    } catch (err) {
      console.error('Error loading model info:', err);
    }
  };

  const validateData = async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ml/validate-data');
      const data = await response.json();
      setValidationResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ml/train', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setTrainingScores(data.training_scores);
        await loadModelInfo();
        await validateData();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'entraînement');
    } finally {
      setIsTraining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🤖 Interface d'Entraînement IA
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 Validation des Données
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Années validées</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {validationResult.years_validated}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  validationResult.total_errors > 0 
                    ? 'bg-red-50 dark:bg-red-900/30' 
                    : 'bg-green-50 dark:bg-green-900/30'
                }`}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Erreurs</div>
                  <div className={`text-xl font-bold ${
                    validationResult.total_errors > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {validationResult.total_errors}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  validationResult.total_warnings > 0 
                    ? 'bg-yellow-50 dark:bg-yellow-900/30' 
                    : 'bg-green-50 dark:bg-green-900/30'
                }`}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avertissements</div>
                  <div className={`text-xl font-bold ${
                    validationResult.total_warnings > 0 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {validationResult.total_warnings}
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Complétude</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(validationResult.average_completeness * 100)}%
                  </div>
                </div>
              </div>

              {/* Errors and Warnings by Year */}
              {validationResult.year_results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Détails par année :
                  </h4>
                  {validationResult.year_results.map((result) => (
                    <div
                      key={result.year}
                      className={`p-3 rounded-lg border ${
                        result.is_valid
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white mb-2">
                        Année {result.year} {result.is_valid ? '✓' : '✗'}
                        <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                          ({Math.round(result.completeness_score * 100)}% complète)
                        </span>
                      </div>
                      
                      {result.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                            Erreurs :
                          </div>
                          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                            {result.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.warnings.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                            Avertissements :
                          </div>
                          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            {result.warnings.map((warn, idx) => (
                              <li key={idx}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.recommendations.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            Recommandations :
                          </div>
                          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Global Recommendations */}
              {validationResult.recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    💡 Recommandations globales :
                  </div>
                  <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    {validationResult.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ready for Training Status */}
              <div className={`mt-4 p-4 rounded-lg ${
                validationResult.is_ready_for_training
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-2">
                  {validationResult.is_ready_for_training ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <div>
                        <div className="font-semibold text-green-900 dark:text-green-300">
                          Prêt pour l'entraînement !
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-400">
                          Vos données sont suffisamment complètes pour entraîner le modèle IA.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="font-semibold text-yellow-900 dark:text-yellow-300">
                          Données insuffisantes
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-400">
                          Corrigez les erreurs et complétez vos données avant d'entraîner le modèle.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Model Info */}
          {modelInfo && (
            <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📈 État du Modèle
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Statut</div>
                  <div className={`font-semibold ${
                    modelInfo.model_info?.is_trained
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {modelInfo.model_info?.is_trained ? '✅ Entraîné' : '❌ Non entraîné'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Années disponibles</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {modelInfo.historical_years_available}
                  </div>
                </div>
              </div>

              {/* Training Scores */}
              {trainingScores && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">
                    Scores d'entraînement :
                  </div>
                  <div className="space-y-2 text-sm">
                    {Object.entries(trainingScores).map(([key, scores]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          R²: {scores.r2?.toFixed(3) || 'N/A'} | MAE: {scores.mae?.toFixed(2) || 'N/A'}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200 font-semibold">Erreur :</div>
              <div className="text-red-700 dark:text-red-300">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={validateData}
              disabled={isValidating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isValidating ? 'Validation...' : '🔄 Revalider les Données'}
            </button>
            
            <button
              onClick={handleTrain}
              disabled={isTraining || !validationResult?.is_ready_for_training}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isTraining ? 'Entraînement...' : '🤖 Entraîner le Modèle'}
            </button>
          </div>

          {!validationResult?.is_ready_for_training && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              💡 Corrigez les erreurs ci-dessus avant d'entraîner le modèle
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

