---
agent: step-6a-task-iter-3-T-4c7d375b
sequence: 23
input_branch: ea2f400553e7a2200bef992f01dda5208f06e994
status: DONE
---

## Summary

Added a visually hidden `role="status"` / `aria-live="polite"` region to `OrderCopyLinkButton` that renders the copied confirmation message while `isCopied` is true, plus a unit test asserting the live region when the clipboard hook reports copied state.

## Decisions made independently

- Conditional mount vs always-present empty region: mounted the status element only when `isCopied` is true so the DOM insertion triggers a screen-reader announcement without duplicating the button label when idle.
- CSS module `.statusRegion` for visually hidden styling: no shared sr-only utility exists in the codebase; used standard clip-path inset pattern in the component's existing module rather than introducing a shared helper.
- Fragment wrapper around Button + status span: keeps TopNav layout unchanged (no extra flex container) while satisfying the sibling live-region requirement.

## Files / sections inspected

- `docs/DEV-90/tasks.md`: confirmed T-4c7d375b scope, acceptance criteria, and no blockers.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: existing button-only render; integrated live region after button.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: added `.statusRegion` visually hidden rules.
- `src/orders/components/OrderCopyLinkButton/messages.ts`: reused `orderLinkCopied` message for live region text.
- `src/components/CopyableText/CopyableText.test.tsx`: pattern for mocking `useClipboard` in component tests.
- `src/extensions/.../ManifestErrorMessage.tsx`: only existing `aria-live` usage in repo (visible error box, not sr-only).
- `docs/DEV-90/ui-design.md#Accessibility`: screen-reader flow requirement for copied confirmation.

## Considered then dropped

- Using macaw `Box` for the status region: a plain `<span>` with module CSS is lighter and matches the visually-hidden pattern without adding layout props.
- Using `forceCopied` prop in the test instead of mocking the hook: task acceptance explicitly says "when copied state is mocked true", so mocked `useClipboard` return value was used.

## Dead ends and retries

- `pnpm install` failed with EACCES on default `~/.pnpm-store` (root-owned): retried with `--store-dir /tmp/pnpm-store` and succeeded.
- Initial lint/test runs failed because `node_modules` was missing before install.

## Ambiguities encountered

- T-9dcb0344 (full click-path tests) is still pending; created a minimal `OrderCopyLinkButton.test.tsx` with only the live-region assertion as permitted by acceptance ("or new test in same file once T-9dcb0344 lands").

## Concerns / warnings

- None; conditional live region follows common a11y pattern and does not alter visual layout.

## Did not do (out of scope or deferred)

- Click-path / URL builder tests (T-9dcb0344): separate pending task.
- Storybook updates: copied state story already uses `forceCopied`; live region is non-visual and not required in Storybook states per ui-design.
