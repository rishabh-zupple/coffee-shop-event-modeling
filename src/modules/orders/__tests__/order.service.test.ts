import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../domain/order.service.js';
import { OrderStatus } from '../domain/order.types.js';
import type { Order, OrderItem } from '../domain/order.types.js';
import type { OrderRepositoryPort } from '../ports/order-repository.port.js';
import type { EventEmitterPort } from '../ports/event-emitter.port.js';
import type { NotificationSenderPort } from '../ports/notification-sender.port.js';

// --- Mock factory helpers ---

function makeRepo(overrides?: Partial<OrderRepositoryPort>): OrderRepositoryPort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    listActive: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeEmitter(): EventEmitterPort {
  return { emit: vi.fn() };
}

function makeNotifications(): NotificationSenderPort {
  return {
    notifyBarista: vi.fn(),
    notifyCustomer: vi.fn(),
  };
}

const sampleItems: OrderItem[] = [
  { itemId: 'flat-white', name: 'Flat White', quantity: 1, unitPrice: 450 },
  { itemId: 'croissant', name: 'Croissant', quantity: 1, unitPrice: 350 },
];

function makePendingOrder(overrides?: Partial<Order>): Order {
  return {
    orderId: 'order-001',
    customerId: 'cust-001',
    customerName: 'John Kamau',
    items: sampleItems,
    status: OrderStatus.PENDING,
    totalAmount: 800,
    placedAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  };
}

// --- Tests ---

describe('OrderService', () => {
  let repo: OrderRepositoryPort;
  let emitter: EventEmitterPort;
  let notifications: NotificationSenderPort;
  let service: OrderService;

  beforeEach(() => {
    repo = makeRepo();
    emitter = makeEmitter();
    notifications = makeNotifications();
    service = new OrderService(repo, emitter, notifications);
  });

  // Place order
  describe('placeOrder', () => {
    it('saves the order, emits OrderPlaced event, and notifies barista', async () => {
      const order = await service.placeOrder({
        customerId: 'cust-001',
        customerName: 'John Kamau',
        items: sampleItems,
      });

      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(800);
      expect(repo.save).toHaveBeenCalledWith(order);

      expect(emitter.emit).toHaveBeenCalledOnce();
      const emittedEvent = vi.mocked(emitter.emit).mock.calls[0][0];
      expect(emittedEvent.type).toBe('OrderPlaced');

      expect(notifications.notifyBarista).toHaveBeenCalledOnce();
      expect(vi.mocked(notifications.notifyBarista).mock.calls[0][0]).toContain('John Kamau');
    });
  });

  // Accept order
  describe('acceptOrder', () => {
    it('updates status to ACCEPTED, emits OrderAccepted, and notifies customer', async () => {
      const pending = makePendingOrder();
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(pending) });
      service = new OrderService(repo, emitter, notifications);

      const order = await service.acceptOrder({ orderId: 'order-001' });

      expect(order.status).toBe(OrderStatus.ACCEPTED);
      expect(repo.save).toHaveBeenCalledWith(order);

      expect(emitter.emit).toHaveBeenCalledOnce();
      const evt = vi.mocked(emitter.emit).mock.calls[0][0];
      expect(evt.type).toBe('OrderAccepted');

      expect(notifications.notifyCustomer).toHaveBeenCalledWith('Your order is being prepared!');
    });

    it('throws when order is already ACCEPTED', async () => {
      const accepted = makePendingOrder({ status: OrderStatus.ACCEPTED });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(accepted) });
      service = new OrderService(repo, emitter, notifications);

      await expect(service.acceptOrder({ orderId: 'order-001' })).rejects.toThrow(
        'Cannot accept an order that is not pending',
      );
    });
  });

  // Mark ready
  describe('markOrderReady', () => {
    it('updates status to READY, emits OrderReady, and notifies customer', async () => {
      const accepted = makePendingOrder({ status: OrderStatus.ACCEPTED });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(accepted) });
      service = new OrderService(repo, emitter, notifications);

      const order = await service.markOrderReady({ orderId: 'order-001' });

      expect(order.status).toBe(OrderStatus.READY);
      expect(repo.save).toHaveBeenCalledWith(order);

      expect(emitter.emit).toHaveBeenCalledOnce();
      const evt = vi.mocked(emitter.emit).mock.calls[0][0];
      expect(evt.type).toBe('OrderReady');

      expect(notifications.notifyCustomer).toHaveBeenCalledWith(
        'Your order is ready for collection!',
      );
    });
  });

  // Collect order
  describe('collectOrder', () => {
    it('updates status to COLLECTED and emits OrderCollected', async () => {
      const ready = makePendingOrder({ status: OrderStatus.READY });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(ready) });
      service = new OrderService(repo, emitter, notifications);

      const order = await service.collectOrder({ orderId: 'order-001' });

      expect(order.status).toBe(OrderStatus.COLLECTED);
      expect(repo.save).toHaveBeenCalledWith(order);

      expect(emitter.emit).toHaveBeenCalledOnce();
      const evt = vi.mocked(emitter.emit).mock.calls[0][0];
      expect(evt.type).toBe('OrderCollected');
    });

    it('throws when order is not READY', async () => {
      const pending = makePendingOrder({ status: OrderStatus.PENDING });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(pending) });
      service = new OrderService(repo, emitter, notifications);

      await expect(service.collectOrder({ orderId: 'order-001' })).rejects.toThrow(
        'Cannot collect an order that is not ready',
      );
    });
  });

  // Cancel order
  describe('cancelOrder', () => {
    it('cancels a PENDING order, emits OrderCancelled, and notifies customer', async () => {
      const pending = makePendingOrder({ status: OrderStatus.PENDING });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(pending) });
      service = new OrderService(repo, emitter, notifications);

      const order = await service.cancelOrder({ orderId: 'order-001', reason: 'Changed my mind' });

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationReason).toBe('Changed my mind');

      expect(emitter.emit).toHaveBeenCalledOnce();
      const evt = vi.mocked(emitter.emit).mock.calls[0][0];
      expect(evt.type).toBe('OrderCancelled');

      expect(notifications.notifyCustomer).toHaveBeenCalledWith(
        'Your order was cancelled: Changed my mind',
      );
    });

    it('cancels an ACCEPTED order', async () => {
      const accepted = makePendingOrder({ status: OrderStatus.ACCEPTED });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(accepted) });
      service = new OrderService(repo, emitter, notifications);

      const order = await service.cancelOrder({
        orderId: 'order-001',
        reason: 'Out of oat milk',
      });

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationReason).toBe('Out of oat milk');
    });

    it('throws when order is READY', async () => {
      const ready = makePendingOrder({ status: OrderStatus.READY });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(ready) });
      service = new OrderService(repo, emitter, notifications);

      await expect(
        service.cancelOrder({ orderId: 'order-001', reason: 'test' }),
      ).rejects.toThrow('Cannot cancel an order that is ready for collection');
    });

    it('throws when order is COLLECTED', async () => {
      const collected = makePendingOrder({ status: OrderStatus.COLLECTED });
      repo = makeRepo({ findById: vi.fn().mockResolvedValue(collected) });
      service = new OrderService(repo, emitter, notifications);

      await expect(
        service.cancelOrder({ orderId: 'order-001', reason: 'test' }),
      ).rejects.toThrow('Cannot cancel an order that is already collected');
    });
  });
});
