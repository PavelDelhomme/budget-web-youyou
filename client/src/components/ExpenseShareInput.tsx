import { useState, useEffect } from 'react';
import { ExpenseShare } from '../types';
import { parseAmount, currency } from '../utils';

interface ExpenseShareInputProps {
  totalAmount: number;
  onShareChange: (share: ExpenseShare | undefined) => void;
  initialShare?: ExpenseShare;
  className?: string;
}

/**
 * Composant pour gérer le partage d'une dépense par parts
 * Ex: Loyer de 1000€ partagé en 2, je paie 1 part = 500€
 */
export function ExpenseShareInput({ 
  totalAmount, 
  onShareChange, 
  initialShare,
  className = '' 
}: ExpenseShareInputProps) {
  const [isShared, setIsShared] = useState(!!initialShare);
  const [totalParts, setTotalParts] = useState(initialShare?.totalParts || 2);
  const [yourParts, setYourParts] = useState(initialShare?.yourParts || 1);
  const [sharedWith, setSharedWith] = useState(initialShare?.sharedWith || '');

  // Calculer le montant réellement payé
  const yourAmount = totalParts > 0 && yourParts > 0 
    ? (totalAmount / totalParts) * yourParts 
    : totalAmount;

  useEffect(() => {
    if (isShared && totalParts > 0 && yourParts > 0) {
      const share: ExpenseShare = {
        type: 'shared',
        totalAmount,
        yourAmount,
        totalParts,
        yourParts,
        sharedWith: sharedWith || undefined,
        yourPercentage: (yourParts / totalParts) * 100,
      };
      onShareChange(share);
    } else {
      onShareChange(undefined);
    }
  }, [isShared, totalAmount, totalParts, yourParts, sharedWith, yourAmount, onShareChange]);

  if (!isShared) {
    return (
      <div className={className}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Cette charge est partagée (ex: loyer partagé)
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => setIsShared(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Cette charge est partagée
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Nombre total de parts
          </label>
          <input
            type="number"
            min={1}
            value={totalParts}
            onChange={(e) => {
              const parts = parseInt(e.target.value) || 1;
              setTotalParts(parts);
              if (yourParts > parts) setYourParts(parts);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ex: 2"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ex: 2 pour un loyer partagé en 2
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Mes parts
          </label>
          <input
            type="number"
            min={1}
            max={totalParts}
            value={yourParts}
            onChange={(e) => {
              const parts = parseInt(e.target.value) || 1;
              setYourParts(Math.min(parts, totalParts));
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ex: 1"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ex: 1 pour payer la moitié (1/2)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Partagé avec (optionnel)
          </label>
          <input
            type="text"
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Ex: Colloc, Conjoint..."
          />
        </div>
      </div>

      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700 dark:text-gray-300">Montant total de la charge :</span>
          <span className="font-semibold text-gray-900 dark:text-white">{currency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-700 dark:text-gray-300">
            Vous payez {yourParts}/{totalParts} part{yourParts > 1 ? 's' : ''} :
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
            {currency(yourAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

