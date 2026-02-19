import { test, expect } from '@playwright/test';

test.describe('Checkout E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add item to cart before each checkout test
    await page.goto('/products/prod-001');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goto('/checkout');
  });

  test('E2E-CHECKOUT-001: User can see checkout form', async ({ page }) => {
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
  });

  test('E2E-CHECKOUT-002: User can fill shipping address', async ({ page }) => {
    await page.fill('[data-testid="shipping-name"]', 'John Doe');
    await page.fill('[data-testid="shipping-street"]', '123 Main Street');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.selectOption('[data-testid="shipping-country"]', 'US');
    await page.fill('[data-testid="shipping-phone"]', '555-123-4567');
    
    // Verify fields are filled
    await expect(page.locator('[data-testid="shipping-name"]')).toHaveValue('John Doe');
  });

  test('E2E-CHECKOUT-003: User can use same address for billing', async ({ page }) => {
    // Fill shipping
    await page.fill('[data-testid="shipping-name"]', 'John Doe');
    await page.fill('[data-testid="shipping-street"]', '123 Main Street');
    
    // Check same as shipping
    await page.click('[data-testid="same-as-shipping"]');
    
    // Billing section should be hidden or auto-filled
    await expect(page.locator('[data-testid="billing-section"]')).not.toBeVisible();
  });

  test('E2E-CHECKOUT-004: User can select shipping method', async ({ page }) => {
    await page.click('[data-testid="shipping-method-standard"]');
    await expect(page.locator('[data-testid="selected-shipping"]')).toContainText('Standard');
    
    await page.click('[data-testid="shipping-method-express"]');
    await expect(page.locator('[data-testid="selected-shipping"]')).toContainText('Express');
  });

  test('E2E-CHECKOUT-005: User can enter payment information', async ({ page }) => {
    // Use test card from Stripe
    const frame = page.frameLocator('[data-testid="card-element"] iframe');
    await frame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await frame.locator('[placeholder="MM / YY"]').fill('12/25');
    await frame.locator('[placeholder="CVC"]').fill('123');
    
    await page.fill('[data-testid="cardholder-name"]', 'John Doe');
  });

  test('E2E-CHECKOUT-006: User can complete purchase', async ({ page }) => {
    // Fill shipping
    await page.fill('[data-testid="shipping-name"]', 'John Doe');
    await page.fill('[data-testid="shipping-street"]', '123 Main Street');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    
    // Select shipping method
    await page.click('[data-testid="shipping-method-standard"]');
    
    // Fill payment (mock)
    await page.click('[data-testid="payment-method-card"]');
    
    // Submit order
    await page.click('[data-testid="place-order-button"]');
    
    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('E2E-CHECKOUT-007: User sees order summary', async ({ page }) => {
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-items"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-shipping"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-tax"]')).toBeVisible();
    await expect(page.locator('[data-testid="summary-total"]')).toBeVisible();
  });

  test('E2E-CHECKOUT-008: Validation shows errors for empty required fields', async ({ page }) => {
    // Try to submit without filling form
    await page.click('[data-testid="place-order-button"]');
    
    // Should see validation errors
    await expect(page.locator('[data-testid="error-shipping-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-shipping-street"]')).toBeVisible();
  });

  test('E2E-CHECKOUT-009: User can apply discount code at checkout', async ({ page }) => {
    await page.fill('[data-testid="discount-code-input"]', 'WELCOME20');
    await page.click('[data-testid="apply-discount-button"]');
    
    await expect(page.locator('[data-testid="discount-applied"]')).toBeVisible();
    await expect(page.locator('[data-testid="discount-amount"]')).toContainText('$');
  });

  test('E2E-CHECKOUT-010: User receives email confirmation after order', async ({ page }) => {
    // Complete checkout
    await page.fill('[data-testid="shipping-name"]', 'John Doe');
    await page.fill('[data-testid="shipping-street"]', '123 Main Street');
    await page.fill('[data-testid="shipping-city"]', 'New York');
    await page.fill('[data-testid="shipping-state"]', 'NY');
    await page.fill('[data-testid="shipping-zip"]', '10001');
    await page.fill('[data-testid="shipping-email"]', 'test@example.com');
    
    await page.click('[data-testid="shipping-method-standard"]');
    await page.click('[data-testid="payment-method-card"]');
    await page.click('[data-testid="place-order-button"]');
    
    // Verify confirmation mentions email
    await expect(page.locator('[data-testid="email-confirmation"]')).toContainText('test@example.com');
  });
});
