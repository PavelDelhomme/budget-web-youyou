import { useState, useEffect } from 'react';
import { Api } from '../api';
import { currency } from '../utils';

interface MLTrainingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface YearStatistics {
  num_categories: number;
  categories_with_budget: number;
  categories_total_budget: number;
  num_expenses: number;
  expenses_total: number;
  expenses_by_category: Record<string, number>;
  num_subscriptions: number;
  subscriptions_annual: number;
  monthly_salary: number;
  annual_salary: number;
  num_fixed_expenses: number;
  fixed_expenses_total: number;
  current_savings: number;
  total_expenses_estimated: number;
  estimated_savings: number;
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
    statistics?: YearStatistics;
    missing_fields?: string[];
    field_completeness?: Record<string, number>;
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
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [manualValidations, setManualValidations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadModelInfo();
      validateData();
    }
  }, [isOpen]);

  const loadModelInfo = async () => {
    try {
      const response = await fetch('/api/ml/info', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setModelInfo({ model_info: { is_trained: false }, historical_years_available: 0 });
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors du chargement' }));
        setError(errorData.error || 'Erreur lors du chargement');
        return;
      }
      
      const data = await response.json();
      setModelInfo(data);
    } catch (err: any) {
      console.error('Error loading model info:', err);
      // Set default model info on error
      setModelInfo({ model_info: { is_trained: false }, historical_years_available: 0 });
    }
  };

  const validateData = async () => {
    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ml/validate-data', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Return default validation result if endpoint doesn't exist
          setValidationResult({
            is_ready_for_training: false,
            years_validated: 0,
            valid_years: 0,
            total_errors: 0,
            total_warnings: 0,
            average_completeness: 0,
            year_results: [],
            recommendations: ['Le service de validation n\'est pas disponible.'],
          });
          setIsValidating(false);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Erreur lors de la validation' }));
        setError(errorData.error || 'Erreur lors de la validation');
        setIsValidating(false);
        return;
      }
      
      const data = await response.json();
      
      // Ensure all required fields exist and enrich with defaults
      const enrichedYearResults = (data.year_results || []).map((result: any) => ({
        ...result,
        statistics: result.statistics || {},
        missing_fields: result.missing_fields || [],
        field_completeness: result.field_completeness || {},
      }));
      
      setValidationResult({
        is_ready_for_training: data.is_ready_for_training || false,
        years_validated: data.years_validated || 0,
        valid_years: data.valid_years || 0,
        total_errors: data.total_errors || 0,
        total_warnings: data.total_warnings || 0,
        average_completeness: data.average_completeness || 0,
        year_results: enrichedYearResults,
        recommendations: data.recommendations || [],
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
      // Set default validation result on error
      setValidationResult({
        is_ready_for_training: false,
        years_validated: 0,
        valid_years: 0,
        total_errors: 0,
        total_warnings: 0,
        average_completeness: 0,
        year_results: [],
        recommendations: ['Erreur lors de la validation des données.'],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isReadyForTrainingWithManualValidation = () => {
    if (!validationResult) return false;
    
    // If manually validated years exist, check them
    const manuallyValidatedYears = Object.keys(manualValidations).length;
    if (manuallyValidatedYears > 0) {
      const validManualYears = Object.values(manualValidations).filter(v => v === true).length;
      return validManualYears >= 2; // Need at least 2 valid years
    }
    
    // Otherwise use automatic validation
    return validationResult.is_ready_for_training;
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
              {validationResult.year_results && validationResult.year_results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Détails par année :
                  </h4>
                  {validationResult.year_results.map((result) => {
                    const isExpanded = expandedYears.has(result.year);
                    const manuallyValidated = manualValidations[result.year];
                    const isEffectivelyValid = manuallyValidated !== undefined ? manuallyValidated : result.is_valid;
                    const completenessColor = result.completeness_score >= 0.7 ? 'green' : result.completeness_score >= 0.5 ? 'yellow' : 'red';
                    
                    return (
                      <div
                        key={result.year}
                        className={`p-3 rounded-lg border ${
                          isEffectivelyValid
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">
                              Année {result.year} {isEffectivelyValid ? '✓' : '✗'}
                              {manuallyValidated !== undefined && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                                  Validation manuelle
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`font-medium ${
                                completenessColor === 'green' ? 'text-green-600 dark:text-green-400' :
                                completenessColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {Math.round(result.completeness_score * 100)}% complète
                              </span>
                              {result.statistics && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  {result.statistics.num_expenses} dépense(s) • {result.statistics.num_categories} catégorie(s)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newValidations = { ...manualValidations };
                                if (manuallyValidated === true) {
                                  delete newValidations[result.year];
                                } else {
                                  newValidations[result.year] = true;
                                }
                                setManualValidations(newValidations);
                              }}
                              className={`px-3 py-1 text-xs rounded ${
                                manuallyValidated === true
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {manuallyValidated === true ? '✓ Validé' : 'Valider'}
                            </button>
                            <button
                              onClick={() => {
                                const newValidations = { ...manualValidations };
                                if (manuallyValidated === false) {
                                  delete newValidations[result.year];
                                } else {
                                  newValidations[result.year] = false;
                                }
                                setManualValidations(newValidations);
                              }}
                              className={`px-3 py-1 text-xs rounded ${
                                manuallyValidated === false
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {manuallyValidated === false ? '✗ Invalide' : 'Invalider'}
                            </button>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedYears);
                                if (isExpanded) {
                                  newExpanded.delete(result.year);
                                } else {
                                  newExpanded.add(result.year);
                                }
                                setExpandedYears(newExpanded);
                              }}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {isExpanded ? '▼ Réduire' : '▶ Détails'}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            {/* Statistics */}
                            {result.statistics && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Salaire annuel</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {currency(result.statistics.annual_salary)}
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Dépenses totales</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {currency(result.statistics.expenses_total || result.statistics.total_expenses_estimated)}
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Épargne estimée</div>
                                  <div className={`font-semibold ${
                                    result.statistics.estimated_savings >= 0
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {currency(result.statistics.estimated_savings)}
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Catégories avec budget</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {result.statistics.categories_with_budget}/{result.statistics.num_categories}
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Abonnements annuels</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {currency(result.statistics.subscriptions_annual)}
                                  </div>
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">Dépenses fixes</div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {currency(result.statistics.fixed_expenses_total)}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Field Completeness */}
                            {result.field_completeness && (
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                  Complétude par champ :
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(result.field_completeness).map(([field, score]) => (
                                    <div key={field} className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-gray-600 dark:text-gray-400 capitalize">
                                            {field.replace(/([A-Z])/g, ' $1').trim()}:
                                          </span>
                                          <span className="font-semibold">{Math.round(score * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                          <div
                                            className={`h-2 rounded-full ${
                                              score >= 0.7 ? 'bg-green-500' :
                                              score >= 0.5 ? 'bg-yellow-500' :
                                              'bg-red-500'
                                            }`}
                                            style={{ width: `${score * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Missing Fields */}
                            {result.missing_fields && result.missing_fields.length > 0 && (
                              <div>
                                <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">
                                  Champs manquants :
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {result.missing_fields.map((field) => (
                                    <span
                                      key={field}
                                      className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded text-xs"
                                    >
                                      {field.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Global Recommendations */}
              {validationResult.recommendations && validationResult.recommendations.length > 0 && (
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
                isReadyForTrainingWithManualValidation()
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isReadyForTrainingWithManualValidation() ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <div className="flex-1">
                        <div className="font-semibold text-green-900 dark:text-green-300">
                          Prêt pour l'entraînement !
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-400">
                          {Object.keys(manualValidations).length > 0 ? (
                            <>
                              {Object.values(manualValidations).filter(v => v === true).length} année(s) validée(s) manuellement.
                              Vos données sont suffisamment complètes pour entraîner le modèle IA.
                            </>
                          ) : (
                            'Vos données sont suffisamment complètes pour entraîner le modèle IA.'
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-900 dark:text-yellow-300">
                          Données insuffisantes
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-400">
                          {Object.keys(manualValidations).length > 0 ? (
                            <>
                              Vous devez valider au moins 2 années pour entraîner le modèle.
                              Actuellement : {Object.values(manualValidations).filter(v => v === true).length} année(s) validée(s).
                            </>
                          ) : (
                            'Corrigez les erreurs et complétez vos données avant d\'entraîner le modèle.'
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Show manual validation summary */}
                {Object.keys(manualValidations).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Validation manuelle :
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(manualValidations).map(([year, isValid]) => (
                        <span
                          key={year}
                          className={`px-2 py-1 rounded text-xs ${
                            isValid
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {year}: {isValid ? '✓ Validé' : '✗ Invalidé'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
              disabled={isTraining || !isReadyForTrainingWithManualValidation()}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {isTraining ? 'Entraînement...' : '🤖 Entraîner le Modèle'}
            </button>
          </div>

          {!isReadyForTrainingWithManualValidation() && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              💡 {Object.keys(manualValidations).length > 0 
                ? 'Vous devez valider au moins 2 années pour entraîner le modèle'
                : 'Corrigez les erreurs ci-dessus avant d\'entraîner le modèle'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

