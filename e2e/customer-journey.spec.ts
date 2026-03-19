/**
 * E2E Tests — Customer Journey
 *
 * Covers:
 *   1.1 — Place and collect (full happy path)
 *   1.2 — Customer cancels pending order
 *   1.3 — Order not found (API 404)
 *
 * Assumes:
 *   - Backend running at http://localhost:3000
 *   - Frontend running at http://localhost:5173
 *
 * Run with: npx playwright test e2e/customer-journey.spec.ts
 */

import { test, expect, request } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000'

// ---------------------------------------------------------------------------
// Helper: place an order directly via API
// ---------------------------------------------------------------------------
async function placeOrderViaApi(
  customerName: string,
  items: { itemId: string; name: string; quantity: number; unitPrice: number }[],
) {
  const ctx = await request.newContext()
  const res = await ctx.post(`${API_URL}/orders`, {
    data: { customerId: 'test-customer', customerName, items },
  })
  expect(res.ok()).toBeTruthy()
  const order = await res.json()
  await ctx.dispose()
  return order as { orderId: string; status: string }
}

// ---------------------------------------------------------------------------
// Helper: transition order via API
// ---------------------------------------------------------------------------
async function apiPost(path: string, body?: Record<string, string>) {
  const ctx = await request.newContext()
  const res = await ctx.post(`${API_URL}${path}`, body ? { data: body } : undefined)
  const json = await res.json()
  await ctx.dispose()
  return { status: res.status(), json }
}

// ---------------------------------------------------------------------------
// Test 1.1 — Place and collect (full happy path)
// ---------------------------------------------------------------------------
test('1.1 — Place and collect (full happy path)', async ({ page }) => {
  // Navigate to customer page
  await page.goto(BASE_URL)

  // Verify menu is visible
  await expect(page.getByText('Flat White')).toBeVisible()
  await expect(page.getByText('Espresso')).toBeVisible()
  await expect(page.getByText('Cappuccino')).toBeVisible()
  await expect(page.getByText('Croissant')).toBeVisible()

  // Enter customer name
  await page.fill('input[placeholder="Your name"]', 'Test Customer')

  // Select Flat White x1 and Croissant x1 using the + buttons
  // Each menu item row has − and + buttons; click + next to the correct item
  const menuItems = page.locator('div').filter({ hasText: /^Flat White/ }).first()
  await menuItems.getByRole('button', { name: '+' }).click()

  const croissantItem = page.locator('div').filter({ hasText: /^Croissant/ }).first()
  await croissantItem.getByRole('button', { name: '+' }).click()

  // Place order
  await page.getByRole('button', { name: 'Place Order' }).click()

  // Verify order confirmation: orderId and status message
  await expect(page.getByText('Order received — waiting for barista')).toBeVisible()
  await expect(page.getByText(/Order #/)).toBeVisible()
  await expect(page.getByText('KES 8.00')).toBeVisible()

  // Get the orderId from the page (shown as truncated Order #XXXXXXXX)
  // Use API to get the order ID — the placed order will be the most recent PENDING one
  const kitchenCtx = await request.newContext()
  const kitchenRes = await kitchenCtx.get(`${API_URL}/orders`)
  const activeOrders = await kitchenRes.json()
  const testOrder = activeOrders.find((o: { customerName: string }) => o.customerName === 'Test Customer')
  expect(testOrder).toBeDefined()
  const orderId: string = testOrder.orderId
  await kitchenCtx.dispose()

  // Navigate to kitchen display and verify PENDING
  await page.goto(`${BASE_URL}/kitchen`)
  await expect(page.getByText('Test Customer')).toBeVisible()
  await expect(page.getByText('PENDING')).toBeVisible()

  // Accept the order
  await page.getByRole('button', { name: 'Accept' }).first().click()

  // Verify ACCEPTED appears on kitchen display
  await expect(page.getByText('ACCEPTED')).toBeVisible()

  // Navigate back to a new customer page and check status
  // (CustomerPage holds state in React; re-navigate resets it — status must be checked via API)
  const statusCheck1 = await apiPost(`/orders/${orderId}`)
  // Re-navigate to reset state and use the stored orderId
  // Since the UI doesn't expose a /orders/:id route, we verify via API
  expect(statusCheck1.json.status).toBe('ACCEPTED')

  // Mark ready
  await page.goto(`${BASE_URL}/kitchen`)
  await expect(page.getByText('ACCEPTED')).toBeVisible()
  await page.getByRole('button', { name: 'Mark Ready' }).first().click()

  // Verify READY on kitchen display
  await expect(page.getByText('READY')).toBeVisible()

  // Confirm via API that status is READY
  const statusCheck2 = await apiPost(`/orders/${orderId}`)
  expect(statusCheck2.json.status).toBe('READY')

  // Collect via API (simulates customer clicking "I've collected my order")
  const collectRes = await apiPost(`/orders/${orderId}/collect`)
  expect(collectRes.json.status).toBe('COLLECTED')

  // Navigate to kitchen display and verify order is gone
  await page.goto(`${BASE_URL}/kitchen`)
  // Allow refresh
  await page.waitForTimeout(500)
  const testCustomerEl = page.getByText('Test Customer')
  await expect(testCustomerEl).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// Test 1.2 — Customer cancels a pending order
// ---------------------------------------------------------------------------
test('1.2 — Customer cancels pending order', async ({ page }) => {
  await page.goto(BASE_URL)

  // Enter name and select an item
  await page.fill('input[placeholder="Your name"]', 'Cancel Test Customer')
  const espressoItem = page.locator('div').filter({ hasText: /^Espresso/ }).first()
  await espressoItem.getByRole('button', { name: '+' }).click()

  // Place order
  await page.getByRole('button', { name: 'Place Order' }).click()

  // Verify PENDING status
  await expect(page.getByText('Order received — waiting for barista')).toBeVisible()

  // Click "Cancel Order" — opens a prompt dialog
  page.on('dialog', async (dialog) => {
    await dialog.fill('Changed my mind')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Cancel Order' }).click()

  // Verify cancellation message
  await expect(page.getByText('Order cancelled: Changed my mind')).toBeVisible()

  // Verify cancelled order is NOT on kitchen display
  const ctx = await request.newContext()
  const res = await ctx.get(`${API_URL}/orders`)
  const activeOrders = await res.json()
  const found = activeOrders.find((o: { customerName: string }) => o.customerName === 'Cancel Test Customer')
  expect(found).toBeUndefined()
  await ctx.dispose()
})

// ---------------------------------------------------------------------------
// Test 1.3 — Order not found (API 404)
// ---------------------------------------------------------------------------
test('1.3 — Order not found returns 404', async () => {
  // The customer SPA has no /orders/:id route. Per test specification,
  // we verify the API directly returns a 404 with an error message.
  const ctx = await request.newContext()
  const res = await ctx.get(`${API_URL}/orders/nonexistent-id-12345`)
  expect(res.status()).toBe(404)
  const body = await res.json()
  expect(body.error).toBe('Order not found')
  await ctx.dispose()
})
