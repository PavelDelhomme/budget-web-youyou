import React, { useState } from 'react';
import { Modal } from './Modal';
import { TemporaryIncome } from '../types';
import { currency, parseAmount, toISODate, today } from '../utils';

interface RevenusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  temporaryIncomes: TemporaryIncome[];
  onUpdate: (incomes: TemporaryIncome[]) => Promise<void>;
}

export function RevenusManager({ isOpen, onClose, temporaryIncomes, onUpdate }: RevenusManagerProps) {
  const [incomes, setIncomes] = useState<TemporaryIncome[]>(temporaryIncomes || []);
  const [currentIncome, setCurrentIncome] = useState({
    name: '',
    type: 'allocation' as 'gift' | 'government_aid' | 'allocation' | 'bonus' | 'other',
    amount: 0,
    duration: 'permanent' as 'once' | 'months' | 'permanent', // 'permanent' pour les revenus permanents
    startDate: toISODate(today),
    endDate: '',
    numberOfMonths: 1,
    note: '',
  });

  // Update local state when props change
  React.useEffect(() => {
    setIncomes(temporaryIncomes || []);
  }, [temporaryIncomes]);

  const calculateEndDate = (startDate: string, months: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return toISODate(end);
  };

  function addIncome() {
    if (!currentIncome.name || currentIncome.amount === 0) return;
    
    const income: TemporaryIncome = {
      id: crypto.randomUUID(),
      name: currentIncome.name,
      type: currentIncome.type,
      amount: currentIncome.amount,
      duration: currentIncome.duration,
      startDate: currentIncome.startDate,
      numberOfMonths: currentIncome.duration === 'months' ? currentIncome.numberOfMonths : undefined,
      endDate: currentIncome.duration === 'months' ? calculateEndDate(currentIncome.startDate, currentIncome.numberOfMonths || 1) : undefined,
      note: currentIncome.note || undefined,
    };
    
    setIncomes([...incomes, income]);
    setCurrentIncome({
      name: '',
      type: 'allocation',
      amount: 0,
      duration: 'permanent',
      startDate: toISODate(today),
      endDate: '',
      numberOfMonths: 1,
      note: '',
    });
  }

  function removeIncome(id: string) {
    setIncomes(incomes.filter(ti => ti.id !== id));
  }

  async function handleSave() {
    await onUpdate(incomes);
    onClose();
  }

  if (!isOpen) return null;

  const totalMonthly = incomes
    .filter(inc => inc.duration === 'permanent' || inc.duration === 'months')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalOneTime = incomes
    .filter(inc => inc.duration === 'once')
    .reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Gérer mes revenus supplémentaires" closeable>
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Guide - Revenus supplémentaires</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Vous pouvez ajouter des revenus supplémentaires en plus de votre salaire mensuel :
            <br />
            <strong>• Permanents :</strong> Allocations, aides mensuelles récurrentes (ex: APL, RSA)
            <br />
            <strong>• Temporaires :</strong> Cadeaux, primes ponctuelles, aides ponctuelles
            <br />
            <strong>• Sur plusieurs mois :</strong> Revenus qui durent quelques mois
          </p>
        </div>

        {/* Form */}
        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-2 bg-white dark:bg-gray-800">
          <label className="block text-sm font-medium text-gray-900 dark:text-white">Nom / Description</label>
          <input
            type="text"
            value={currentIncome.name}
            onChange={(e) => setCurrentIncome({ ...currentIncome, name: e.target.value })}
            placeholder="Ex: Allocation logement (APL), Aide de l'État, Prime annuelle"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />

          <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
          <select
            value={currentIncome.type}
            onChange={(e) => setCurrentIncome({ ...currentIncome, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="allocation">Allocation (APL, RSA, etc.)</option>
            <option value="government_aid">Aide de l'État</option>
            <option value="gift">Cadeau</option>
            <option value="bonus">Prime / Bonus</option>
            <option value="other">Autre</option>
          </select>

          <label className="block text-sm font-medium text-gray-900 dark:text-white">Montant (€)</label>
          <input
            type="text"
            value={currentIncome.amount || ''}
            onChange={(e) =>
              setCurrentIncome({
                ...currentIncome,
                amount: parseAmount(e.target.value) || 0,
              })
            }
            placeholder="Ex: 200,00 ou 200.00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />

          <label className="block text-sm font-medium text-gray-900 dark:text-white">Durée</label>
          <select
            value={currentIncome.duration}
            onChange={(e) => {
              const newDuration = e.target.value as 'once' | 'months' | 'permanent';
              setCurrentIncome({
                ...currentIncome,
                duration: newDuration,
                endDate: newDuration === 'months' ? calculateEndDate(currentIncome.startDate, currentIncome.numberOfMonths || 1) : '',
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="permanent">Permanent (mensuel récurrent)</option>
            <option value="once">Une seule fois</option>
            <option value="months">Sur plusieurs mois</option>
          </select>

          <label className="block text-sm font-medium text-gray-900 dark:text-white">Date de début</label>
          <input
            type="date"
            value={currentIncome.startDate}
            onChange={(e) => {
              const newStartDate = e.target.value;
              setCurrentIncome({
                ...currentIncome,
                startDate: newStartDate,
                endDate: currentIncome.duration === 'months' 
                  ? calculateEndDate(newStartDate, currentIncome.numberOfMonths || 1)
                  : currentIncome.endDate,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />

          {currentIncome.duration === 'months' && (
            <>
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Nombre de mois</label>
              <input
                type="number"
                min="1"
                value={currentIncome.numberOfMonths || 1}
                onChange={(e) => {
                  const months = parseInt(e.target.value) || 1;
                  setCurrentIncome({
                    ...currentIncome,
                    numberOfMonths: months,
                    endDate: calculateEndDate(currentIncome.startDate, months),
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              {currentIncome.endDate && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Date de fin calculée : {new Date(currentIncome.endDate).toLocaleDateString('fr-FR')}
                </p>
              )}
            </>
          )}

          {currentIncome.duration === 'permanent' && (
            <p className="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded border border-blue-200 dark:border-blue-700">
              💡 Ce revenu sera comptabilisé chaque mois à partir de la date de début.
            </p>
          )}

          <label className="block text-sm font-medium text-gray-900 dark:text-white">Note (optionnel)</label>
          <input
            type="text"
            value={currentIncome.note}
            onChange={(e) => setCurrentIncome({ ...currentIncome, note: e.target.value })}
            placeholder="Informations complémentaires"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />

          <button
            onClick={addIncome}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Ajouter
          </button>
        </div>

        {/* List */}
        {incomes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">Revenus supplémentaires :</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {incomes.map((ti) => (
                <div key={ti.id} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{ti.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ti.type === 'gift' ? 'Cadeau' : 
                       ti.type === 'government_aid' ? 'Aide de l\'État' : 
                       ti.type === 'allocation' ? 'Allocation' :
                       ti.type === 'bonus' ? 'Prime' : 'Autre'} • 
                      {ti.duration === 'permanent' ? ' Permanent' :
                       ti.duration === 'once' ? ' Une fois' : 
                       ` ${ti.numberOfMonths} mois`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Du {new Date(ti.startDate).toLocaleDateString('fr-FR')}
                      {ti.endDate && ` au ${new Date(ti.endDate).toLocaleDateString('fr-FR')}`}
                      {ti.duration === 'permanent' && ' (récurrent)'}
                    </div>
                    {ti.note && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: {ti.note}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">{currency(ti.amount)}</span>
                      {ti.duration === 'permanent' && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 block">/mois</span>
                      )}
                      {ti.duration === 'months' && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 block">
                          /mois = {currency((ti.amount * (ti.numberOfMonths || 1)))} total
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeIncome(ti.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <p className="text-sm text-gray-900 dark:text-white">
                <strong>Total mensuel récurrent :</strong> {currency(totalMonthly)}/mois
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                <strong>Total ponctuel :</strong> {currency(totalOneTime)}
              </p>
            </div>
          </div>
        )}

        {incomes.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
            Aucun revenu supplémentaire défini. Vous pouvez en ajouter ci-dessus.
          </p>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            ✅ Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  );
}

