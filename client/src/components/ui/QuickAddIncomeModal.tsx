import { useState } from 'react';
import { Modal } from '../layout/Modal';
import { TemporaryIncome } from '../../core/types';
import { toISODate, parseAmount, today } from '../../lib/utils';

interface QuickAddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: (income: TemporaryIncome) => void;
}

export function QuickAddIncomeModal({
  isOpen,
  onClose,
  onAddIncome,
}: QuickAddIncomeModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'gift' | 'government_aid' | 'allocation' | 'bonus' | 'other'>('other');
  const [duration, setDuration] = useState<'once' | 'months' | 'permanent'>('once');
  const [startDate, setStartDate] = useState(toISODate(today));
  const [endDate, setEndDate] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseAmount(amount);
    if (!totalAmount || totalAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    if (!name.trim()) {
      alert('Veuillez entrer un nom');
      return;
    }

    const income: TemporaryIncome = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      amount: totalAmount,
      duration,
      startDate,
      endDate: duration === 'months' ? (endDate || calculateEndDate(startDate, numberOfMonths)) : undefined,
      numberOfMonths: duration === 'months' ? numberOfMonths : undefined,
      note: note.trim() || undefined,
    };

    onAddIncome(income);

    // Reset form
    setName('');
    setAmount('');
    setType('other');
    setDuration('once');
    setStartDate(toISODate(today));
    setEndDate('');
    setNumberOfMonths(1);
    setNote('');
    onClose();
  };

  const calculateEndDate = (start: string, months: number) => {
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return toISODate(endDate);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Ajouter un revenu rapide">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type de revenu */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Catégorie de revenu *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          >
            <option value="allocation">Allocation chômage / CAF</option>
            <option value="government_aid">Aide gouvernementale</option>
            <option value="bonus">Prime / Bonus</option>
            <option value="gift">Cadeau</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Nom *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Allocation chômage, Prime exceptionnelle..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            autoFocus
            required
          />
        </div>

        {/* Montant */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Montant {duration !== 'once' ? 'mensuel' : ''} (€) *
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg"
            required
          />
        </div>

        {/* Durée */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDuration('once')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                duration === 'once'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
              }`}
            >
              Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setDuration('months')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                duration === 'months'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
              }`}
            >
              Temporaire
            </button>
            <button
              type="button"
              onClick={() => setDuration('permanent')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                duration === 'permanent'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
              }`}
            >
              Permanent
            </button>
          </div>
        </div>

        {/* Date de début */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Date de début *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Durée en mois (si temporaire) */}
        {duration === 'months' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
              Nombre de mois *
            </label>
            <input
              type="number"
              min="1"
              value={numberOfMonths}
              onChange={(e) => {
                const months = parseInt(e.target.value) || 1;
                setNumberOfMonths(months);
                setEndDate(calculateEndDate(startDate, months));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            />
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Note (optionnel)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Prime exceptionnelle, Allocation..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
          >
            Ajouter
          </button>
        </div>
      </form>
    </Modal>
  );
}
