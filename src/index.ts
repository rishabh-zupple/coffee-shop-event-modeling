import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createOrderModule } from './modules/orders/order.module.js';

const app = new Hono();

const { routes } = createOrderModule();

app.route('/', routes);

const PORT = 3000;

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`CoffeeShop API running on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /menu');
  console.log('  POST /orders');
  console.log('  GET  /orders');
  console.log('  GET  /orders/:id');
  console.log('  POST /orders/:id/accept');
  console.log('  POST /orders/:id/ready');
  console.log('  POST /orders/:id/collect');
  console.log('  POST /orders/:id/cancel');
});
