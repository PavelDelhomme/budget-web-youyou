/**
 * Tests pour la validation des inputs numériques avec expressions mathématiques
 */
import { describe, it, expect } from '@jest/globals';
import { parseAmount, isValidAmountInput } from '../../client/src/lib/utils';

describe('Validation des inputs numériques', () => {
  describe('parseAmount', () => {
    it('devrait parser un nombre simple avec virgule', () => {
      expect(parseAmount('1000,50')).toBe(1000.5);
      expect(parseAmount('1000,99')).toBe(1000.99);
    });

    it('devrait parser un nombre simple avec point', () => {
      expect(parseAmount('1000.50')).toBe(1000.5);
      expect(parseAmount('1000.99')).toBe(1000.99);
    });

    it('devrait calculer une addition', () => {
      expect(parseAmount('1000+500')).toBe(1500);
      expect(parseAmount('1000+500,50')).toBe(1500.5);
    });

    it('devrait calculer une soustraction', () => {
      expect(parseAmount('1000-200')).toBe(800);
      expect(parseAmount('1000-200,50')).toBe(799.5);
    });

    it('devrait calculer une multiplication avec *', () => {
      expect(parseAmount('1000*2')).toBe(2000);
      expect(parseAmount('1000*1.5')).toBe(1500);
    });

    it('devrait calculer une multiplication avec x', () => {
      expect(parseAmount('1000x2')).toBe(2000);
      expect(parseAmount('1000 x 2')).toBe(2000);
    });

    it('devrait calculer une division', () => {
      expect(parseAmount('2000/2')).toBe(1000);
      expect(parseAmount('1500/3')).toBe(500);
    });

    it('devrait gérer les expressions complexes', () => {
      expect(parseAmount('1000+500-200')).toBe(1300);
      expect(parseAmount('1000*2/4')).toBe(500);
      expect(parseAmount('(1000+500)*2')).toBe(3000);
    });

    it('devrait retourner 0 pour une chaîne vide', () => {
      expect(parseAmount('')).toBe(0);
      expect(parseAmount('   ')).toBe(0);
    });

    it('devrait retourner 0 pour un nombre invalide', () => {
      expect(parseAmount('abc')).toBe(0);
      expect(parseAmount('12abc')).toBe(0);
    });

    it('devrait arrondir à 2 décimales', () => {
      expect(parseAmount('1000.999')).toBe(1001);
      expect(parseAmount('1000.994')).toBe(1000.99);
    });
  });

  describe('isValidAmountInput', () => {
    it('devrait accepter les chiffres', () => {
      expect(isValidAmountInput('1000')).toBe(true);
      expect(isValidAmountInput('1234567890')).toBe(true);
    });

    it('devrait accepter les opérateurs mathématiques', () => {
      expect(isValidAmountInput('1000+500')).toBe(true);
      expect(isValidAmountInput('1000-200')).toBe(true);
      expect(isValidAmountInput('1000*2')).toBe(true);
      expect(isValidAmountInput('1000/2')).toBe(true);
      expect(isValidAmountInput('1000x2')).toBe(true);
    });

    it('devrait accepter les virgules et points', () => {
      expect(isValidAmountInput('1000,50')).toBe(true);
      expect(isValidAmountInput('1000.50')).toBe(true);
    });

    it('devrait accepter les espaces', () => {
      expect(isValidAmountInput('1000 + 500')).toBe(true);
      expect(isValidAmountInput('1000 x 2')).toBe(true);
    });

    it('devrait accepter les parenthèses', () => {
      expect(isValidAmountInput('(1000+500)')).toBe(true);
      expect(isValidAmountInput('(1000+500)*2')).toBe(true);
    });

    it('devrait refuser les lettres (sauf x pour multiplication)', () => {
      expect(isValidAmountInput('abc')).toBe(false);
      expect(isValidAmountInput('1000abc')).toBe(false);
      expect(isValidAmountInput('1000a500')).toBe(false);
      expect(isValidAmountInput('test')).toBe(false);
    });

    it('devrait refuser les caractères spéciaux non autorisés', () => {
      expect(isValidAmountInput('1000@500')).toBe(false);
      expect(isValidAmountInput('1000#500')).toBe(false);
      expect(isValidAmountInput('1000$500')).toBe(false);
      expect(isValidAmountInput('1000%500')).toBe(false);
    });

    it('devrait accepter une chaîne vide', () => {
      expect(isValidAmountInput('')).toBe(true);
    });
  });

  describe('Cas d\'erreur avec messages', () => {
    it('devrait gérer les divisions par zéro', () => {
      // Division par zéro devrait retourner Infinity, on vérifie que parseAmount gère ça
      const result = parseAmount('1000/0');
      expect(isFinite(result)).toBe(false);
    });

    it('devrait gérer les expressions mal formées', () => {
      expect(parseAmount('+++')).toBe(0);
      expect(parseAmount('1000++500')).toBe(0);
    });

    it('devrait gérer les nombres négatifs', () => {
      expect(parseAmount('-1000')).toBe(-1000);
      expect(parseAmount('1000-2000')).toBe(-1000);
    });
  });
});

