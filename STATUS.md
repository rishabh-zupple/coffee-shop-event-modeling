# Project Status — CoffeeShop Event Modeling Demo

> **For collaborators:** This file is the single source of truth for where the project stands.
> Read this first before touching any code. Update it every time you complete a phase.

---

## Current State

**Phase:** Setup complete — ready for implementation
**Last updated:** 2026-03-19
**Updated by:** Rishabh (setup)
**Next action:** Run `@developer implement the orders module` to begin implementation

---

## Work Log

| # | Feature / Task | Phase | Status | Agent / Person | Date | Notes |
|---|---|---|---|---|---|---|
| 1 | Project scaffold & event model | Setup | ✅ Done | Rishabh | 2026-03-19 | EVENT_MODEL.md, journey files, agent configs created |
| 2 | Orders module — backend | Development | ⬜ Not started | — | — | Ports, domain, adapters, routes, unit tests |
| 3 | Orders module — review | Review | ⬜ Blocked | — | — | Waiting on #2 |
| 4 | Customer UI | Development | ⬜ Not started | — | — | Place order form + order status page |
| 5 | Kitchen display UI | Development | ⬜ Not started | — | — | Barista view, accept/ready/cancel buttons |
| 6 | QA — customer journey | QA | ⬜ Blocked | — | — | Waiting on #2, #4 |
| 7 | QA — barista journey | QA | ⬜ Blocked | — | — | Waiting on #2, #5 |
| 8 | QA — cancellation journey | QA | ⬜ Blocked | — | — | Waiting on #2, #4, #5 |
| 9 | Formalize E2E tests | Formalization | ⬜ Blocked | — | — | Waiting on #6, #7, #8 |

**Status key:** ✅ Done · 🔄 In Progress · ⬜ Not started · 🚫 Blocked · ❌ Failed

---

## Decisions Made

| # | Decision | Reason | Date |
|---|---|---|---|
| 1 | In-memory adapters only (no database) | This is a learning demo — no setup friction | 2026-03-19 |
| 2 | Coffee shop domain | Canonical event modeling teaching example — universal understanding | 2026-03-19 |
| 3 | Single package (not monorepo) | Keep complexity low for learning purposes | 2026-03-19 |
| 4 | Three user journeys (customer, barista, cancellation) | Each actor has a distinct flow worth modeling separately | 2026-03-19 |

---

## Open Questions / Blockers

| # | Question | Raised by | Date | Resolution |
|---|---|---|---|---|
| — | None currently | — | — | — |

---

## How to Pick Up From Here

### If you are the next developer:
1. Read `EVENT_MODEL.md` — this is the full spec
2. Read `journeys/customer-journey.md`, `barista-journey.md`, `cancellation-journey.md`
3. Read `ARCHITECTURE.md` for the rules
4. Run `npm install` in this directory
5. Run `@developer implement the orders module`
6. Update row #2 in the Work Log above when done

### If you are the reviewer:
1. Read `ARCHITECTURE.md` and `EVENT_MODEL.md`
2. Check out the branch the developer worked on
3. Run `@reviewer review the orders module implementation`
4. Update row #3 in the Work Log above with verdict

### If you are running QA:
1. Start the app: `npm run dev` (backend) + `npm run dev:ui` (frontend)
2. Run `@qa run the full test suite`
3. Update rows #6, #7, #8 in the Work Log above with results

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
| `.claude/agents/qa.md` | QA agent instructions (Playwright) |
| `src/` | Implementation (empty — pending development) |
| `e2e/` | Playwright E2E tests (empty — pending QA formalization) |
| `STATUS.md` | **This file** — always update when completing work |
