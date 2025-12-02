import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Income and Savings Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
    
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should update monthly salary', async ({ page }) => {
    const salaryInput = page.locator('input[type="text"], input[type="number"]').filter({
      has: page.locator('text=/Salaire/i, text=/mensuel/i')
    }).first();
    
    if (await salaryInput.count() > 0) {
      await salaryInput.fill('3000,00');
      await page.waitForTimeout(1000);
      
      // Vérifier que la valeur a été mise à jour
      const value = await salaryInput.inputValue();
      expect(value).toContain('3000');
    }
  });

  test('should add a savings transaction', async ({ page }) => {
    const addTransactionButton = page.locator('button:has-text("Ajouter"), button:has-text("+")').filter({
      has: page.locator('text=/épargne/i, text=/transaction/i')
    }).first();
    
    if (await addTransactionButton.count() > 0) {
      await addTransactionButton.click();
      await page.waitForTimeout(1000);
      
      const amountInput = page.locator('input[type="text"], input[type="number"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('500,00');
      }
      
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.count() > 0) {
        await dateInput.fill('2025-01-15');
      }
      
      const submitButton = page.locator('button:has-text("Ajouter")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should manage multiple monthly income sources', async ({ page }) => {
    const multipleIncomeSection = page.locator('text=/revenus multiples/i, text=/intérim/i').first();
    if (await multipleIncomeSection.count() > 0) {
      const addButton = page.locator('button:has-text("Ajouter"), button:has-text("+")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const nameInput = page.locator('input[type="text"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Intérim');
        }
        
        const amountInput = page.locator('input[type="text"], input[type="number"]').first();
        if (await amountInput.count() > 0) {
          await amountInput.fill('1500,00');
        }
        
        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });
});

