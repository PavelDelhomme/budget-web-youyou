import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { currency } from '../utils';

interface TaxManagerProps {
  isOpen: boolean;
  onClose: () => void;
  annualIncome?: number;
  onTaxCalculated?: (taxAmount: number) => void;
}

interface FiscalSituation {
  annual_income: number;
  parts: number;
  children: number;
  marital_status: 'single' | 'married' | 'pacs';
  year: number;
}

interface TaxCalculation {
  impot_revenu: number;
  revenu_fiscal_reference: number;
  income_per_part: number;
  monthly_tax: number;
  net_income_after_tax: number;
  source: string;
}

export function TaxManager({ isOpen, onClose, annualIncome = 0, onTaxCalculated }: TaxManagerProps) {
  const [fiscalSituation, setFiscalSituation] = useState<FiscalSituation>({
    annual_income: annualIncome,
    parts: 1,
    children: 0,
    marital_status: 'single',
    year: new Date().getFullYear(),
  });

  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update annual income when prop changes
  useEffect(() => {
    if (annualIncome > 0) {
      setFiscalSituation(prev => ({ ...prev, annual_income: annualIncome }));
    }
  }, [annualIncome]);

  // Calculate parts based on marital status and children
  useEffect(() => {
    let parts = 1;
    
    if (fiscalSituation.marital_status === 'married' || fiscalSituation.marital_status === 'pacs') {
      parts = 2;
    }
    
    // Add parts for children
    parts += fiscalSituation.children * 0.5; // 0.5 part per child (first 2 children)
    if (fiscalSituation.children > 2) {
      parts += (fiscalSituation.children - 2) * 1; // 1 part per child after the 2nd
    }
    
    setFiscalSituation(prev => ({ ...prev, parts }));
  }, [fiscalSituation.marital_status, fiscalSituation.children]);

  const calculateTax = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch('/api/government/openfisca/calculate-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          annual_income: fiscalSituation.annual_income,
          situation: {
            year: fiscalSituation.year,
            parts: fiscalSituation.parts,
            children: fiscalSituation.children,
            marital_status: fiscalSituation.marital_status,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du calcul');
      }

      const calculation = data.calculation;
      const monthlyTax = calculation.impot_revenu / 12;
      const netIncomeAfterTax = fiscalSituation.annual_income - calculation.impot_revenu;

      setTaxCalculation({
        impot_revenu: calculation.impot_revenu,
        revenu_fiscal_reference: calculation.revenu_fiscal_reference || fiscalSituation.annual_income,
        income_per_part: calculation.income_per_part || fiscalSituation.annual_income / fiscalSituation.parts,
        monthly_tax: monthlyTax,
        net_income_after_tax: netIncomeAfterTax,
        source: calculation.source || 'simplified',
      });

      // Notify parent component
      if (onTaxCalculated) {
        onTaxCalculated(calculation.impot_revenu);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des impôts');
      console.error('Erreur calcul impôts:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const simulateSalary = async () => {
    if (fiscalSituation.annual_income <= 0) {
      setError('Revenu annuel requis');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const grossMonthlySalary = fiscalSituation.annual_income / 12;

      const response = await fetch('/api/government/entreprise/simulate-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gross_salary: grossMonthlySalary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la simulation');
      }

      // Update with simulation results
      const simulation = data.simulation;
      alert(`Simulation salaire:\n\nBrut: ${currency(simulation.gross_salary)}/mois\nNet (après cotisations): ${currency(simulation.net_salary)}/mois\n\nNote: ${simulation.note || 'Calcul approximatif'}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la simulation');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Gestion Fiscale et Impôts" closeable>
      <div className="space-y-6">
        {/* Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Guide - Calcul des impôts</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Calculez vos impôts sur le revenu en fonction de votre situation fiscale.
            <br />
            <strong>• Revenu annuel :</strong> Votre revenu imposable annuel
            <br />
            <strong>• Parts fiscales :</strong> Calculées automatiquement selon votre situation familiale
            <br />
            <strong>• Simulation :</strong> Utilise OpenFisca pour des calculs précis
          </p>
        </div>

        {/* Formulaire situation fiscale */}
        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-4 bg-white dark:bg-gray-800">
          <h4 className="font-semibold text-gray-900 dark:text-white">Situation Fiscale</h4>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Revenu annuel imposable (€)
            </label>
            <input
              type="text"
              value={fiscalSituation.annual_income || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                setFiscalSituation(prev => ({ ...prev, annual_income: value }));
              }}
              placeholder="Ex: 50000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            {annualIncome > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                💡 Revenu détecté depuis votre budget : {currency(annualIncome)}/an
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Situation familiale
            </label>
            <select
              value={fiscalSituation.marital_status}
              onChange={(e) =>
                setFiscalSituation(prev => ({
                  ...prev,
                  marital_status: e.target.value as 'single' | 'married' | 'pacs',
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="single">Célibataire</option>
              <option value="married">Marié(e)</option>
              <option value="pacs">Pacsé(e)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Nombre d'enfants à charge
            </label>
            <input
              type="number"
              min="0"
              value={fiscalSituation.children}
              onChange={(e) =>
                setFiscalSituation(prev => ({
                  ...prev,
                  children: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Année fiscale
            </label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={fiscalSituation.year}
              onChange={(e) =>
                setFiscalSituation(prev => ({
                  ...prev,
                  year: parseInt(e.target.value) || new Date().getFullYear(),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Calcul automatique des parts */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Parts fiscales calculées :</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-2">
                {fiscalSituation.parts.toFixed(1)} part{fiscalSituation.parts > 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revenu par part : {currency(fiscalSituation.annual_income / fiscalSituation.parts)}
            </div>
          </div>

          {/* Boutons actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={calculateTax}
              disabled={isCalculating || fiscalSituation.annual_income <= 0}
              className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculating ? 'Calcul en cours...' : '💰 Calculer les impôts'}
            </button>
            <button
              onClick={simulateSalary}
              disabled={isCalculating || fiscalSituation.annual_income <= 0}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              title="Simuler le calcul brut → net avec cotisations sociales"
            >
              📊 Simuler
            </button>
          </div>
        </div>

        {/* Résultats */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-red-800 dark:text-red-200 font-semibold">Erreur :</div>
            <div className="text-red-700 dark:text-red-300 text-sm">{error}</div>
          </div>
        )}

        {taxCalculation && (
          <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-3 bg-white dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white">📊 Résultats du Calcul</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Impôt sur le revenu</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-200">
                  {currency(taxCalculation.impot_revenu)}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {currency(taxCalculation.monthly_tax)}/mois
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-700">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1">Revenu net après impôts</div>
                <div className="text-xl font-bold text-green-900 dark:text-green-200">
                  {currency(taxCalculation.net_income_after_tax)}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {currency(taxCalculation.net_income_after_tax / 12)}/mois
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Revenu fiscal de référence</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currency(taxCalculation.revenu_fiscal_reference)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Revenu par part</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currency(taxCalculation.income_per_part)}
                </div>
              </div>
            </div>

            {taxCalculation.source === 'simplified' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mt-3">
                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ Calcul simplifié. Pour une précision maximale, utilisez OpenFisca ou consultez votre déclaration d'impôts.
                </div>
              </div>
            )}

            <div className="pt-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                💡 Impact sur votre budget mensuel :
              </h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Revenu brut mensuel :</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {currency(fiscalSituation.annual_income / 12)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Impôt mensuel estimé :</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{currency(taxCalculation.monthly_tax)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white font-semibold">Revenu net mensuel :</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {currency(taxCalculation.net_income_after_tax / 12)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

