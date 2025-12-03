import React, { useState, useEffect } from 'react';
import { parseAmount, isValidAmountInput, currency } from '../../lib/utils';

interface NumericInputWithValidationProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  label?: string;
  errorMessage?: string;
  showCalculated?: boolean;
}

/**
 * Composant d'input numérique avec validation et messages d'erreur
 * Affiche des messages d'erreur logiques pour les inputs invalides
 */
export function NumericInputWithValidation({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  disabled = false,
  min,
  max,
  label,
  errorMessage: externalErrorMessage,
  showCalculated = false,
}: NumericInputWithValidationProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  // Initialiser la valeur d'affichage
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const formatted = value.toString().replace('.', ',');
      setInputValue(formatted);
    }
  }, [value]);

  const validateInput = (input: string): string => {
    if (!input || input.trim() === '') {
      return '';
    }

    // Vérifier les caractères autorisés
    if (!isValidAmountInput(input)) {
      // Identifier le type d'erreur
      const hasLetters = /[a-zA-Z]/.test(input.replace(/x/gi, ''));
      if (hasLetters) {
        return 'Les lettres ne sont pas autorisées. Utilisez uniquement des chiffres et opérateurs (+, -, *, /, x).';
      }
      
      const hasInvalidChars = /[^0-9+\-*/.()xX\s,]/.test(input);
      if (hasInvalidChars) {
        return 'Caractères non autorisés. Utilisez uniquement des chiffres, opérateurs (+, -, *, /, x), virgules ou points.';
      }
    }

    // Vérifier si l'expression peut être évaluée
    try {
      const parsed = parseAmount(input);
      
      // Vérifier min/max
      if (min !== undefined && parsed < min) {
        return `Le montant doit être au moins ${currency(min)}.`;
      }
      
      if (max !== undefined && parsed > max) {
        return `Le montant ne doit pas dépasser ${currency(max)}.`;
      }

      // Vérifier si c'est une division par zéro
      if (input.includes('/0') && !input.match(/\/0[^.]/)) {
        return 'Division par zéro impossible.';
      }

      return '';
    } catch (e) {
      return 'Expression mathématique invalide. Vérifiez la syntaxe.';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Permettre la suppression complète
    if (newValue === '') {
      setInputValue('');
      setErrorMessage('');
      onChange(0);
      setShowResult(false);
      return;
    }
    
    // Valider l'input
    const error = validateInput(newValue);
    setErrorMessage(error);
    
    // Si pas d'erreur, mettre à jour
    if (!error) {
      setInputValue(newValue);
      
      // Calculer et notifier la valeur parsée
      const parsed = parseAmount(newValue);
      onChange(parsed);
      
      // Vérifier si c'est une expression mathématique
      const hasOperator = /[+\-*/x]/.test(newValue);
      setShowResult(hasOperator && parsed !== 0);
    }
  };

  const handleBlur = () => {
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
    setErrorMessage('');
    
    if (finalValue !== parsed) {
      onChange(finalValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      // Afficher un message d'erreur temporaire
      setErrorMessage(`Caractère "${char}" non autorisé. Utilisez uniquement des chiffres et opérateurs (+, -, *, /, x).`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const calculatedValue = parseAmount(inputValue);
  const isExpression = /[+\-*/x]/.test(inputValue) && inputValue !== calculatedValue.toString().replace('.', ',');
  const displayError = externalErrorMessage || errorMessage;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`${className} ${
            displayError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } ${showCalculated && isExpression ? 'pr-16' : ''}`}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${label || 'input'}-error` : undefined}
        />
        {showCalculated && isExpression && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
            = {currency(calculatedValue)}
          </span>
        )}
      </div>
      {displayError && (
        <p
          id={`${label || 'input'}-error`}
          className="mt-1 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {displayError}
        </p>
      )}
      {!displayError && showCalculated && isExpression && (
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          Résultat: {currency(calculatedValue)}
        </p>
      )}
    </div>
  );
}

