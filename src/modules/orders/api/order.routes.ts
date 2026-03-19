import { Hono } from 'hono';
import type { OrderService } from '../domain/order.service.js';
import { PlaceOrderBodySchema, CancelOrderBodySchema } from './order.validation.js';
import { MENU } from '../../../menu.js';

export function createOrderRoutes(service: OrderService): Hono {
  const app = new Hono();

  // GET /menu
  app.get('/menu', (c) => {
    return c.json(MENU);
  });

  // POST /orders
  app.post('/orders', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = PlaceOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.issues }, 400);
    }

    try {
      const order = await service.placeOrder(parsed.data);
      return c.json(order, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json({ error: message }, 400);
    }
  });

  // GET /orders  (active only — kitchen display)
  app.get('/orders', async (c) => {
    const orders = await service.listActiveOrders();
    return c.json(orders);
  });

  // GET /orders/:id
  app.get('/orders/:id', async (c) => {
    const order = await service.getOrder(c.req.param('id'));
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    return c.json(order);
  });

  // POST /orders/:id/accept
  app.post('/orders/:id/accept', async (c) => {
    try {
      const order = await service.acceptOrder({ orderId: c.req.param('id') });
      return c.json(order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('not found')) {
        return c.json({ error: message }, 404);
      }
      return c.json({ error: message }, 400);
    }
  });

  // POST /orders/:id/ready
  app.post('/orders/:id/ready', async (c) => {
    try {
      const order = await service.markOrderReady({ orderId: c.req.param('id') });
      return c.json(order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('not found')) {
        return c.json({ error: message }, 404);
      }
      return c.json({ error: message }, 400);
    }
  });

  // POST /orders/:id/collect
  app.post('/orders/:id/collect', async (c) => {
    try {
      const order = await service.collectOrder({ orderId: c.req.param('id') });
      return c.json(order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('not found')) {
        return c.json({ error: message }, 404);
      }
      return c.json({ error: message }, 400);
    }
  });

  // POST /orders/:id/cancel
  app.post('/orders/:id/cancel', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = CancelOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body', details: parsed.error.issues }, 400);
    }

    try {
      const order = await service.cancelOrder({
        orderId: c.req.param('id'),
        reason: parsed.data.reason,
      });
      return c.json(order);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('not found')) {
        return c.json({ error: message }, 404);
      }
      return c.json({ error: message }, 400);
    }
  });

  return app;
}
