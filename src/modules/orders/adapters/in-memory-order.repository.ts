import type { Order } from '../domain/order.types.js';
import { OrderStatus } from '../domain/order.types.js';
import type { OrderRepositoryPort } from '../ports/order-repository.port.js';

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.READY,
];

export class InMemoryOrderRepository implements OrderRepositoryPort {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.orderId, order);
  }

  async findById(orderId: string): Promise<Order | null> {
    return this.store.get(orderId) ?? null;
  }

  async listActive(): Promise<Order[]> {
    return Array.from(this.store.values())
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());
  }
}
