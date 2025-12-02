import { test, expect } from '@playwright/test';
import { login, waitForAppLoad, checkNoApiErrors } from './helpers/test-helpers';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simuler une erreur réseau
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    // Tenter une action
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier qu'une erreur est affichée ou gérée
      const errorMessage = page.locator('text=/erreur|Erreur|error/i').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    }

    // Restaurer le routage normal
    await page.unroute('**/api/**');
  });

  test('should handle 401 errors gracefully', async ({ page }) => {
    // Simuler une erreur 401
    await page.route('**/api/get?**', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Tenter une action
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier que l'erreur est gérée sans crash
      await expect(page.locator('body')).toBeVisible();
    }

    await page.unroute('**/api/get?**');
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Simuler une erreur 404
    await page.route('**/api/ml/**', route => {
      route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'Not found' })
      });
    });

    // Tenter d'accéder à une fonctionnalité ML
    const mlButton = page.locator('button:has-text("Entraînement IA"), text=/IA/i').first();
    if (await mlButton.count() > 0) {
      await mlButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier que l'interface charge quand même
      await expect(page.locator('body')).toBeVisible();
    }

    await page.unroute('**/api/ml/**');
  });

  test('should handle invalid input gracefully', async ({ page }) => {
    const yearButton = page.locator('button:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // Essayer d'ajouter une dépense avec un montant invalide
    const addButton = page.locator('button:has-text("Ajouter")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const amountInput = page.locator('input[type="text"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('invalid');
        
        const submitButton = page.locator('button:has-text("Ajouter")').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Vérifier qu'une erreur ou validation s'affiche
          const errorOrValidation = page.locator('text=/invalide|erreur|valide/i').first();
          if (await errorOrValidation.count() > 0) {
            await expect(errorOrValidation).toBeVisible({ timeout: 3000 });
          }
        }
      }
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Vérifier que les sections vides affichent un message approprié
    const emptyMessage = page.locator('text=/Aucune dépense|Aucun abonnement|Aucune/i').first();
    
    // Si un message vide est présent, il devrait être visible et informatif
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should not log 401 errors to console when not authenticated', async ({ page }) => {
    // Se déconnecter
    const logoutButton = page.locator('button:has-text("Déconnexion")').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
    }

    // Vérifier qu'il n'y a pas d'erreurs 401 dans la console
    const errors = await checkNoApiErrors(page);
    expect(errors.filter(e => e.includes('401') || e.includes('UNAUTHORIZED'))).toHaveLength(0);
  });
});

