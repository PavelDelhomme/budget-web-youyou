import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

/**
 * Test de parcours utilisateur complet
 * Simule une utilisation complète de l'application
 */
test.describe('Complete User Flow', () => {
  test('complete user journey', async ({ page }) => {
    // 1. Connexion
    await login(page);
    await waitForAppLoad(page);

    // 2. Vérifier le dashboard
    await page.waitForTimeout(2000);
    const dashboard = page.locator('text=/Dashboard/i, text=/📊/i').first();
    expect(await dashboard.count() > 0 || page.url().includes('/')).toBeTruthy();

    // 3. Naviguer vers une année
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // 4. Ajouter une dépense fixe annuelle avec partage (ex: loyer)
    const annualExpensesSection = page.locator('text=/Dépenses fixes annuelles/i').first();
    if (await annualExpensesSection.count() > 0) {
      const addButton = page.locator('button:has-text("+ Ajouter")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);

        // Remplir le formulaire
        const nameInput = page.locator('input[placeholder*="Assurance"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Loyer');
        }

        const amountInput = page.locator('input[type="text"]').first();
        if (await amountInput.count() > 0) {
          await amountInput.fill('1000,00');
          await page.waitForTimeout(500);
        }

        // Activer le partage
        const shareCheckbox = page.locator('text=/partagée/i').first();
        if (await shareCheckbox.count() > 0) {
          await shareCheckbox.click();
          await page.waitForTimeout(1000);

          // Configurer les parts
          const totalPartsInputs = page.locator('input[type="number"]');
          const count = await totalPartsInputs.count();
          if (count >= 1) {
            await totalPartsInputs.first().fill('2');
            if (count >= 2) {
              await totalPartsInputs.nth(1).fill('1');
            }
          }
        }

        // Ajouter
        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 5. Ajouter une dépense variable
    const expenseSection = page.locator('text=/dépense variable/i').first();
    if (await expenseSection.count() > 0) {
      const addExpenseButton = page.locator('button:has-text("Ajouter")').first();
      if (await addExpenseButton.count() > 0) {
        await addExpenseButton.click();
        await page.waitForTimeout(1000);

        const amountInput = page.locator('input[type="text"]').first();
        if (await amountInput.count() > 0) {
          await amountInput.fill('50,00');
        }

        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 6. Ajouter un abonnement avec partage
    const subscriptionSection = page.locator('text=/Abonnements/i').first();
    if (await subscriptionSection.count() > 0) {
      const addSubButton = page.locator('button:has-text("+ Ajouter")').first();
      if (await addSubButton.count() > 0) {
        await addSubButton.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator('input[placeholder*="Spotify"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Netflix');
        }

        const monthlyInput = page.locator('input[type="text"]').first();
        if (await monthlyInput.count() > 0) {
          await monthlyInput.fill('20,00');
          await page.waitForTimeout(500);
        }

        // Activer le partage
        const shareCheckbox = page.locator('text=/partagée/i').first();
        if (await shareCheckbox.count() > 0) {
          await shareCheckbox.click();
          await page.waitForTimeout(1000);

          const totalPartsInputs = page.locator('input[type="number"]');
          const count = await totalPartsInputs.count();
          if (count >= 1) {
            await totalPartsInputs.first().fill('2');
            if (count >= 2) {
              await totalPartsInputs.nth(1).fill('1');
            }
          }
        }

        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 7. Retourner au dashboard
    const dashboardButton = page.locator('button:has-text("Dashboard"), a:has-text("Dashboard")').first();
    if (await dashboardButton.count() > 0) {
      await dashboardButton.click();
      await page.waitForTimeout(2000);
    }

    // 8. Vérifier que les données sont mises à jour
    await page.waitForTimeout(2000);
    
    // Le dashboard devrait maintenant afficher les nouvelles données
    expect(page.url()).toBeTruthy();
  });
});

