# Development Process — CoffeeShop

Every feature follows the same cycle. No step is skipped.

## Cycle

```
Alignment ──→ Developer ──→ Reviewer ──→ QA ──→ Formalize E2E Tests
                  ▲              │          │
                  └──────────────┘          │
                  (changes requested)       │
                  ▲                         │
                  └─────────────────────────┘
                  (failures reported)
```

---

## Phase 1 — Alignment

Before any code is written:

1. Read the relevant journey file in `journeys/`
2. Identify all commands, events, and policies from `EVENT_MODEL.md`
3. Agree on scope: what is in, what is out
4. Note any gaps between the journey files and the event model

---

## Phase 2 — Developer Agent

**Invoke:** `@developer implement <feature>`

The developer agent:
- Reads journey files and EVENT_MODEL.md
- Implements ports → domain → adapters → routes → tests
- Follows ARCHITECTURE.md rules strictly
- Runs `npm test` and `npm run build` before finishing
- Reports any spec gaps found

---

## Phase 3 — Reviewer Agent

**Invoke:** `@reviewer review the latest implementation`

The reviewer agent:
- Checks bidirectional spec alignment (code ↔ event model)
- Verifies architecture rules (no domain→infra imports, thin routes, etc.)
- Verifies state machine completeness
- Returns APPROVED or CHANGES REQUESTED with a specific list

---

## Phase 4 — QA Agent

**Invoke:** `@qa run the full test suite`

The QA agent:
- Uses Playwright MCP to test every scenario in all three journey files
- Tests against the live running app (backend + frontend both must be running)
- Reports PASS/FAIL per scenario with reproduction steps for failures
- Failures go back to developer — not directly to reviewer

---

## Phase 5 — Formalize E2E Tests

Once all QA scenarios pass:

- QA agent converts manual Playwright steps into `e2e/*.spec.ts` test files
- Tests are runnable via `npx playwright test`
- These catch regressions on future changes

---

## Agents Reference

| Agent | File | When to Use |
|---|---|---|
| developer | `.claude/agents/developer.md` | Implementing features |
| reviewer | `.claude/agents/reviewer.md` | After developer finishes |
| qa | `.claude/agents/qa.md` | After reviewer approves |
