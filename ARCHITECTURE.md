# Architecture — CoffeeShop Event Modeling Demo

## Hexagonal Architecture (Ports & Adapters)

The domain logic sits at the center. Infrastructure (HTTP, in-memory store, console output) is on the outside. They connect through port interfaces.

```
HTTP Request ──→  API Layer (Hono routes + Zod validation)
                        │
                  Domain Layer
                  OrderService + Order Aggregate
                  Pure business logic
                  Depends ONLY on port interfaces
                        │
                  Ports (Interfaces)
                  OrderRepository, EventEmitter, NotificationSender
                        │
                  Adapters (Implementations)
                  InMemoryOrderRepository, ConsoleEventEmitter, ConsoleNotificationSender
```

## The Five Rules

1. **Domain never imports infrastructure.** `order.service.ts` never imports the adapter files. It only imports port interfaces.
2. **Ports are interfaces only.** No implementations, no side effects — just TypeScript interfaces.
3. **Adapters implement ports.** Each adapter file implements exactly one port interface.
4. **API routes are thin.** Parse request → call domain → return response. No business logic in routes.
5. **`order.module.ts` is the only wiring point.** It's the only file that imports both domain and adapters.

## Why This Matters for Event Modeling

The port boundaries map directly to event model swim lanes:

| Event Model Swim Lane | Code Boundary |
|---|---|
| Customer / Barista (UI) | `api/order.routes.ts` |
| System (command handler) | `domain/order.service.ts` |
| Event store | `ports/event-emitter.port.ts` |
| Notifications | `ports/notification-sender.port.ts` |
| Order data | `ports/order-repository.port.ts` |

Swapping an adapter (e.g. in-memory → PostgreSQL) never touches the domain. The event model stays the same.

## Technology

| Concern | Choice | Why |
|---|---|---|
| HTTP | Hono | Lightweight, same as KNEC |
| Persistence | In-memory (Map) | No setup required — this is a learning demo |
| Events | Console logger | Makes event flow visible in terminal |
| Validation | Zod | Runtime safety on all inputs |
| Tests | Vitest | Fast, zero config |
| E2E Tests | Playwright | Real browser, tests user journeys |
