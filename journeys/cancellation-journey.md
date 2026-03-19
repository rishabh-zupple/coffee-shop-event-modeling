# Cancellation Journey — Cancel an Order

## Actor
**Customer** or **Barista** — either actor can cancel an order under the right conditions.

## Entry Point
Either the customer's order status page or the barista's kitchen display.

---

## When Can an Order Be Cancelled?

```
PENDING   → can be cancelled ✓  (customer or barista)
ACCEPTED  → can be cancelled ✓  (barista only — item unavailable, machine broken, etc.)
READY     → cannot be cancelled ✗  (order is already done, customer must collect)
COLLECTED → cannot be cancelled ✗  (order is complete)
CANCELLED → cannot be cancelled ✗  (already cancelled)
```

---

## Journey 1: Customer Cancels a Pending Order

### Given
- Order exists with status PENDING
- Barista has not yet accepted it

### Steps

```
1. Customer is on the order status page for their order
   → Status shows "Order received — waiting for barista"

2. Customer clicks "Cancel Order"
   → Sees a text field: "Reason for cancellation"
   → Enters: "Changed my mind"

3. Customer confirms cancellation
   → [Command: CancelOrder { orderId, reason: "Changed my mind" }]
   → [Event: OrderCancelled { orderId, reason, cancelledAt }]

4. Customer status view updates:
   → "Order cancelled: Changed my mind"

5. Kitchen Display no longer shows the order
```

### Expected Outcome
- Order status: CANCELLED
- Reason stored on order record
- Order removed from kitchen display
- Console: `[NOTIFY → CUSTOMER] Your order was cancelled: Changed my mind`

---

## Journey 2: Barista Cancels an Accepted Order

### Given
- Order exists with status ACCEPTED
- Barista is unable to fulfil the order

### Steps

```
1. Barista is on the Kitchen Display
   → Sees order with status ACCEPTED

2. Barista clicks "Cancel" on the order
   → Enters reason: "Out of oat milk"

3. Barista confirms cancellation
   → [Command: CancelOrder { orderId, reason: "Out of oat milk" }]
   → [Event: OrderCancelled { orderId, reason, cancelledAt }]

4. Kitchen Display removes the order

5. Customer (if checking) sees:
   → "Order cancelled: Out of oat milk"
```

### Expected Outcome
- Order status: CANCELLED
- Customer notified with specific reason
- Console: `[NOTIFY → CUSTOMER] Your order was cancelled: Out of oat milk`

---

## Journey 3: Attempt to Cancel a Ready Order (Invalid)

### Given
- Order exists with status READY

### Steps

```
1. Any actor attempts CancelOrder on a READY order
   → [Command: CancelOrder on READY order]
   → System rejects: "Cannot cancel an order that is ready for collection"
   → HTTP 400 with error message

2. Order state remains READY
```

### Expected Outcome
- Domain error returned
- State machine holds — no invalid transitions

---

## Journey 4: Attempt to Cancel an Already Cancelled Order (Invalid)

### Given
- Order exists with status CANCELLED

### Steps

```
1. Any actor attempts CancelOrder again
   → System rejects: "Order is already cancelled"
   → HTTP 400

2. No new event is emitted
3. Order state unchanged
```

### Expected Outcome
- Idempotency guard in domain layer
- No double-cancellation events

---

## Policies Triggered on OrderCancelled

| Policy | Action |
|---|---|
| NotifyCustomer | Sends message with cancellation reason |
| KitchenDisplay | Removes order from active queue |

---

## Playwright Test Scenarios (for QA Agent)

1. **customer-cancel-pending**: Customer cancels pending order → verify status = CANCELLED, reason stored, removed from kitchen
2. **barista-cancel-accepted**: Barista cancels accepted order → verify customer sees reason, removed from kitchen
3. **cancel-ready-order**: Attempt cancel on READY order → verify 400, state unchanged
4. **cancel-already-cancelled**: Attempt cancel on CANCELLED order → verify 400, no new event
