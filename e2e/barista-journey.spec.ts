/**
 * E2E Tests — Barista Journey
 *
 * Covers:
 *   2.1 — Accept and fulfil an order
 *   2.2 — Barista cancels an accepted order
 *   2.3 — Kitchen display filters correctly (only PENDING/ACCEPTED/READY shown)
 *   2.4 — Empty kitchen display shows graceful empty state
 *
 * Assumes:
 *   - Backend running at http://localhost:3000
 *   - Frontend running at http://localhost:5173
 *
 * Run with: npx playwright test e2e/barista-journey.spec.ts
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
    data: { customerId: 'test-barista', customerName, items },
  })
  expect(res.ok()).toBeTruthy()
  const order = await res.json()
  await ctx.dispose()
  return order
}

async function apiPost(path: string, body?: Record<string, string>) {
  const ctx = await pwRequest.newContext()
  const res = await ctx.post(`${API_URL}${path}`, body ? { data: body } : undefined)
  const json = await res.json()
  const status = res.status()
  await ctx.dispose()
  return { status, json }
}

async function getActiveOrders() {
  const ctx = await pwRequest.newContext()
  const res = await ctx.get(`${API_URL}/orders`)
  const orders = await res.json()
  await ctx.dispose()
  return orders as Array<{ orderId: string; customerName: string; status: string }>
}

async function cancelAllActiveOrders() {
  const orders = await getActiveOrders()
  for (const order of orders) {
    await apiPost(`/orders/${order.orderId}/cancel`, { reason: 'Test cleanup' })
  }
}

// ---------------------------------------------------------------------------
// Test 2.1 — Accept and Fulfil
// ---------------------------------------------------------------------------
test('2.1 — Barista accepts and fulfils an order', async ({ page }) => {
  // Place order via API
  const order = await placeOrder('Barista Test Customer', [
    { itemId: 'espresso', name: 'Espresso', quantity: 1, unitPrice: 300 },
  ])

  // Navigate to kitchen display
  await page.goto(`${BASE_URL}/kitchen`)

  // Verify order appears as PENDING
  await expect(page.getByText('Barista Test Customer')).toBeVisible()
  await expect(page.getByText('PENDING')).toBeVisible()

  // Click Accept
  await page.getByRole('button', { name: 'Accept' }).first().click()

  // Verify status changes to ACCEPTED on kitchen display
  await expect(page.getByText('ACCEPTED')).toBeVisible()

  // Click Mark Ready
  await page.getByRole('button', { name: 'Mark Ready' }).first().click()

  // Verify status changes to READY (visually highlighted)
  await expect(page.getByText('READY')).toBeVisible()

  // Verify the READY card has green highlight background (via DOM attribute)
  // The OrderCard uses background: '#d4edda' for READY orders
  // Check that the card containing "Barista Test Customer" is highlighted
  const orderCard = page.locator('[style*="d4edda"]').filter({ hasText: 'Barista Test Customer' })
  await expect(orderCard).toBeVisible()

  // Confirm via API: customer sees READY status
  const statusRes = await apiPost(`/orders/${order.orderId}`)
  expect(statusRes.json.status).toBe('READY')

  // Clean up: collect the order
  await apiPost(`/orders/${order.orderId}/collect`)
})

// ---------------------------------------------------------------------------
// Test 2.2 — Barista Cancels Accepted Order
// ---------------------------------------------------------------------------
test('2.2 — Barista cancels an accepted order', async ({ page }) => {
  // Place order via API
  const order = await placeOrder('Barista Cancel Test', [
    { itemId: 'latte', name: 'Latte', quantity: 1, unitPrice: 450 },
  ])

  // Navigate to kitchen display
  await page.goto(`${BASE_URL}/kitchen`)
  await expect(page.getByText('Barista Cancel Test')).toBeVisible()

  // Accept the order
  await page.getByRole('button', { name: 'Accept' }).first().click()
  await expect(page.getByText('ACCEPTED')).toBeVisible()

  // Cancel the accepted order (opens prompt dialog)
  page.on('dialog', async (dialog) => {
    await dialog.fill('Out of oat milk')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Cancel' }).first().click()

  // Verify order removed from kitchen display
  await page.waitForTimeout(500)
  await expect(page.getByText('Barista Cancel Test')).not.toBeVisible()

  // Verify customer sees the cancellation reason via API
  const statusRes = await apiPost(`/orders/${order.orderId}`)
  expect(statusRes.json.status).toBe('CANCELLED')
  expect(statusRes.json.cancellationReason).toBe('Out of oat milk')
})

// ---------------------------------------------------------------------------
// Test 2.3 — Kitchen Display Filters Correctly
// ---------------------------------------------------------------------------
test('2.3 — Kitchen display shows only active orders, READY orders highlighted', async ({ page }) => {
  // Clean up existing orders first
  await cancelAllActiveOrders()

  // Place 3 orders
  const alphaOrder = await placeOrder('Alpha', [
    { itemId: 'espresso', name: 'Espresso', quantity: 1, unitPrice: 300 },
  ])
  const betaOrder = await placeOrder('Beta', [
    { itemId: 'flat-white', name: 'Flat White', quantity: 1, unitPrice: 450 },
  ])
  const gammaOrder = await placeOrder('Gamma', [
    { itemId: 'muffin', name: 'Muffin', quantity: 1, unitPrice: 250 },
  ])

  // Accept Alpha, then mark Alpha READY and collect it
  await apiPost(`/orders/${alphaOrder.orderId}/accept`)
  await apiPost(`/orders/${alphaOrder.orderId}/ready`)
  await apiPost(`/orders/${alphaOrder.orderId}/collect`) // Alpha = COLLECTED

  // Accept + Mark Ready Beta (Beta = READY)
  await apiPost(`/orders/${betaOrder.orderId}/accept`)
  await apiPost(`/orders/${betaOrder.orderId}/ready`)

  // Leave Gamma as PENDING

  // Navigate to kitchen display
  await page.goto(`${BASE_URL}/kitchen`)
  await page.waitForTimeout(500)

  // Alpha (COLLECTED) should NOT be visible
  await expect(page.getByText('Alpha')).not.toBeVisible()

  // Beta (READY) should be visible and highlighted
  await expect(page.getByText('Beta')).toBeVisible()

  // Gamma (PENDING) should be visible
  await expect(page.getByText('Gamma')).toBeVisible()

  // Beta should have READY badge
  const betaCard = page.locator('div').filter({ hasText: /^Beta/ }).first()
  await expect(betaCard.getByText('READY')).toBeVisible()

  // Beta card should have green highlight (background d4edda)
  const readyCard = page.locator('[style*="d4edda"]').filter({ hasText: 'Beta' })
  await expect(readyCard).toBeVisible()

  // Clean up
  await apiPost(`/orders/${betaOrder.orderId}/collect`)
  await apiPost(`/orders/${gammaOrder.orderId}/cancel`, { reason: 'Test cleanup' })
})

// ---------------------------------------------------------------------------
// Test 2.4 — Empty Kitchen Display
// ---------------------------------------------------------------------------
test('2.4 — Empty kitchen display shows graceful empty state', async ({ page }) => {
  // Cancel all active orders
  await cancelAllActiveOrders()

  // Navigate to kitchen display
  await page.goto(`${BASE_URL}/kitchen`)
  await page.waitForTimeout(500)

  // Verify empty state message
  await expect(page.getByText('No active orders')).toBeVisible()
  await expect(page.getByText('Waiting for customers...')).toBeVisible()

  // Verify no error or blank white screen — page title still visible
  await expect(page.getByText('Kitchen Display')).toBeVisible()
})
