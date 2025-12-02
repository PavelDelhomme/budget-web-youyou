import { test, expect } from '@playwright/test';
import { login, waitForAppLoad } from './helpers/test-helpers';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForAppLoad(page);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForTimeout(2000);
    
    // Vérifier que le contenu est visible et utilisable
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier qu'il n'y a pas de débordement horizontal
    const bodyWidth = await page.locator('body').boundingBox();
    if (bodyWidth) {
      expect(bodyWidth.width).toBeLessThanOrEqual(375);
    }
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForTimeout(2000);
    
    await expect(page.locator('body')).toBeVisible();
    
    const bodyWidth = await page.locator('body').boundingBox();
    if (bodyWidth) {
      expect(bodyWidth.width).toBeLessThanOrEqual(768);
    }
  });

  test('should adapt charts on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Vérifier que les graphiques s'adaptent
    const charts = page.locator('svg').first();
    if (await charts.count() > 0) {
      const chartBox = await charts.boundingBox();
      if (chartBox) {
        expect(chartBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should handle orientation change', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
    
    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });
});

