import { v4 as uuidv4 } from 'uuid';
import {
  createOrder,
  acceptOrder,
  markOrderReady,
  collectOrder,
  cancelOrder,
} from './order.aggregate.js';
import type {
  PlaceOrderCommand,
  AcceptOrderCommand,
  MarkOrderReadyCommand,
  CollectOrderCommand,
  CancelOrderCommand,
  Order,
} from './order.types.js';
import type { OrderRepositoryPort } from '../ports/order-repository.port.js';
import type { EventEmitterPort } from '../ports/event-emitter.port.js';
import type { NotificationSenderPort } from '../ports/notification-sender.port.js';

function formatKES(cents: number): string {
  return `KES ${(cents / 100).toFixed(2)}`;
}

export class OrderService {
  constructor(
    private readonly repository: OrderRepositoryPort,
    private readonly emitter: EventEmitterPort,
    private readonly notifications: NotificationSenderPort,
  ) {}

  async placeOrder(cmd: PlaceOrderCommand): Promise<Order> {
    const totalAmount = cmd.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const { order, event } = createOrder({
      orderId: uuidv4(),
      customerId: cmd.customerId,
      customerName: cmd.customerName,
      items: cmd.items,
      totalAmount,
      placedAt: new Date(),
    });

    await this.repository.save(order);
    this.emitter.emit(event);

    this.notifications.notifyBarista(
      `New order #${order.orderId} from ${order.customerName} (${order.items.length} items, ${formatKES(order.totalAmount)})`,
    );

    return order;
  }

  async acceptOrder(cmd: AcceptOrderCommand): Promise<Order> {
    const existing = await this.repository.findById(cmd.orderId);
    if (!existing) {
      throw new Error(`Order not found: ${cmd.orderId}`);
    }

    const { order, event } = acceptOrder(existing, new Date());

    await this.repository.save(order);
    this.emitter.emit(event);

    this.notifications.notifyCustomer('Your order is being prepared!');

    return order;
  }

  async markOrderReady(cmd: MarkOrderReadyCommand): Promise<Order> {
    const existing = await this.repository.findById(cmd.orderId);
    if (!existing) {
      throw new Error(`Order not found: ${cmd.orderId}`);
    }

    const { order, event } = markOrderReady(existing, new Date());

    await this.repository.save(order);
    this.emitter.emit(event);

    this.notifications.notifyCustomer('Your order is ready for collection!');

    return order;
  }

  async collectOrder(cmd: CollectOrderCommand): Promise<Order> {
    const existing = await this.repository.findById(cmd.orderId);
    if (!existing) {
      throw new Error(`Order not found: ${cmd.orderId}`);
    }

    const { order, event } = collectOrder(existing, new Date());

    await this.repository.save(order);
    this.emitter.emit(event);

    return order;
  }

  async cancelOrder(cmd: CancelOrderCommand): Promise<Order> {
    const existing = await this.repository.findById(cmd.orderId);
    if (!existing) {
      throw new Error(`Order not found: ${cmd.orderId}`);
    }

    const { order, event } = cancelOrder(existing, cmd.reason, new Date());

    await this.repository.save(order);
    this.emitter.emit(event);

    this.notifications.notifyCustomer(
      `Your order was cancelled: ${cmd.reason}`,
    );

    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.repository.findById(orderId);
  }

  async listActiveOrders(): Promise<Order[]> {
    return this.repository.listActive();
  }
}
