export interface NotificationSenderPort {
  notifyBarista(message: string): void;
  notifyCustomer(message: string): void;
}
