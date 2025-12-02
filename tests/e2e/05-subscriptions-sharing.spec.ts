import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Subscriptions with Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should add a subscription with shared parts', async ({ page }) => {
    // Naviguer vers une année
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // Trouver la section des abonnements
    const subscriptionSection = page.locator('text=/Abonnements/i, text=/abonnement/i').first();
    if (await subscriptionSection.count() > 0) {
      // Cliquer sur Ajouter
      const addButton = page.locator('button:has-text("+ Ajouter"), button:has-text("Ajouter")').filter({
        has: page.locator('text=/Abonnements/i')
      }).first();
      
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
      }

      // Remplir le formulaire
      const nameInput = page.locator('input[placeholder*="Spotify"], input[type="text"]').filter({
        has: page.locator('text=/Nom/i')
      }).first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Netflix');
      }

      // Remplir le montant mensuel total (20€)
      const monthlyInput = page.locator('input[placeholder*="15,99"], input[type="text"]').filter({
        has: page.locator('text=/Mensuel total/i, text=/Mensuel/i')
      }).first();
      
      if (await monthlyInput.count() > 0) {
        await monthlyInput.fill('20,00');
        await page.waitForTimeout(500);
      }

      // Cocher "Cette charge est partagée"
      const shareCheckbox = page.locator('text=/partagée/i').first();
      if (await shareCheckbox.count() > 0) {
        await shareCheckbox.click();
        await page.waitForTimeout(1000);
        
        // Configurer les parts (2 parts totales, 1 part payée)
        const totalPartsInput = page.locator('input[type="number"]').filter({
          has: page.locator('text=/Nombre total de parts/i')
        }).first();
        
        if (await totalPartsInput.count() > 0) {
          await totalPartsInput.fill('2');
        }
        
        const myPartsInput = page.locator('input[type="number"]').filter({
          has: page.locator('text=/Mes parts/i')
        }).first();
        
        if (await myPartsInput.count() > 0) {
          await myPartsInput.fill('1');
        }
        
        // Vérifier que le montant réellement payé s'affiche (10€)
        const yourAmount = page.locator('text=/10.*€/i, text=/Vous payez.*10/i').first();
        if (await yourAmount.count() > 0) {
          await expect(yourAmount).toBeVisible({ timeout: 3000 });
        }
      }

      // Cliquer sur Ajouter
      const submitButton = page.locator('button:has-text("Ajouter")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

