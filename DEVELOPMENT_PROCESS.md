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
- Creates a feature branch from `main` (`feature/<short-description>`)
- Reads journey files and EVENT_MODEL.md
- Implements ports → domain → adapters → routes → tests
- Follows ARCHITECTURE.md rules strictly
- Runs `npm test` and `npm run build` before finishing
- Pushes the branch and opens a PR targeting `main`
- Updates STATUS.md and reports any spec gaps found

---

## Phase 3 — Reviewer Agent

**Invoke:** `@reviewer review the latest implementation`

The reviewer agent:
- Checks bidirectional spec alignment (code ↔ event model)
- Verifies architecture rules (no domain→infra imports, thin routes, etc.)
- Verifies state machine completeness
- Returns APPROVED or CHANGES REQUESTED with a specific list
- Comments verdict on the GitHub PR and applies the appropriate label

---

## Phase 4 — QA Agent

**Invoke:** `@qa run the full test suite`

The QA agent:
- Uses Playwright MCP to test every scenario in all three journey files
- Tests against the live running app (backend + frontend both must be running)
- Reports PASS/FAIL per scenario with reproduction steps for failures
- Failures go back to developer — not directly to reviewer
- On all passing: comments on the GitHub PR and applies `ready-to-merge` label

---

## Phase 5 — Formalize E2E Tests

Once all QA scenarios pass:

- QA agent converts manual Playwright steps into `e2e/*.spec.ts` test files
- Tests are runnable via `npx playwright test`
- These catch regressions on future changes

---

## Branching & PR Strategy

| Rule | Detail |
|---|---|
| `main` is always stable | Never commit directly to `main` |
| One branch per feature | `feature/<short-description>` (e.g. `feature/orders-module`) |
| Branch from `main` | Always `git checkout main && git pull` before branching |
| One PR per branch | PR targets `main`, stays open until QA passes |
| PR labels | `ready-for-review` → `changes-requested` / `ready-for-qa` → `ready-to-merge` |
| Merge only after QA | PR is merged to `main` only when QA agent marks it `ready-to-merge` |

**PR body template (developer fills this in):**
```
## What this implements
- <feature or journey file covered>

## Journey files covered
- journeys/<x>-journey.md — scenarios: <list>

## How to test
1. `npm install && npm run dev`
2. Open http://localhost:3001

## Spec gaps found
- <any EVENT_MODEL.md inconsistencies noticed>

## Ready for
- [ ] Reviewer
- [ ] QA
```

---

## Agents Reference

| Agent | File | When to Use |
|---|---|---|
| developer | `.claude/agents/developer.md` | Implementing features |
| reviewer | `.claude/agents/reviewer.md` | After developer finishes |
| qa | `.claude/agents/qa.md` | After reviewer approves |
