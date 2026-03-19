export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  READY = 'READY',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number; // in cents
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number; // in cents
  placedAt: Date;
  acceptedAt?: Date;
  readyAt?: Date;
  collectedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

// Domain Events

export interface OrderPlacedEvent {
  type: 'OrderPlaced';
  orderId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  placedAt: Date;
}

export interface OrderAcceptedEvent {
  type: 'OrderAccepted';
  orderId: string;
  acceptedAt: Date;
}

export interface OrderReadyEvent {
  type: 'OrderReady';
  orderId: string;
  readyAt: Date;
}

export interface OrderCollectedEvent {
  type: 'OrderCollected';
  orderId: string;
  collectedAt: Date;
}

export interface OrderCancelledEvent {
  type: 'OrderCancelled';
  orderId: string;
  reason: string;
  cancelledAt: Date;
}

export type DomainEvent =
  | OrderPlacedEvent
  | OrderAcceptedEvent
  | OrderReadyEvent
  | OrderCollectedEvent
  | OrderCancelledEvent;

// Command types

export interface PlaceOrderCommand {
  customerId: string;
  customerName: string;
  items: OrderItem[];
}

export interface AcceptOrderCommand {
  orderId: string;
}

export interface MarkOrderReadyCommand {
  orderId: string;
}

export interface CollectOrderCommand {
  orderId: string;
}

export interface CancelOrderCommand {
  orderId: string;
  reason: string;
}
