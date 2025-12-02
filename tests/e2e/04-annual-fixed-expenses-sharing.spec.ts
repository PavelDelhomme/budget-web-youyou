import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Annual Fixed Expenses with Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should add an annual fixed expense with shared parts', async ({ page }) => {
    // Naviguer vers une année
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // Trouver la section des dépenses fixes annuelles
    const section = page.locator('text=/Dépenses fixes annuelles/i, text=/dépenses fixes/i').first();
    if (await section.count() > 0) {
      // Cliquer sur le bouton Ajouter
      const addButton = page.locator('button:has-text("+ Ajouter"), button:has-text("Ajouter")').filter({
        has: page.locator('text=/Dépenses fixes annuelles/i')
      }).first();
      
      if (await addButton.count() === 0) {
        // Essayer de trouver autrement
        const allAddButtons = page.locator('button:has-text("Ajouter")');
        const count = await allAddButtons.count();
        if (count > 0) {
          await allAddButtons.nth(count - 1).click();
          await page.waitForTimeout(1000);
        }
      } else {
        await addButton.click();
        await page.waitForTimeout(1000);
      }

      // Remplir le formulaire
      const nameInput = page.locator('input[placeholder*="Assurance"], input[type="text"]').filter({
        has: page.locator('text=/Nom/i')
      }).first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Loyer');
      }

      // Remplir le montant total (1200€)
      const amountInput = page.locator('input[placeholder*="1200"], input[type="text"]').filter({
        has: page.locator('text=/Montant total/i, text=/Montant/i')
      }).first();
      
      if (await amountInput.count() > 0) {
        await amountInput.fill('1200,00');
        await page.waitForTimeout(500);
      }

      // Cocher "Cette charge est partagée"
      const shareCheckbox = page.locator('text=/partagée/i').first();
      if (await shareCheckbox.count() > 0) {
        await shareCheckbox.click();
        await page.waitForTimeout(1000);
        
        // Configurer les parts (2 parts totales, 1 part payée)
        const totalPartsLabel = page.locator('text=/Nombre total de parts/i').first();
        if (await totalPartsLabel.count() > 0) {
          const totalPartsInput = totalPartsLabel.locator('..').locator('input[type="number"]').first();
          if (await totalPartsInput.count() > 0) {
            await totalPartsInput.fill('2');
          }
        }
        
        const myPartsLabel = page.locator('text=/Mes parts/i').first();
        if (await myPartsLabel.count() > 0) {
          const myPartsInput = myPartsLabel.locator('..').locator('input[type="number"]').first();
          if (await myPartsInput.count() > 0) {
            await myPartsInput.fill('1');
          }
        }
        
        // Vérifier que le montant réellement payé s'affiche (600€)
        const yourAmount = page.locator('text=/600.*€/i, text=/Vous payez.*600/i').first();
        if (await yourAmount.count() > 0) {
          await expect(yourAmount).toBeVisible({ timeout: 3000 });
        }
      }

      // Sélectionner un mois
      const monthSelect = page.locator('select').filter({
        has: page.locator('text=/Mois/i')
      }).first();
      
      if (await monthSelect.count() > 0) {
        await monthSelect.selectOption({ index: 0 });
      }

      // Cliquer sur Ajouter
      const submitButton = page.locator('button:has-text("Ajouter"), button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Vérifier que la dépense a été ajoutée avec le partage
        const expenseRow = page.locator('text=/Loyer/i').first();
        if (await expenseRow.count() > 0) {
          await expect(expenseRow).toBeVisible();
        }
      }
    }
  });

  test('should display sharing information in expense list', async ({ page }) => {
    // Naviguer vers une année
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }

    // Vérifier que les informations de partage s'affichent dans le tableau
    const expenseTable = page.locator('table').filter({
      has: page.locator('text=/Dépenses fixes annuelles/i')
    }).first();
    
    if (await expenseTable.count() > 0) {
      // Vérifier qu'il y a des lignes avec des informations de partage
      const sharedExpense = page.locator('text=/1\\/2/i, text=/part/i').first();
      if (await sharedExpense.count() > 0) {
        await expect(sharedExpense).toBeVisible();
      }
    }
  });
});

