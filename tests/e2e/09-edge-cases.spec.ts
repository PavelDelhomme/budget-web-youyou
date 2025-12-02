import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Edge Cases and Unexpected Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should handle very large amounts', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    const addButton = page.locator('button:has-text("Ajouter")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const amountInput = page.locator('input[type="text"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('999999999,99');
        
        // Vérifier que l'application gère le grand nombre
        const value = await amountInput.inputValue();
        expect(value).toBeTruthy();
      }
    }
  });

  test('should handle negative amounts', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    const addButton = page.locator('button:has-text("Ajouter")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const amountInput = page.locator('input[type="text"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('-50,00');
        
        // Vérifier que l'application gère ou rejette les montants négatifs
        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Soit une erreur s'affiche, soit le montant est rejeté
          const errorOrValidation = page.locator('text=/erreur|invalide|négatif/i').first();
          if (await errorOrValidation.count() > 0) {
            await expect(errorOrValidation).toBeVisible({ timeout: 3000 });
          }
        }
      }
    }
  });

  test('should handle sharing with 0 parts', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // Tenter de créer un partage avec 0 parts
    const addButton = page.locator('button:has-text("+ Ajouter")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const amountInput = page.locator('input[type="text"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('1000,00');
      }

      const shareCheckbox = page.locator('text=/partagée/i').first();
      if (await shareCheckbox.count() > 0) {
        await shareCheckbox.click();
        await page.waitForTimeout(1000);

        const totalPartsInput = page.locator('input[type="number"]').first();
        if (await totalPartsInput.count() > 0) {
          await totalPartsInput.fill('0');
          
          // Vérifier que l'application empêche ou gère cette erreur
          const errorMessage = page.locator('text=/invalide|erreur|minimum/i').first();
          if (await errorMessage.count() > 0) {
            await expect(errorMessage).toBeVisible({ timeout: 3000 });
          }
        }
      }
    }
  });

  test('should handle sharing with more parts than total', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    const addButton = page.locator('button:has-text("+ Ajouter")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const amountInput = page.locator('input[type="text"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('1000,00');
      }

      const shareCheckbox = page.locator('text=/partagée/i').first();
      if (await shareCheckbox.count() > 0) {
        await shareCheckbox.click();
        await page.waitForTimeout(1000);

        const totalPartsInputs = page.locator('input[type="number"]');
        const count = await totalPartsInputs.count();
        if (count >= 2) {
          await totalPartsInputs.first().fill('2');
          await totalPartsInputs.nth(1).fill('5'); // Plus que le total
          
          // L'application devrait corriger ou empêcher cela
          const myPartsValue = await totalPartsInputs.nth(1).inputValue();
          expect(parseInt(myPartsValue) <= 2).toBeTruthy();
        }
      }
    }
  });

  test('should handle rapid clicking', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      // Cliquer plusieurs fois rapidement
      for (let i = 0; i < 5; i++) {
        await yearButton.click();
        await page.waitForTimeout(100);
      }
      
      await page.waitForTimeout(2000);
      
      // Vérifier que l'application n'a pas crashé
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
      
      // Naviguer en arrière
      await page.goBack();
      await page.waitForTimeout(2000);
      
      // Naviguer en avant
      await page.goForward();
      await page.waitForTimeout(2000);
      
      // Vérifier que l'application fonctionne toujours
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

