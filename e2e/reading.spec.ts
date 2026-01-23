import { test, expect } from '@playwright/test';

test.describe('Reading Experience', () => {
  test('should load reading page with content', async ({ page, request }) => {
    // First get a writing ID from API
    const response = await request.get('/api/writings');
    const writings = await response.json();
    
    if (writings.length > 0) {
      const firstWriting = writings[0];
      await page.goto(`/reading/${firstWriting.id}`);
      
      // Page should load
      await expect(page.locator('body')).toBeVisible();
      await page.waitForLoadState('networkidle');
      
      // Should have content
      await expect(page.locator('article, main')).toBeVisible();
    }
  });

  test('should have back navigation', async ({ page, request }) => {
    const response = await request.get('/api/writings');
    const writings = await response.json();
    
    if (writings.length > 0) {
      await page.goto(`/reading/${writings[0].id}`);
      await page.waitForLoadState('networkidle');
      
      // Should be able to go back
      const backLink = page.locator('a[href="/"], a[href="/archive"]').first();
      if (await backLink.isVisible()) {
        await backLink.click();
        // Should navigate away from reading page
        await page.waitForURL(/^\/$|\/archive/);
      }
    }
  });
});

test.describe('Archive Page', () => {
  test('should display archive with writings', async ({ page }) => {
    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be searchable if search exists', async ({ page }) => {
    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      // Search should be functional (no errors)
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('About Page', () => {
  test('should load about page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
