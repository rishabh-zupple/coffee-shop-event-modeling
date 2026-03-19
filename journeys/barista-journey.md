# Barista Journey — Process and Fulfil Orders

## Actor
**Barista** — a staff member at the coffee shop who sees incoming orders and prepares them.

## Entry Point
Barista opens the Kitchen Display (`http://localhost:5173/kitchen`).

---

## Journey 1: Accept and Fulfil an Order

### Given
- A customer has placed an order (OrderPlaced event has fired)
- Barista is on the Kitchen Display page

### Steps

```
1. Barista opens the Kitchen Display
   → Sees a list of active orders
   → New order appears: "John Kamau — Flat White x1, Croissant x1 — KES 8.00 — PENDING"

2. Barista clicks "Accept" on the order
   → [Command: AcceptOrder]
   → [Event: OrderAccepted]
   → Order status on Kitchen Display changes to ACCEPTED
   → Console shows: [NOTIFY → CUSTOMER] "Your order is being prepared!"

3. Barista prepares the items

4. Barista clicks "Mark Ready" on the order
   → [Command: MarkOrderReady]
   → [Event: OrderReady]
   → Order status on Kitchen Display changes to READY (highlighted)
   → Console shows: [NOTIFY → CUSTOMER] "Your order is ready for collection!"

5. Customer collects the order
   → [Event: OrderCollected] (triggered by customer)
   → Order disappears from Kitchen Display
```

### Expected Outcome
- Kitchen Display shows real-time order state changes
- Barista can progress any order through its lifecycle
- Collected orders are automatically removed from the display

---

## Journey 2: Barista Cancels an Order (Unable to Fulfil)

### Given
- An order exists with status PENDING or ACCEPTED
- Barista is unable to fulfil the order (e.g., item out of stock)

### Steps

```
1. Barista sees order on Kitchen Display

2. Barista clicks "Cancel" on the order
   → Enters reason: "Espresso machine broken"
   → [Command: CancelOrder]
   → [Event: OrderCancelled]
   → Console shows: [NOTIFY → CUSTOMER] "Your order was cancelled: Espresso machine broken"
   → Order disappears from Kitchen Display
```

### Expected Outcome
- Order status becomes CANCELLED
- Customer is notified with the specific reason
- Order no longer clutters the kitchen display

---

## Journey 3: Kitchen Display Shows Correct Order Queue

### Given
- Multiple orders exist in various states

### Steps

```
1. Barista opens Kitchen Display

2. Display shows only ACTIVE orders:
   - Order A: PENDING  (oldest, at top)
   - Order B: ACCEPTED
   - Order C: READY    (highlighted)

3. Orders with status COLLECTED or CANCELLED are NOT shown

4. Orders are sorted oldest-first so nothing gets missed
```

### Expected Outcome
- COLLECTED and CANCELLED orders are filtered out
- Queue is ordered by time placed (oldest at top)
- READY orders are visually distinguished

---

## Journey 4: Invalid Action — Try to Accept an Already Accepted Order

### Given
- Order exists with status ACCEPTED

### Steps

```
1. Barista (or API caller) attempts AcceptOrder on an already ACCEPTED order
   → [Command: AcceptOrder on ACCEPTED order]
   → System rejects: "Cannot accept an order that is not pending"
   → HTTP 400 with error message

2. Order state remains ACCEPTED (unchanged)
```

### Expected Outcome
- State machine prevents double-acceptance
- Idempotency-style guard in domain layer

---

## Journey 5: No Orders — Empty Kitchen Display

### Given
- No orders have been placed, or all orders are collected/cancelled

### Steps

```
1. Barista opens Kitchen Display
   → Sees empty state: "No active orders"
```

### Expected Outcome
- Graceful empty state, no errors

---

## Read Models Used in This Journey

| Screen | Read Model | API |
|---|---|---|
| Kitchen Display | Active Orders | GET /orders |
| Order card | Order detail (inline) | included in GET /orders |

---

## Playwright Test Scenarios (for QA Agent)

The QA agent must cover all of the above journeys using the portal UI:

1. **accept-and-fulfil**: Simulate customer placing order → barista accepts → marks ready → verify kitchen display updates at each step
2. **barista-cancel**: Barista cancels an accepted order → verify cancellation reason stored, order removed from display
3. **kitchen-filter**: Create orders in mixed states → verify only PENDING/ACCEPTED/READY appear on kitchen display
4. **invalid-accept**: Attempt to accept already-accepted order → verify 400 error, state unchanged
5. **empty-kitchen**: No orders placed → verify empty state displayed
