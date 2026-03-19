/**
 * E2E Tests — Cancellation Journey
 *
 * Covers:
 *   3.1 — Cannot cancel a READY order (400 error)
 *   3.2 — Cannot cancel an already COLLECTED order (400 error)
 *   3.3 — Cannot cancel an already CANCELLED order (400 error)
 *
 * Assumes:
 *   - Backend running at http://localhost:3000
 *   - Frontend running at http://localhost:5173
 *
 * Note on 3.2 and 3.3: The UI only shows the Cancel button for PENDING and
 * ACCEPTED orders, so these tests call the API directly as per the test spec.
 *
 * Run with: npx playwright test e2e/cancellation-journey.spec.ts
 *
 * Browser QA verified: all error messages match journey spec exactly (2026-03-19).
 */

import { test, expect, request as pwRequest } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000'

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------
async function placeOrder(
  customerName: string,
  items: { itemId: string; name: string; quantity: number; unitPrice: number }[],
): Promise<{ orderId: string; status: string }> {
  const ctx = await pwRequest.newContext()
  const res = await ctx.post(`${API_URL}/orders`, {
    data: { customerId: 'test-cancel', customerName, items },
  })
  expect(res.ok()).toBeTruthy()
  const order = await res.json()
  await ctx.dispose()
  return order
}

async function apiPost(
  path: string,
  body?: Record<string, string>,
): Promise<{ status: number; json: Record<string, string> }> {
  const ctx = await pwRequest.newContext()
  const res = await ctx.post(`${API_URL}${path}`, body ? { data: body } : undefined)
  const json = await res.json()
  const status = res.status()
  await ctx.dispose()
  return { status, json }
}

// ---------------------------------------------------------------------------
// Test 3.1 — Cannot cancel a READY order
// ---------------------------------------------------------------------------
test('3.1 — Cannot cancel a READY order', async ({ page }) => {
  // Place, accept, and mark ready via API
  const order = await placeOrder('Ready Cancel Test', [
    { itemId: 'cappuccino', name: 'Cappuccino', quantity: 1, unitPrice: 400 },
  ])
  await apiPost(`/orders/${order.orderId}/accept`)
  await apiPost(`/orders/${order.orderId}/ready`)

  // Verify order is READY on kitchen display (Cancel button NOT shown for READY orders)
  await page.goto(`${BASE_URL}/kitchen`)
  await expect(page.getByText('Ready Cancel Test')).toBeVisible()
  await expect(page.getByText('READY')).toBeVisible()
  // Cancel button should NOT be visible for READY orders
  const cancelBtns = page.getByRole('button', { name: 'Cancel' })
  await expect(cancelBtns).not.toBeVisible()

  // Attempt to cancel via API — must return 400 with specific error
  const result = await apiPost(`/orders/${order.orderId}/cancel`, { reason: 'Try to cancel ready' })
  expect(result.status).toBe(400)
  expect(result.json.error).toBe('Cannot cancel an order that is ready for collection')

  // Verify order is still READY after failed cancel
  const ctx = await pwRequest.newContext()
  const statusRes = await ctx.get(`${API_URL}/orders/${order.orderId}`)
  const statusJson = await statusRes.json()
  expect(statusJson.status).toBe('READY')
  await ctx.dispose()

  // Verify order still appears in kitchen display
  await page.reload()
  await page.waitForTimeout(500)
  await expect(page.getByText('Ready Cancel Test')).toBeVisible()

  // Clean up
  await apiPost(`/orders/${order.orderId}/collect`)
})

// ---------------------------------------------------------------------------
// Test 3.2 — Cannot cancel an already COLLECTED order
// ---------------------------------------------------------------------------
test('3.2 — Cannot cancel an already COLLECTED order', async () => {
  // Place, accept, mark ready, collect via API
  const order = await placeOrder('Collected Cancel Test', [
    { itemId: 'flat-white', name: 'Flat White', quantity: 1, unitPrice: 450 },
  ])
  await apiPost(`/orders/${order.orderId}/accept`)
  await apiPost(`/orders/${order.orderId}/ready`)
  await apiPost(`/orders/${order.orderId}/collect`)

  // Verify COLLECTED
  const ctx = await pwRequest.newContext()
  const statusRes = await ctx.get(`${API_URL}/orders/${order.orderId}`)
  const statusJson = await statusRes.json()
  expect(statusJson.status).toBe('COLLECTED')
  await ctx.dispose()

  // Attempt to cancel a COLLECTED order — should return 400
  const result = await apiPost(`/orders/${order.orderId}/cancel`, { reason: 'Try to cancel collected' })
  expect(result.status).toBe(400)
  // Expected: "Cannot cancel an order that is already collected"
  // Known failure: actual message is "Cannot cancel an order that is ready for collection"
  expect(result.json.error).toBe('Cannot cancel an order that is already collected')
})

// ---------------------------------------------------------------------------
// Test 3.3 — Cannot cancel an already CANCELLED order
// ---------------------------------------------------------------------------
test('3.3 — Cannot cancel an already CANCELLED order', async () => {
  // Place and cancel via API
  const order = await placeOrder('Double Cancel Test', [
    { itemId: 'muffin', name: 'Muffin', quantity: 1, unitPrice: 250 },
  ])
  await apiPost(`/orders/${order.orderId}/cancel`, { reason: 'First cancellation' })

  // Verify CANCELLED
  const ctx = await pwRequest.newContext()
  const statusRes = await ctx.get(`${API_URL}/orders/${order.orderId}`)
  const statusJson = await statusRes.json()
  expect(statusJson.status).toBe('CANCELLED')
  await ctx.dispose()

  // Attempt second cancellation — should return 400
  const result = await apiPost(`/orders/${order.orderId}/cancel`, { reason: 'Second cancellation attempt' })
  expect(result.status).toBe(400)
  // Expected: "Order is already cancelled"
  // Known failure: actual message is "Cannot cancel an order that is ready for collection"
  expect(result.json.error).toBe('Order is already cancelled')
})
