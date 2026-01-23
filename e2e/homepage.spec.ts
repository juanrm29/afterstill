import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Afterstill/);
    
    // Check for main content
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navbar exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to archive page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click archive link
    const archiveLink = page.locator('a[href="/archive"]').first();
    if (await archiveLink.isVisible()) {
      await archiveLink.click();
      await expect(page).toHaveURL(/\/archive/);
    }
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.locator('a[href="/about"]').first();
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/);
    }
  });
});

test.describe('API Health', () => {
  test('health endpoint should return ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json.status).toBe('ok');
    expect(json.version).toBeDefined();
  });

  test('writings endpoint should return array', async ({ request }) => {
    const response = await request.get('/api/writings');
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(Array.isArray(json)).toBeTruthy();
  });

  test('settings endpoint should return settings', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.ok()).toBeTruthy();
    
    const json = await response.json();
    expect(json).toBeDefined();
  });
});
