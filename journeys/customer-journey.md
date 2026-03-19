# Customer Journey — Place and Track an Order

## Actor
**Customer** — a person visiting the coffee shop who wants to order a drink or food item.

## Entry Point
Customer opens the Coffee Shop portal (`http://localhost:5173`).

---

## Journey 1: Successful Order — Full Flow

### Given
- The coffee shop is open and accepting orders
- The customer knows what they want

### Steps

```
1. Customer opens the app
   → Sees the menu with items and prices

2. Customer enters their name
   → "John Kamau"

3. Customer selects items from the menu
   → 1x Flat White (KES 4.50)
   → 1x Croissant (KES 3.50)

4. Customer clicks "Place Order"
   → [Command: PlaceOrder]
   → [Event: OrderPlaced]
   → Customer sees order confirmation:
        Order ID: abc-123
        Status: "Order received — waiting for barista"
        Total: KES 8.00

5. Barista accepts the order (in kitchen view)
   → [Event: OrderAccepted]
   → Customer status view updates to:
        "Being prepared by our team"

6. Barista marks order ready
   → [Event: OrderReady]
   → Customer status view updates to:
        "Ready for collection!"

7. Customer clicks "I've collected my order"
   → [Command: CollectOrder]
   → [Event: OrderCollected]
   → Customer sees:
        "Collected — enjoy your order!"
```

### Expected Outcome
- Order progresses through all states: PENDING → ACCEPTED → READY → COLLECTED
- Customer sees real-time status updates at each step
- Events are visible in server console

---

## Journey 2: Customer Cancels Before Acceptance

### Given
- Customer has placed an order (status: PENDING)
- Barista has not yet accepted it

### Steps

```
1. Customer has placed order abc-456 (PENDING)

2. Customer changes their mind and clicks "Cancel Order"
   → Enters reason: "Changed my mind"
   → [Command: CancelOrder]
   → [Event: OrderCancelled]
   → Customer sees:
        "Order cancelled: Changed my mind"

3. Order disappears from Kitchen Display
```

### Expected Outcome
- Order status becomes CANCELLED
- Order no longer visible in kitchen
- Cancellation reason is recorded

---

## Journey 3: Invalid Action — Try to Collect an Uncompleted Order

### Given
- Customer has placed an order (status: PENDING or ACCEPTED)

### Steps

```
1. Customer attempts to call CollectOrder on an order that is not READY
   → [Command: CollectOrder on PENDING order]
   → System rejects: "Cannot collect an order that is not ready"
   → HTTP 400 with error message

2. Order remains in current state (unchanged)
```

### Expected Outcome
- Domain error is returned — state machine enforced
- Order state is not corrupted

---

## Journey 4: Order Not Found

### Given
- Customer provides a non-existent orderId

### Steps

```
1. Customer checks status for orderId "does-not-exist"
   → GET /orders/does-not-exist
   → System returns 404: "Order not found"
```

### Expected Outcome
- Clear 404 response
- No server crash

---

## Read Models Used in This Journey

| Screen | Read Model | API |
|---|---|---|
| Menu | Menu (hardcoded) | GET /menu |
| Order confirmation | Customer Order Status | GET /orders/:id |
| Status tracking | Customer Order Status | GET /orders/:id |

---

## Playwright Test Scenarios (for QA Agent)

The QA agent must cover all of the above journeys using the portal UI:

1. **place-and-collect**: Place order → poll status → collect → verify "Collected"
2. **customer-cancel**: Place order → cancel → verify "Cancelled" and not on kitchen display
3. **invalid-collect**: Place order → attempt collect before READY → verify 400 error
4. **not-found**: Check status for fake ID → verify 404
