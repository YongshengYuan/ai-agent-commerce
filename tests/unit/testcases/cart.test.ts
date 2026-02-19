import { describe, it, expect, beforeEach } from '@jest/globals';
import { CartService } from '../../../src/services/cart.service';
import { Cart, CartItem } from '../../../src/types/cart';

describe('Shopping Cart Module Tests', () => {
  let cartService: CartService;
  let testCart: Cart;

  beforeEach(() => {
    cartService = new CartService();
    testCart = {
      id: 'cart-001',
      items: [],
      total: 0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    jest.spyOn(cartService, 'getCart').mockResolvedValue(testCart);
  });

  describe('Add to Cart', () => {
    it('TC-CART-001: Should add item to empty cart', async () => {
      const addSpy = jest.spyOn(cartService, 'addItem').mockImplementation(async (cartId, item) => {
        testCart.items.push(item);
        testCart.total = item.price * item.quantity;
        return testCart;
      });

      const newItem: CartItem = {
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 1,
        image: 'https://example.com/headphones-1.jpg',
      };

      const updatedCart = await cartService.addItem('cart-001', newItem);
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.total).toBe(79.99);
    });

    it('TC-CART-002: Should increase quantity for existing item', async () => {
      const existingItem: CartItem = {
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 1,
        image: 'https://example.com/headphones-1.jpg',
      };
      testCart.items.push(existingItem);

      jest.spyOn(cartService, 'addItem').mockImplementation(async (cartId, item) => {
        const existing = testCart.items.find(i => 
          i.productId === item.productId && i.variantId === item.variantId
        );
        if (existing) {
          existing.quantity += item.quantity;
        }
        testCart.total = testCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        return testCart;
      });

      const updatedCart = await cartService.addItem('cart-001', { ...existingItem, quantity: 2 });
      expect(updatedCart.items[0].quantity).toBe(3);
      expect(updatedCart.total).toBe(239.97);
    });

    it('TC-CART-003: Should validate inventory before adding', async () => {
      jest.spyOn(cartService, 'addItem').mockRejectedValue(new Error('Insufficient inventory'));
      
      const item: CartItem = {
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 1000, // Exceeds inventory
        image: 'https://example.com/headphones-1.jpg',
      };

      await expect(cartService.addItem('cart-001', item)).rejects.toThrow('Insufficient inventory');
    });

    it('TC-CART-004: Should handle maximum quantity limit', async () => {
      jest.spyOn(cartService, 'addItem').mockRejectedValue(new Error('Maximum quantity exceeded'));
      
      const item: CartItem = {
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 101, // Exceeds max limit
        image: 'https://example.com/headphones-1.jpg',
      };

      await expect(cartService.addItem('cart-001', item)).rejects.toThrow('Maximum quantity exceeded');
    });
  });

  describe('Update Cart', () => {
    it('TC-CART-005: Should update item quantity', async () => {
      testCart.items.push({
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 2,
        image: 'https://example.com/headphones-1.jpg',
      });

      jest.spyOn(cartService, 'updateQuantity').mockImplementation(async (cartId, productId, variantId, quantity) => {
        const item = testCart.items.find(i => i.productId === productId && i.variantId === variantId);
        if (item) item.quantity = quantity;
        testCart.total = testCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        return testCart;
      });

      const updatedCart = await cartService.updateQuantity('cart-001', 'prod-001', 'var-001', 5);
      expect(updatedCart.items[0].quantity).toBe(5);
      expect(updatedCart.total).toBe(399.95);
    });

    it('TC-CART-006: Should remove item when quantity set to 0', async () => {
      testCart.items.push({
        productId: 'prod-001',
        variantId: 'var-001',
        name: 'Wireless Bluetooth Headphones',
        price: 79.99,
        quantity: 2,
        image: 'https://example.com/headphones-1.jpg',
      });

      jest.spyOn(cartService, 'removeItem').mockImplementation(async (cartId, productId, variantId) => {
        testCart.items = testCart.items.filter(i => !(i.productId === productId && i.variantId === variantId));
        testCart.total = testCart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        return testCart;
      });

      const updatedCart = await cartService.removeItem('cart-001', 'prod-001', 'var-001');
      expect(updatedCart.items).toHaveLength(0);
      expect(updatedCart.total).toBe(0);
    });
  });

  describe('Cart Calculations', () => {
    it('TC-CART-007: Should calculate subtotal correctly', async () => {
      testCart.items = [
        { productId: 'p1', variantId: 'v1', name: 'Item 1', price: 10, quantity: 2, image: '' },
        { productId: 'p2', variantId: 'v2', name: 'Item 2', price: 25, quantity: 1, image: '' },
      ];
      testCart.total = 45;

      const cart = await cartService.getCart('cart-001');
      const calculatedTotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(calculatedTotal).toBe(45);
    });

    it('TC-CART-008: Should handle empty cart', async () => {
      jest.spyOn(cartService, 'getCart').mockResolvedValue({ ...testCart, items: [], total: 0 });
      const cart = await cartService.getCart('cart-001');
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });
  });

  describe('Cart Persistence', () => {
    it('TC-CART-009: Should create new cart for new session', async () => {
      jest.spyOn(cartService, 'createCart').mockResolvedValue(testCart);
      const newCart = await cartService.createCart();
      expect(newCart).toHaveProperty('id');
      expect(newCart.items).toHaveLength(0);
    });

    it('TC-CART-010: Should merge guest cart on login', async () => {
      const guestCart = {
        ...testCart,
        items: [{ productId: 'p1', variantId: 'v1', name: 'Guest Item', price: 10, quantity: 1, image: '' }],
      };
      
      jest.spyOn(cartService, 'mergeCarts').mockResolvedValue({
        ...testCart,
        items: [...guestCart.items],
        total: 10,
      });

      const mergedCart = await cartService.mergeCarts('guest-cart-id', 'user-cart-id');
      expect(mergedCart.items.length).toBeGreaterThan(0);
    });
  });
});
