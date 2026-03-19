import { OrderStatus } from './order.types.js';
import type {
  Order,
  OrderItem,
  OrderPlacedEvent,
  OrderAcceptedEvent,
  OrderReadyEvent,
  OrderCollectedEvent,
  OrderCancelledEvent,
} from './order.types.js';

export function createOrder(params: {
  orderId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  placedAt: Date;
}): { order: Order; event: OrderPlacedEvent } {
  const order: Order = {
    orderId: params.orderId,
    customerId: params.customerId,
    customerName: params.customerName,
    items: params.items,
    status: OrderStatus.PENDING,
    totalAmount: params.totalAmount,
    placedAt: params.placedAt,
  };

  const event: OrderPlacedEvent = {
    type: 'OrderPlaced',
    orderId: params.orderId,
    customerId: params.customerId,
    customerName: params.customerName,
    items: params.items,
    totalAmount: params.totalAmount,
    placedAt: params.placedAt,
  };

  return { order, event };
}

export function acceptOrder(
  order: Order,
  acceptedAt: Date,
): { order: Order; event: OrderAcceptedEvent } {
  if (order.status !== OrderStatus.PENDING) {
    throw new Error(
      `Cannot accept an order with status ${order.status}`,
    );
  }

  const updated: Order = { ...order, status: OrderStatus.ACCEPTED, acceptedAt };

  const event: OrderAcceptedEvent = {
    type: 'OrderAccepted',
    orderId: order.orderId,
    acceptedAt,
  };

  return { order: updated, event };
}

export function markOrderReady(
  order: Order,
  readyAt: Date,
): { order: Order; event: OrderReadyEvent } {
  if (order.status !== OrderStatus.ACCEPTED) {
    throw new Error(
      `Cannot mark ready an order with status ${order.status}`,
    );
  }

  const updated: Order = { ...order, status: OrderStatus.READY, readyAt };

  const event: OrderReadyEvent = {
    type: 'OrderReady',
    orderId: order.orderId,
    readyAt,
  };

  return { order: updated, event };
}

export function collectOrder(
  order: Order,
  collectedAt: Date,
): { order: Order; event: OrderCollectedEvent } {
  if (order.status !== OrderStatus.READY) {
    throw new Error(
      `Cannot collect an order with status ${order.status}`,
    );
  }

  const updated: Order = { ...order, status: OrderStatus.COLLECTED, collectedAt };

  const event: OrderCollectedEvent = {
    type: 'OrderCollected',
    orderId: order.orderId,
    collectedAt,
  };

  return { order: updated, event };
}

export function cancelOrder(
  order: Order,
  reason: string,
  cancelledAt: Date,
): { order: Order; event: OrderCancelledEvent } {
  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.ACCEPTED
  ) {
    throw new Error(
      `Cannot cancel an order with status ${order.status}`,
    );
  }

  const updated: Order = {
    ...order,
    status: OrderStatus.CANCELLED,
    cancelledAt,
    cancellationReason: reason,
  };

  const event: OrderCancelledEvent = {
    type: 'OrderCancelled',
    orderId: order.orderId,
    reason,
    cancelledAt,
  };

  return { order: updated, event };
}
