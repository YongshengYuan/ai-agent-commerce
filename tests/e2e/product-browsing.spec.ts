import { test, expect } from '@playwright/test';

test.describe('Product Browsing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-PROD-001: User can view homepage with featured products', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Commerce/);
    await expect(page.locator('[data-testid="featured-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
  });

  test('E2E-PROD-002: User can navigate to product listing page', async ({ page }) => {
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('E2E-PROD-003: User can view product details', async ({ page }) => {
    // Click on first product
    await page.click('[data-testid="product-card"]:first-child');
    
    // Verify product details page
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeVisible();
  });

  test('E2E-PROD-004: User can select product variants', async ({ page }) => {
    await page.goto('/products/prod-001');
    
    // Select color variant
    await page.click('[data-testid="variant-color"]:first-child');
    await expect(page.locator('[data-testid="selected-variant"]')).toHaveText(/Black|White/);
    
    // Select size variant
    await page.click('[data-testid="variant-size"]:first-child');
    await expect(page.locator('[data-testid="selected-size"]')).toBeVisible();
  });

  test('E2E-PROD-005: User can search for products', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'laptop');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await expect(page).toHaveURL(/\/products\?search=laptop/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('E2E-PROD-006: User can filter products by category', async ({ page }) => {
    await page.goto('/products');
    
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Electronics');
    
    await expect(page).toHaveURL(/category=Electronics/);
    
    // Verify all displayed products are in Electronics category
    const products = await page.locator('[data-testid="product-card"]').all();
    for (const product of products) {
      await expect(product.locator('[data-testid="product-category"]')).toHaveText('Electronics');
    }
  });

  test('E2E-PROD-007: User can sort products', async ({ page }) => {
    await page.goto('/products');
    
    await page.selectOption('[data-testid="sort-select"]', 'price-asc');
    await expect(page).toHaveURL(/sort=price/);
    
    // Verify sorting (prices should be in ascending order)
    const priceElements = await page.locator('[data-testid="product-price"]').allTextContents();
    const prices = priceElements.map(p => parseFloat(p.replace('$', '')));
    const sortedPrices = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sortedPrices);
  });

  test('E2E-PROD-008: User can view product images in gallery', async ({ page }) => {
    await page.goto('/products/prod-001');
    
    // Main image should be visible
    await expect(page.locator('[data-testid="product-main-image"]')).toBeVisible();
    
    // Click on thumbnail
    await page.click('[data-testid="product-thumbnail"]:nth-child(2)');
    
    // Main image should update
    await expect(page.locator('[data-testid="product-main-image"]')).toHaveAttribute('src', /./);
  });

  test('E2E-PROD-009: User can see product reviews', async ({ page }) => {
    await page.goto('/products/prod-001');
    
    await page.click('[data-testid="reviews-tab"]');
    await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
  });

  test('E2E-PROD-010: Responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    
    // Mobile menu should be available
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Product grid should adapt
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
  });
});
