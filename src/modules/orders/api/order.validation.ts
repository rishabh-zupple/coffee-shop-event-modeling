import { z } from 'zod';

export const OrderItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(),
});

export const PlaceOrderBodySchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
});

export const CancelOrderBodySchema = z.object({
  reason: z.string().min(1),
});
