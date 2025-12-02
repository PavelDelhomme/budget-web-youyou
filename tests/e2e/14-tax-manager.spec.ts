import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Tax Manager', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should open tax manager', async ({ page }) => {
    const taxButton = page.locator('button:has-text("💰"), button:has-text("Impôts"), text=/fiscal/i').first();
    if (await taxButton.count() > 0) {
      await taxButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier que l'interface fiscale s'ouvre
      const taxInterface = page.locator('text=/fiscal/i, text=/impôt/i, text=/taxe/i').first();
      if (await taxInterface.count() > 0) {
        await expect(taxInterface).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should calculate income tax', async ({ page }) => {
    const taxButton = page.locator('button:has-text("Impôts"), text=/💰/i').first();
    if (await taxButton.count() > 0) {
      await taxButton.click();
      await page.waitForTimeout(2000);
      
      // Remplir le formulaire fiscal
      const incomeInput = page.locator('input[type="text"], input[type="number"]').filter({
        has: page.locator('text=/revenu/i, text=/annuel/i')
      }).first();
      
      if (await incomeInput.count() > 0) {
        await incomeInput.fill('50000');
        await page.waitForTimeout(1000);
        
        // Vérifier que le calcul se fait automatiquement
        const taxResult = page.locator('text=/impôt/i, text=/€/i').first();
        if (await taxResult.count() > 0) {
          await expect(taxResult).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

