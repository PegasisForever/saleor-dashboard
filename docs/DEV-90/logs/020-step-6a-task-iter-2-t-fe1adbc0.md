---
agent: step-6a-task-iter-2-T-fe1adbc0
sequence: 20
input_branch: 1a1eaab94c05b0234b1552a0f8ca6edbd2ea8ba6
status: DONE
---

## Summary

Fixed `useClipboard` so each successful `copy()` clears any pending reset timer before scheduling a new 2s timeout, preventing premature `copied=false` on rapid re-clicks. Added a fake-timer regression test and marked T-fe1adbc0 done.

## Decisions made independently

- **Clear inside `.then()` before `setTimeout`, not at top of `copy()`**: Acceptance targets clearing before scheduling on each _successful_ write; failed clipboard writes should not cancel an in-flight success feedback timer.
- **Second click at t=500ms in test**: Matches deep-review trigger window (~300–800ms) and proves copied stays true at t=2000ms from start (would fail under the bug) and only resets at t=2500ms (2s from second click).

## Files / sections inspected

- `docs/DEV-90/tasks.md` (T-fe1adbc0): acceptance criteria and suggested fix.
- `src/hooks/useClipboard.ts:6-26`: `clear()` helper and timeout overwrite without prior clear.
- `src/hooks/useClipboard.test.ts`: existing fake-timer patterns; "multiple copy calls" test did not advance timers.
- `docs/DEV-90/findings/deep-review/pass-001/` (via task context): F-002/F-003 evidence on double-click timer race.

## Considered then dropped

- **Calling `clear()` at the very start of `copy()` (before `writeText`)**: Would reset feedback even when the async write eventually fails; task wording and acceptance specify clearing before scheduling on success only.

## Dead ends and retries

- **`pnpm install` default store path**: EACCES on `~/.pnpm-store`; fixed with `pnpm install --store-dir <workspace>/.pnpm-store`, then tests/lint ran successfully.
- **`jest: not found` before install**: Resolved by installing dependencies; did not commit `node_modules` or `.pnpm-store`.

## Ambiguities encountered

- None; task context and existing hook tests were sufficient.

## Concerns / warnings

- Full `pnpm run lint` was not run repo-wide (only eslint on touched hook files) to avoid long CI-style sweep; shallow review will run broader checks.

## Did not do (out of scope or deferred)

- OrderCopyLinkButton debounce alternative: task preferred hook-level fix for all consumers.
- Other pending DEV-90 tasks (T-473f727d, T-4c7d375b, T-9dcb0344): separate assignments.
