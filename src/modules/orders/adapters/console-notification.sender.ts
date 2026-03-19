import type { NotificationSenderPort } from '../ports/notification-sender.port.js';

export class ConsoleNotificationSender implements NotificationSenderPort {
  notifyBarista(message: string): void {
    console.log(`[NOTIFY → BARISTA]  ${message}`);
  }

  notifyCustomer(message: string): void {
    console.log(`[NOTIFY → CUSTOMER] ${message}`);
  }
}
