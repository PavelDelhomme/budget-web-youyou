import React, { useState, useCallback, useRef, useEffect } from 'react';
import { parseAmount, isValidAmountInput, currency } from '../../lib/utils';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  showCalculated?: boolean; // Afficher le résultat calculé en temps réel
}

/**
 * Composant d'input numérique avec support des calculs mathématiques
 * Accepte : chiffres, opérateurs (+, -, *, /, x), virgules et points
 * Exemples : "1000+500", "2000/2", "1500*1.2", "1000-200"
 */
export function NumericInput({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  disabled = false,
  min,
  max,
  showCalculated = false,
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialiser la valeur d'affichage
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const formatted = value.toString().replace('.', ',');
      setInputValue(formatted);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Permettre la suppression complète
    if (newValue === '') {
      setInputValue('');
      onChange(0);
      setShowResult(false);
      return;
    }
    
    // Valider les caractères autorisés
    if (isValidAmountInput(newValue)) {
      setInputValue(newValue);
      
      // Calculer et notifier la valeur parsée
      const parsed = parseAmount(newValue);
      onChange(parsed);
      
      // Vérifier si c'est une expression mathématique
      const hasOperator = /[+\-*/x]/.test(newValue);
      setShowResult(hasOperator && parsed !== 0);
      
      // Validation min/max
      if (min !== undefined && parsed < min) {
        // On laisse saisir mais on corrigera au blur
      }
      if (max !== undefined && parsed > max) {
        // On laisse saisir mais on corrigera au blur
      }
    }
  }, [onChange, min, max]);

  const handleBlur = useCallback(() => {
    const parsed = parseAmount(inputValue);
    let finalValue = parsed;
    
    // Appliquer les contraintes min/max
    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }
    
    // Formater la valeur finale avec virgule
    const formatted = finalValue.toString().replace('.', ',');
    setInputValue(formatted);
    setShowResult(false);
    
    if (finalValue !== parsed) {
      onChange(finalValue);
    }
  }, [inputValue, onChange, min, max]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permettre les touches de navigation et suppression
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    ) {
      return;
    }
    
    // Permettre Ctrl/Cmd + A, C, V, X
    if (e.ctrlKey || e.metaKey) {
      if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
    }
    
    // Empêcher les caractères non autorisés
    const char = e.key;
    const currentValue = (e.target as HTMLInputElement).value;
    const newValue = currentValue + char;
    
    if (!isValidAmountInput(newValue)) {
      e.preventDefault();
    }
  }, []);

  const calculatedValue = parseAmount(inputValue);
  const isExpression = /[+\-*/x]/.test(inputValue) && inputValue !== calculatedValue.toString().replace('.', ',');

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} ${showCalculated && isExpression ? 'pr-16' : ''}`}
      />
      {showCalculated && isExpression && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
          = {currency(calculatedValue)}
        </span>
      )}
    </div>
  );
}

