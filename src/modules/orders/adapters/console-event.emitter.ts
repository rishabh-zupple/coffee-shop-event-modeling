import type { DomainEvent } from '../domain/order.types.js';
import type { EventEmitterPort } from '../ports/event-emitter.port.js';

function formatKES(cents: number): string {
  return `KES ${(cents / 100).toFixed(2)}`;
}

export class ConsoleEventEmitter implements EventEmitterPort {
  emit(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderPlaced':
        console.log(
          `[EVENT] OrderPlaced     orderId=${event.orderId}  customer="${event.customerName}"  total=${formatKES(event.totalAmount)}`,
        );
        break;
      case 'OrderAccepted':
        console.log(`[EVENT] OrderAccepted   orderId=${event.orderId}`);
        break;
      case 'OrderReady':
        console.log(`[EVENT] OrderReady      orderId=${event.orderId}`);
        break;
      case 'OrderCollected':
        console.log(`[EVENT] OrderCollected  orderId=${event.orderId}`);
        break;
      case 'OrderCancelled':
        console.log(
          `[EVENT] OrderCancelled  orderId=${event.orderId}  reason="${event.reason}"`,
        );
        break;
    }
  }
}
