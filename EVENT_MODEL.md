# Event Model — Coffee Shop Ordering System

## What Is Event Modeling?

Event Modeling is a way to design the entire information flow of a system on one timeline.
Instead of starting with a database schema or API spec, you start by asking:
**"What happened?"** — and work backwards to commands and forwards to read models.

The four building blocks:

| Block | Question it answers | Example |
|---|---|---|
| **Command** | What does the user/system want to do? | PlaceOrder |
| **Event** | What fact was recorded as a result? | OrderPlaced |
| **Read Model** | What does the UI need to display? | Kitchen Display (active orders) |
| **Policy / Automation** | What should the system do automatically when an event happens? | Notify barista when OrderPlaced |

---

## Bounded Contexts

| Context | Responsibility |
|---|---|
| **Ordering** | Customer places and tracks orders |
| **Kitchen** | Barista views and processes orders |
| **Notification** | System sends alerts to actors |

---

## Aggregates

### Order

```
Order {
  orderId            : UUID
  customerId         : string
  customerName       : string
  items              : OrderItem[]
  status             : OrderStatus   // PENDING | ACCEPTED | READY | COLLECTED | CANCELLED
  totalAmount        : number        // in cents (e.g. 450 = KES 4.50)
  placedAt           : DateTime
  acceptedAt?        : DateTime
  readyAt?           : DateTime
  collectedAt?       : DateTime
  cancelledAt?       : DateTime
  cancellationReason?: string
}

OrderItem {
  itemId    : string
  name      : string
  quantity  : number
  unitPrice : number  // in cents
}
```

**State Machine:**
```
PENDING ──[AcceptOrder]──→ ACCEPTED ──[MarkOrderReady]──→ READY ──[CollectOrder]──→ COLLECTED
   │                           │
   └──[CancelOrder]────────────┘
           ↓
       CANCELLED
```

Invalid transitions (e.g. collecting a cancelled order) throw domain errors.

---

## Commands, Events & Policies

### 1. Place Order

**Actor:** Customer

#### Command: PlaceOrder
```
PlaceOrder {
  customerId   : string
  customerName : string
  items        : [{ itemId, name, quantity, unitPrice }]
}
```

#### Event: OrderPlaced
```
OrderPlaced {
  orderId      : UUID
  customerId   : string
  customerName : string
  items        : OrderItem[]
  totalAmount  : number
  placedAt     : DateTime
}
→ Policy: NotifyBarista("New order #X from <name> — KES <total>")
→ Read Model: Order appears on Kitchen Display (status: PENDING)
→ Read Model: Customer sees order confirmation with orderId
```

---

### 2. Accept Order

**Actor:** Barista

#### Command: AcceptOrder
```
AcceptOrder {
  orderId : UUID
}
```

#### Event: OrderAccepted
```
OrderAccepted {
  orderId    : UUID
  acceptedAt : DateTime
}
→ Policy: NotifyCustomer("Your order is being prepared!")
→ Read Model: Kitchen Display updates status to ACCEPTED
→ Read Model: Customer status view shows "Being Prepared"
```

---

### 3. Mark Order Ready

**Actor:** Barista

#### Command: MarkOrderReady
```
MarkOrderReady {
  orderId : UUID
}
```

#### Event: OrderReady
```
OrderReady {
  orderId : UUID
  readyAt : DateTime
}
→ Policy: NotifyCustomer("Your order is ready for collection!")
→ Read Model: Kitchen Display highlights order as READY
→ Read Model: Customer status view shows "Ready — Please Collect"
```

---

### 4. Collect Order

**Actor:** Customer

#### Command: CollectOrder
```
CollectOrder {
  orderId : UUID
}
```

#### Event: OrderCollected
```
OrderCollected {
  orderId     : UUID
  collectedAt : DateTime
}
→ Read Model: Order removed from Kitchen Display
→ Read Model: Customer status view shows "Collected — Enjoy!"
```

---

### 5. Cancel Order

**Actor:** Customer or Barista

#### Command: CancelOrder
```
CancelOrder {
  orderId : UUID
  reason  : string
}
```

#### Event: OrderCancelled
```
OrderCancelled {
  orderId     : UUID
  reason      : string
  cancelledAt : DateTime
}
→ Policy: NotifyCustomer("Your order was cancelled: <reason>")
→ Read Model: Order removed from Kitchen Display
→ Read Model: Customer status view shows "Cancelled"
```

---

## Read Models

### Kitchen Display
- All orders with status PENDING, ACCEPTED, or READY
- Sorted by placedAt (oldest first)
- Shows: orderId, customerName, items, totalAmount, status, time elapsed

### Customer Order Status
- Single order looked up by orderId
- Shows: status, items, totalAmount, human-readable status message
- Status messages:
  - PENDING → "Order received — waiting for barista"
  - ACCEPTED → "Being prepared by our team"
  - READY → "Ready for collection!"
  - COLLECTED → "Collected — enjoy your order!"
  - CANCELLED → "Order cancelled: `<reason>`"

### Menu
- Hardcoded list of items available to order
- Shows: itemId, name, unitPrice (formatted as KES)

---

## Event Flow Timeline

```
CUSTOMER                    SYSTEM                      BARISTA
────────                    ──────                      ───────
Opens menu
Selects items
PlaceOrder ──────────────→ OrderPlaced
                           ├─→ [Kitchen Display updated]
                           └─→ [NOTIFY: Barista alerted]   ←── Barista sees alert
                                                            AcceptOrder ──────────→ OrderAccepted
                           ←─ [NOTIFY: Being prepared] ←──
Sees "Being Prepared"
                                                            MarkOrderReady ───────→ OrderReady
                           ←─ [NOTIFY: Ready!] ←──────────
Sees "Ready!"
CollectOrder ────────────→ OrderCollected
                           └─→ [Kitchen Display updated]
Done!
```

---

## Domain Events Index

| # | Event | Context | Trigger | Policies |
|---|---|---|---|---|
| 1 | OrderPlaced | Ordering | PlaceOrder command | NotifyBarista |
| 2 | OrderAccepted | Kitchen | AcceptOrder command | NotifyCustomer |
| 3 | OrderReady | Kitchen | MarkOrderReady command | NotifyCustomer |
| 4 | OrderCollected | Ordering | CollectOrder command | — |
| 5 | OrderCancelled | Ordering | CancelOrder command | NotifyCustomer |

---

## How This Maps to Code

```
Event Model Concept        →  Where it lives in src/
─────────────────────────────────────────────────────
Command (PlaceOrder)       →  order.service.ts → placeOrder()
Event (OrderPlaced)        →  order.types.ts → DomainEvent union
Policy (NotifyBarista)     →  notification-sender.port.ts → send()
Read Model (KitchenDisplay)→  GET /orders response (projected from in-memory store)
Aggregate (Order)          →  order.aggregate.ts → state machine + validation
Port (EventEmitter)        →  ports/event-emitter.port.ts → interface
Adapter (ConsoleEmitter)   →  adapters/console-event.emitter.ts → logs to terminal
Wiring                     →  order.module.ts → factory that plugs adapters in
```
