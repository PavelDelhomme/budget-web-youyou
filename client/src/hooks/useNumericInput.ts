import { useState, useCallback } from 'react';
import { parseAmount, isValidAmountInput } from '../lib/utils';

/**
 * Hook personnalisé pour gérer les entrées numériques avec validation
 * et support des expressions mathématiques
 */
export function useNumericInput(initialValue: number = 0, onChange?: (value: number) => void) {
  const [inputValue, setInputValue] = useState<string>(initialValue.toString().replace('.', ','));

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permettre les caractères valides uniquement
    if (value === '' || isValidAmountInput(value)) {
      setInputValue(value);
      
      // Calculer et notifier la valeur parsée
      if (value !== '') {
        const parsed = parseAmount(value);
        onChange?.(parsed);
      } else {
        onChange?.(0);
      }
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    // Formater la valeur finale avec virgule
    const parsed = parseAmount(inputValue);
    setInputValue(parsed.toString().replace('.', ','));
  }, [inputValue]);

  const setValue = useCallback((value: number) => {
    setInputValue(value.toString().replace('.', ','));
  }, []);

  return {
    inputValue,
    handleChange,
    handleBlur,
    setValue,
    parsedValue: parseAmount(inputValue),
  };
}

