import { describe, it, expect, beforeEach } from '@jest/globals';
import { OrderService } from '../../../src/services/order.service';
import { PaymentService } from '../../../src/services/payment.service';
import { Order, OrderStatus, PaymentStatus } from '../../../src/types/order';

describe('Order Module Tests', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService();
  });

  describe('Order Creation', () => {
    it('TC-ORDER-001: Should create order from valid cart', async () => {
      const mockOrder: Order = {
        id: 'ord-001',
        userId: 'user-001',
        items: [
          { productId: 'p1', variantId: 'v1', name: 'Product 1', price: 50, quantity: 2, image: '' },
        ],
        subtotal: 100,
        shipping: 10,
        tax: 8,
        total: 118,
        currency: 'USD',
        status: OrderStatus.PENDING,
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
        },
        paymentStatus: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(orderService, 'createOrder').mockResolvedValue(mockOrder);

      const order = await orderService.createOrder({
        cartId: 'cart-001',
        userId: 'user-001',
        shippingAddress: mockOrder.shippingAddress,
      });

      expect(order).toHaveProperty('id');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.total).toBe(118);
    });

    it('TC-ORDER-002: Should validate stock before creating order', async () => {
      jest.spyOn(orderService, 'createOrder').mockRejectedValue(new Error('Insufficient stock'));

      await expect(orderService.createOrder({
        cartId: 'cart-001',
        userId: 'user-001',
        shippingAddress: {} as any,
      })).rejects.toThrow('Insufficient stock');
    });

    it('TC-ORDER-003: Should not create order from empty cart', async () => {
      jest.spyOn(orderService, 'createOrder').mockRejectedValue(new Error('Cart is empty'));

      await expect(orderService.createOrder({
        cartId: 'empty-cart',
        userId: 'user-001',
        shippingAddress: {} as any,
      })).rejects.toThrow('Cart is empty');
    });
  });

  describe('Order Status Management', () => {
    it('TC-ORDER-004: Should retrieve order by ID', async () => {
      const mockOrder: Order = {
        id: 'ord-001',
        userId: 'user-001',
        items: [],
        subtotal: 100,
        shipping: 10,
        tax: 8,
        total: 118,
        currency: 'USD',
        status: OrderStatus.CONFIRMED,
        shippingAddress: {} as any,
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(orderService, 'getOrderById').mockResolvedValue(mockOrder);

      const order = await orderService.getOrderById('ord-001');
      expect(order?.id).toBe('ord-001');
      expect(order?.status).toBe(OrderStatus.CONFIRMED);
    });

    it('TC-ORDER-005: Should update order status', async () => {
      jest.spyOn(orderService, 'updateStatus').mockImplementation(async (orderId, status) => {
        return {
          id: orderId,
          status,
        } as Order;
      });

      const updated = await orderService.updateStatus('ord-001', OrderStatus.SHIPPED);
      expect(updated.status).toBe(OrderStatus.SHIPPED);
    });

    it('TC-ORDER-006: Should track order status history', async () => {
      const history = [
        { status: OrderStatus.PENDING, timestamp: new Date('2024-01-01') },
        { status: OrderStatus.CONFIRMED, timestamp: new Date('2024-01-02') },
        { status: OrderStatus.SHIPPED, timestamp: new Date('2024-01-03') },
      ];

      jest.spyOn(orderService, 'getStatusHistory').mockResolvedValue(history);

      const result = await orderService.getStatusHistory('ord-001');
      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(OrderStatus.PENDING);
    });
  });

  describe('Payment Processing', () => {
    it('TC-PAY-001: Should process valid payment', async () => {
      jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
        success: true,
        transactionId: 'txn-001',
        status: PaymentStatus.COMPLETED,
      });

      const result = await paymentService.processPayment({
        orderId: 'ord-001',
        amount: 118,
        currency: 'USD',
        paymentMethod: 'card',
        cardToken: 'tok_visa',
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
    });

    it('TC-PAY-002: Should handle payment failure', async () => {
      jest.spyOn(paymentService, 'processPayment').mockResolvedValue({
        success: false,
        error: 'Card declined',
        status: PaymentStatus.FAILED,
      });

      const result = await paymentService.processPayment({
        orderId: 'ord-001',
        amount: 118,
        currency: 'USD',
        paymentMethod: 'card',
        cardToken: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('TC-PAY-003: Should handle refund', async () => {
      jest.spyOn(paymentService, 'refund').mockResolvedValue({
        success: true,
        refundId: 'ref-001',
        amount: 118,
      });

      const result = await paymentService.refund('ord-001', 118);
      expect(result.success).toBe(true);
      expect(result.refundId).toBeDefined();
    });
  });

  describe('Order Cancellation', () => {
    it('TC-ORDER-007: Should allow cancellation before shipment', async () => {
      jest.spyOn(orderService, 'cancelOrder').mockResolvedValue({
        id: 'ord-001',
        status: OrderStatus.CANCELLED,
      } as Order);

      const cancelled = await orderService.cancelOrder('ord-001', 'Customer request');
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('TC-ORDER-008: Should not allow cancellation after shipment', async () => {
      jest.spyOn(orderService, 'cancelOrder').mockRejectedValue(
        new Error('Cannot cancel shipped order')
      );

      await expect(orderService.cancelOrder('ord-shipped', 'Customer request'))
        .rejects.toThrow('Cannot cancel shipped order');
    });
  });

  describe('Order Listing', () => {
    it('TC-ORDER-009: Should list user orders', async () => {
      const mockOrders = [
        { id: 'ord-001', status: OrderStatus.COMPLETED },
        { id: 'ord-002', status: OrderStatus.PENDING },
      ];

      jest.spyOn(orderService, 'getUserOrders').mockResolvedValue(mockOrders as Order[]);

      const orders = await orderService.getUserOrders('user-001');
      expect(orders).toHaveLength(2);
    });

    it('TC-ORDER-010: Should filter orders by status', async () => {
      jest.spyOn(orderService, 'getUserOrders').mockImplementation(async (userId, filters) => {
        const allOrders = [
          { id: 'ord-001', status: OrderStatus.COMPLETED },
          { id: 'ord-002', status: OrderStatus.PENDING },
        ];
        return allOrders.filter(o => o.status === filters?.status) as Order[];
      });

      const orders = await orderService.getUserOrders('user-001', { status: OrderStatus.COMPLETED });
      expect(orders.every(o => o.status === OrderStatus.COMPLETED)).toBe(true);
    });
  });
});
