# Project Status — CoffeeShop Event Modeling Demo

> **For collaborators:** This file is the single source of truth for where the project stands.
> Read this first before touching any code. Update it every time you complete a phase.

---

## Current State

**Phase:** QA complete — 1 failure to fix
**Last updated:** 2026-03-19
**Updated by:** qa agent
**Next action:** Developer to fix Test 1.3: add `/orders/:id` route or catch-all 404 page in `ui/src/App.tsx`

---

## Work Log

| # | Feature / Task | Phase | Status | Agent / Person | Date | Notes |
|---|---|---|---|---|---|---|
| 1 | Project scaffold & event model | Setup | ✅ Done | Rishabh | 2026-03-19 | EVENT_MODEL.md, journey files, agent configs created |
| 2 | Orders module — backend | Development | ✅ Done | developer agent | 2026-03-19 | Ports, domain, adapters, routes, unit tests — all 10 tests pass, build clean |
| 3 | Orders module — review | Review | ✅ Done | reviewer agent | 2026-03-19 | APPROVED after fixes: `→` arrow in notify logs, error messages aligned to journey files |
| 4 | Customer UI | Development | ✅ Done | developer agent | 2026-03-19 | Vite+React, menu, place order, status polling, cancel/collect flows |
| 5 | Kitchen display UI | Development | ✅ Done | developer agent | 2026-03-19 | Auto-refresh every 3s, accept/ready/cancel, empty state |
| 6 | QA — customer journey | QA | ❌ Failed | qa agent | 2026-03-19 | 2/3 pass. FAIL: Test 1.3 — /orders/:id route missing, blank page on non-existent order URL |
| 7 | QA — barista journey | QA | ✅ Done | qa agent | 2026-03-19 | All 4 tests pass — accept/fulfil, barista cancel, kitchen filter, empty state |
| 8 | QA — cancellation journey | QA | ✅ Done | qa agent | 2026-03-19 | All 3 tests pass — cancel PENDING, cannot cancel READY/COLLECTED/CANCELLED |
| 9 | Formalize E2E tests | Formalization | ✅ Done | qa agent | 2026-03-19 | e2e/ spec files written; 1 known failure documented |

> **Note on prior QA attempt (2026-03-19):** A previous run tested via direct API calls only (no browser). The Playwright MCP was not configured at the time. All backend logic was confirmed correct but the UI flows were not verified. Browser QA must be run fresh.

**Status key:** ✅ Done · 🔄 In Progress · ⬜ Not started · 🚫 Blocked · ❌ Failed

---

## Decisions Made

| # | Decision | Reason | Date |
|---|---|---|---|
| 1 | In-memory adapters only (no database) | This is a learning demo — no setup friction | 2026-03-19 |
| 2 | Coffee shop domain | Canonical event modeling teaching example — universal understanding | 2026-03-19 |
| 3 | Single package (not monorepo) | Keep complexity low for learning purposes | 2026-03-19 |
| 4 | Three user journeys (customer, barista, cancellation) | Each actor has a distinct flow worth modeling separately | 2026-03-19 |
| 5 | Playwright MCP via `.mcp.json` | Enables QA agent to drive a real browser for UI testing | 2026-03-19 |

---

## Open Questions / Blockers

| # | Question | Raised by | Date | Resolution |
|---|---|---|---|---|
| 1 | Missing `/orders/:id` route — blank page on direct URL access | qa agent | 2026-03-19 | App.tsx only defines `/` and `/kitchen`. Navigating to `/orders/nonexistent-id` renders a blank page with no error message. Expected: "Order not found" or a 404 page. Fix: add a `/orders/:id` route or a catch-all 404 route. |

---

## How to Pick Up From Here

### Running QA (next step)
1. Start backend: `npm run dev` (serves on http://localhost:3000)
2. Start frontend: `npm run dev:ui` (serves on http://localhost:5173)
3. Run `@qa run the full test suite`
4. The QA agent will use the Playwright MCP to open a real browser and walk through every journey
5. Update rows #6, #7, #8 with results; row #9 when E2E files are formalized

### If the developer needs to fix QA failures
1. Read the failure report from the QA agent
2. Fix the issue in the relevant file
3. Run `npm run build` and `npm test` to verify no regressions
4. Re-run the failing QA suite

### If you are a new developer
1. Read `EVENT_MODEL.md` — this is the full spec
2. Read `journeys/customer-journey.md`, `barista-journey.md`, `cancellation-journey.md`
3. Read `ARCHITECTURE.md` for the rules
4. Run `npm install`

### If you are the reviewer
1. Read `ARCHITECTURE.md` and `EVENT_MODEL.md`
2. Run `@reviewer review the orders module implementation`

---

## File Map (what is what)

| File | Purpose |
|---|---|
| `EVENT_MODEL.md` | Master event model — commands, events, policies, read models |
| `ARCHITECTURE.md` | Hexagonal architecture rules — must follow |
| `DEVELOPMENT_PROCESS.md` | The Alignment → Dev → Review → QA → Formalize cycle |
| `journeys/customer-journey.md` | Customer scenarios + Playwright test list |
| `journeys/barista-journey.md` | Barista scenarios + Playwright test list |
| `journeys/cancellation-journey.md` | Cancellation scenarios + Playwright test list |
| `.claude/agents/developer.md` | Developer agent instructions |
| `.claude/agents/reviewer.md` | Reviewer agent instructions |
| `.claude/agents/qa.md` | QA agent instructions — uses Playwright MCP browser tools |
| `.mcp.json` | Playwright MCP server config — enables browser automation for QA |
| `.claude/settings.json` | Enables all project MCP servers automatically |
| `src/modules/orders/` | Full backend implementation (ports, domain, adapters, API) |
| `src/index.ts` | Entry point — starts Hono server on port 3000 |
| `src/menu.ts` | Hardcoded menu items |
| `ui/` | Vite+React frontend |
| `e2e/` | Playwright E2E test files (written, not yet browser-verified) |
| `vitest.config.ts` | Scopes vitest to `src/` only (excludes e2e/) |
| `playwright.config.ts` | Playwright config for `npx playwright test` |
| `STATUS.md` | **This file** — always update when completing work |
