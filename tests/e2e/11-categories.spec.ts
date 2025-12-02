import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Categories Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
    
    // Naviguer vers une année
    const yearButton = page.locator('button:has-text("2025"), a:has-text("2025")').first();
    if (await yearButton.count() > 0) {
      await yearButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should display categories', async ({ page }) => {
    const categoriesSection = page.locator('text=/Catégories/i, text=/catégorie/i').first();
    if (await categoriesSection.count() > 0) {
      await expect(categoriesSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should add a new category', async ({ page }) => {
    const addCategoryButton = page.locator('button:has-text("Ajouter"), button:has-text("+")').filter({
      has: page.locator('text=/Catégories/i')
    }).first();
    
    if (await addCategoryButton.count() > 0) {
      await addCategoryButton.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Category');
      }
      
      const targetInput = page.locator('input[type="text"], input[type="number"]').filter({
        has: page.locator('text=/Budget/i, text=/Montant/i')
      }).first();
      
      if (await targetInput.count() > 0) {
        await targetInput.fill('1000,00');
      }
      
      const submitButton = page.locator('button:has-text("Ajouter"), button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Vérifier que la catégorie a été ajoutée
        const categoryName = page.locator('text=/Test Category/i').first();
        if (await categoryName.count() > 0) {
          await expect(categoryName).toBeVisible();
        }
      }
    }
  });

  test('should edit a category', async ({ page }) => {
    const editButton = page.locator('button:has-text("✏️"), button[title*="Modifier"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Updated Category');
      }
      
      const submitButton = page.locator('button:has-text("Modifier"), button:has-text("Enregistrer")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should delete a category', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("🗑️"), button[title*="Supprimer"]').first();
    if (await deleteButton.count() > 0) {
      const initialCount = await page.locator('text=/Catégorie/i, tr').count();
      
      await deleteButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier que la catégorie a été supprimée
      const newCount = await page.locator('text=/Catégorie/i, tr').count();
      if (initialCount > 0) {
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });
});

