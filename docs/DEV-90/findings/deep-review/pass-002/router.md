---
agent: step-8-router-mode-a-deep
input_branch: ccc35852f7273ce2e967d66919bab70b07264ecb
verdict: loop-back
jumpTo: task-creation
---

## Summary

Pass-002 merged six angle findings after pass-001 remediation. Security is clean (zero findings). Runtime defects from pass-001 (stale copied state on order navigation, `useClipboard` timer overlap, missing `aria-live`, URL/click unit tests) are confirmed fixed in source and verified by reviewers. No BLOCKERs. Three SHOULD-FIX findings remain — all test-coverage gaps guarding load-bearing pass-001 fixes and PRD AC3 label semantics. All WARNINGs are deferred or dropped as Storybook hygiene, cosmetic touch-hover, perf tradeoffs, or duplicate angles on the FIX rows. Verdict: **loop-back** to **task-creation** for two focused test tasks before PR.

## Disposition per finding

| Finding | Reviewer tier | Disposition | Rationale (1-2 lines) |
|---|---|---|---|
| `desktop-ux/F-001` | SHOULD-FIX | FIX | Trigger: copy on order A then navigate to B within ~2 s; developer drops `key={order.id}`. Impact: stale "Order link copied" on wrong order — regression of T-473f727d fix ships without CI signal. Load-bearing guard test. |
| `desktop-ux/F-002` | SHOULD-FIX | FIX | Trigger: Enter on copy button after success; inspect button `aria-label`/`title`. Impact: PRD AC3 label swap regression passes mocked tests while SR users on focused control get wrong name. Concrete assertion fix. |
| `desktop-ux/F-003` | WARNING | DEFER | Trigger: Tab through TopNav during ~100–500 ms load window. Impact: copy slot absent mid-load then inserted — mild focus-path discontinuity, intentional per ui-design; placeholder button is polish OOS. |
| `desktop-ux/F-004` | WARNING | DEFER | Trigger: second copy click within ~300 ms while `isCopied` true. Impact: polite live region may not re-announce; visual state correct. Sibling clipboard controls lack live regions — acceptable parity. |
| `mobile-ux/F-001` | WARNING | DEFER | Recurring from pass-001 (DEFER). Trigger: single tap on touch device. Impact: sticky `:hover` background until next tap — cosmetic, matches many Macaw controls; `@media (hover: hover)` is polish. |
| `mobile-ux/F-002` | WARNING | DEFER | Recurring from pass-001 (DEFER). Trigger: 320 px + long status pill in production Title. Impact: story understates title crowding; copy button fit validated in isolation — OOS Playwright/story fixture hardening. |
| `mobile-ux/F-003` | WARNING | DEFER | Trigger: tap with VoiceOver/TalkBack on success. Impact: possible double "Order link copied" from label + live region — redundant announcement, not broken UX; choosing one path is follow-up. |
| `performance/F-001` | WARNING | DEFER | Trigger: metadata keystrokes re-render Form child. Impact: silent µs-level re-renders; sibling TopNav buttons share pattern; no measurable lag in traces. |
| `performance/F-002` | WARNING | DEFER | Trigger: each copy cycle mounts/unmounts aria-live span. Impact: intentional pass-1 a11y remediation tradeoff; visually hidden, no layout shift. |
| `performance/F-003` | WARNING | DEFER | Trigger: order-to-order navigation with `key={order.id}`. Impact: one hook remount per navigation — negligible vs fetch; chosen correctness fix from pass-1. |
| `correctness/F-001` | SHOULD-FIX | FIX | Same trigger/impact as desktop-ux/F-001 — no test guards navigation remount; removing `key` while keeping `orderId` is silent regression. Task Creation should batch with desktop-ux/F-001 or dedupe into one test task. |
| `correctness/F-002` | WARNING | DEFER | Trigger: TopNav child reorder during refactor. Impact: AC1 placement untested — Storybook composition mirrors layout; full OrderDetailsPage integration test exceeds in-PR patch scope. |
| `correctness/F-003` | WARNING | DEFER | Overlaps desktop-ux/F-002 (aria-label/title assertions); same fix row covers AC3/AC4 label transition — no separate task. |
| `correctness/F-004` | WARNING | DEFER | Duplicate of desktop-ux/F-004 — re-click SR silence on unchanged live region text. |
| `correctness/F-005` | WARNING | DEFER | Trigger: slow clipboard resolve after navigation remount. Impact: React dev warning only; new instance starts fresh — no user-visible stale UI on order B. |
| `simplify/F-001` | WARNING | DEFER | Storybook `force*` props + mirror CSS — documented in ui-design.md; production passes `orderId` only; maintainer ergonomics OOS. |
| `simplify/F-002` | WARNING | DEFER | Single-caller helper colocation vs `urls.ts` — no runtime defect; convention follow-up. |
| `simplify/F-003` | WARNING | DEFER | Duplicated Storybook `mockUser` fixtures — zero production impact. |
| `simplify/F-004` | WARNING | DEFER | Twin test files share location mock boilerplate — maintainer duplication only. |
| `simplify/F-005` | WARNING | DROP | `useCallback` ineffectiveness — preference-only; peers use inline handlers; no observable impact (same as pass-001 DROP). |
| `simplify/F-006` | WARNING | DEFER | Duplicate `formatMessage` for copied label — redundant intl work, identical strings; cosmetic micro-optimization. |

## Routing decision

**BLOCKERs:** None in pass-002.

**Mechanical aggregation:** Three dispositions are `FIX` (`desktop-ux/F-001`, `desktop-ux/F-002`, `correctness/F-001` — two unique test themes: navigation remount guard + AC3 button label assertions). Zero BLOCKERs. Zero `PROMOTE-TO-FIX`.

**Verdict:** `loop-back`

**jumpTo:** `task-creation`

**Root-cause layer:** All FIX items are localized test additions in `OrderCopyLinkButton.test.tsx` (and optionally a thin remount scenario) — no PRD/UI/tech-plan intent conflict. Runtime behavior from pass-001 is implemented; gap is regression guards before PR.

**Deferred for PR summary / OOS:** desktop-ux/F-003–F-004, mobile-ux/F-001–F-003, performance/F-001–F-003, correctness/F-002–F-005, simplify/F-001–F-004, simplify/F-006; DROP: simplify/F-005.

## Position changes vs. prior iterations

Pass-001 looped back to task-creation for **runtime** defects (stale navigation state, timer overlap, missing aria-live, missing URL/click tests). Pass-002 confirms those remediations landed; security and performance angles are clean or WARNING-only.

| Theme | Pass-001 | Pass-002 | Change |
|---|---|---|---|
| Stale copied state on order navigation | SHOULD-FIX runtime (desktop-ux/F-001) → FIX → T-473f727d done | SHOULD-FIX test gap (desktop-ux/F-001, correctness/F-001) | **Evolved** — bug fixed, guard test missing; not a reversal |
| Timer overlap on double-click | SHOULD-FIX runtime → FIX → T-fe1adbc0 done | Not re-filed | **Resolved** |
| Screen-reader copy confirmation | SHOULD-FIX / PROMOTE-TO-FIX → FIX → aria-live added | WARNING re-click silence + duplicate announce (desktop-ux/F-004, mobile-ux/F-003) | **Downgraded** — primary gap closed; follow-ups are polish |
| URL / click unit tests | SHOULD-FIX → FIX → tasks done | Not re-filed as SHOULD-FIX | **Resolved** |
| Touch hover stickiness | WARNING → DEFER (mobile-ux/F-003) | WARNING → DEFER (mobile-ux/F-001, renumbered) | **Stable defer** — recurring but cosmetic |
| Narrow story fidelity | WARNING → DEFER (mobile-ux/F-002) | WARNING → DEFER (mobile-ux/F-002) | **Stable defer** |
| useCallback / force* / colocation | WARNING → DEFER/DROP | WARNING → DEFER/DROP (simplify) | **Stable** |

**Oscillation escalation check:** Pass 002 is the second consecutive loop-back to `task-creation` (pass-001 was first). Root cause shifted from runtime fixes to test guards — not the same finding ID reversing tier ≥3 times. Total deep-review passes = 2 (< 5). **No BLOCKED escalation.**
