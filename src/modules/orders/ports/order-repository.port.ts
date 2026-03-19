import type { Order } from '../domain/order.types.js';

export interface OrderRepositoryPort {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
  listActive(): Promise<Order[]>;
}
