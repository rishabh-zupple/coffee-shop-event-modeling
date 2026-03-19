import { InMemoryOrderRepository } from './adapters/in-memory-order.repository.js';
import { ConsoleEventEmitter } from './adapters/console-event.emitter.js';
import { ConsoleNotificationSender } from './adapters/console-notification.sender.js';
import { OrderService } from './domain/order.service.js';
import { createOrderRoutes } from './api/order.routes.js';
import type { Hono } from 'hono';

export interface OrderModule {
  service: OrderService;
  routes: Hono;
}

export function createOrderModule(): OrderModule {
  const repository = new InMemoryOrderRepository();
  const emitter = new ConsoleEventEmitter();
  const notifications = new ConsoleNotificationSender();

  const service = new OrderService(repository, emitter, notifications);
  const routes = createOrderRoutes(service);

  return { service, routes };
}
