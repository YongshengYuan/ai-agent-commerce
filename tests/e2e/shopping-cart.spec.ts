import { test, expect } from '@playwright/test';

test.describe('Shopping Cart E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-CART-001: User can add item to cart from product page', async ({ page }) => {
    // Navigate to product
    await page.goto('/products/prod-001');
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart notification
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });

  test('E2E-CART-002: User can add item with variant selection', async ({ page }) => {
    await page.goto('/products/prod-001');
    
    // Select variant
    await page.click('[data-testid="variant-color"]:first-child');
    
    // Set quantity
    await page.fill('[data-testid="quantity-input"]', '3');
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toHaveValue('3');
  });

  test('E2E-CART-003: User can view cart page', async ({ page }) => {
    // Add item first
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="view-cart-button"]');
    
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('[data-testid="cart-items-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('E2E-CART-004: User can update item quantity in cart', async ({ page }) => {
    // Add item and go to cart
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/cart');
    
    // Update quantity
    await page.fill('[data-testid="cart-item-quantity"]', '5');
    await page.click('[data-testid="update-quantity-button"]');
    
    // Verify total updated
    await expect(page.locator('[data-testid="cart-total"]')).not.toHaveText('$0.00');
  });

  test('E2E-CART-005: User can remove item from cart', async ({ page }) => {
    // Add item and go to cart
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/cart');
    
    // Remove item
    await page.click('[data-testid="remove-item-button"]');
    
    // Verify item removed
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });

  test('E2E-CART-006: Cart persists across page navigation', async ({ page }) => {
    // Add item
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Navigate away
    await page.goto('/products');
    await page.goto('/about');
    
    // Return to cart
    await page.goto('/cart');
    
    // Item should still be there
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('E2E-CART-007: User can apply promo code', async ({ page }) => {
    // Add item and go to cart
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/cart');
    
    // Apply promo code
    await page.fill('[data-testid="promo-code-input"]', 'SAVE10');
    await page.click('[data-testid="apply-promo-button"]');
    
    // Verify discount applied
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-total"]')).toBeVisible();
  });

  test('E2E-CART-008: User can proceed to checkout', async ({ page }) => {
    // Add item and go to cart
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/cart');
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('E2E-CART-009: Cart displays correct pricing breakdown', async ({ page }) => {
    // Add item with quantity
    await page.goto('/products/prod-001');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/cart');
    
    // Verify pricing breakdown
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
  });

  test('E2E-CART-010: User can clear entire cart', async ({ page }) => {
    // Add multiple items
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/products/prod-002');
    await page.click('[data-testid="add-to-cart-button"]');
    
    await page.goto('/cart');
    
    // Clear cart
    await page.click('[data-testid="clear-cart-button"]');
    await page.click('[data-testid="confirm-clear-button"]');
    
    // Verify cart empty
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });
});
