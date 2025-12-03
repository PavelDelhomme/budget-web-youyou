import React, { useState, useEffect } from 'react';
import { Modal } from '../layout/Modal';

interface AddYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (year: number) => Promise<void>;
}

export function AddYearModal({ isOpen, onClose, onConfirm }: AddYearModalProps) {
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setYear('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const num = Number(year.trim());
    
    if (!year.trim()) {
      setError('Veuillez entrer une année');
      return;
    }

    if (isNaN(num)) {
      setError('Veuillez entrer un nombre valide');
      return;
    }

    if (num < 1900 || num > 2100) {
      setError('L\'année doit être entre 1900 et 2100');
      return;
    }

    try {
      await onConfirm(num);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout de l\'année');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une année">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="year-input" className="block text-sm font-medium text-gray-700 mb-2">
            Année (ex: 2025)
          </label>
          <input
            id="year-input"
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setError('');
            }}
            placeholder="2025"
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Ajouter
          </button>
        </div>
      </form>
    </Modal>
  );
}

