---
agent: step-1-planning
sequence: 1
input_branch: 45b5cef8f4ddd1d99d7a2a497bb055d6bb3f2634
status: DONE
---

## Summary

Completed DEV-78 prototype iteration 1: wrote PRD, UI design, tech plan, and project context; built `OrderCopyLinkButton` component with Storybook state stories; published Storybook to a long-living deploy URL.

## Decisions made independently

- **Shareable URL shape:** Use `urlJoin(origin, getAppMountUriForRedirect(), orderPath(orderId))` without dialog query params — avoids brittle modal-specific links.
- **Component split:** `OrderCopyLinkButtonView` (presentational) + `OrderCopyLinkButton` (clipboard hook container) — enables Copied/Disabled stories without mocking hooks.
- **Hover/Active stories:** `previewState` prop + production CSS module tokens matching measured macaw secondary button styles; production integration never passes `previewState`.
- **No toast on copy:** Inline icon + aria-label swap matches `TrackingNumberDisplay` pattern and ticket scope.

## Files / sections inspected

- Linear DEV-78 description: copy-link in order TopNav, reuse clipboard hook + copy icon.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:209-231`: TopNav metadata button placement target.
- `src/hooks/useClipboard.ts`: 2s copied reset, console.warn on failure.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: Copy/Check icon swap reused per ticket.
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx`: precedent for clipboard button pattern.
- `src/orders/urls.ts:192-235`: `orderPath`, `orderUrl` helpers.
- `src/utils/urls.ts:27-28`: `getAppMountUriForRedirect`.
- `.storybook/preview-head.html`: Storybook mount URI config.
- `AGENTS.md`, `package.json`: stack/conventions for project-context.

## Considered then dropped

- **`window.location.href` for copy target:** Rejected — includes transient dialog query params.
- **Synthetic `mouseenter`/`mousedown` decorators for Hover/Active stories:** Decorators don't activate CSS `:hover`; replaced with `previewState` + macaw-matched CSS tokens.
- **`@storybook/testing-library` fireEvent import:** Build failed; removed in favor of native `dispatchEvent` then dropped entirely for previewState approach.
- **Toast via `useNotifier` on copy:** Out of ticket scope; kept inline feedback only.

## Dead ends and retries

- **`pnpm install` EACCES on default store:** Fixed with `--store-dir /tmp/pnpm-store`.
- **Storybook build failed on `@storybook/testing-library` import:** Removed dependency; rebuilt successfully.
- **local-deploy re-upload HTTP 409:** Re-allocated fresh UUID `ced5a50a-8962-4084-ba5d-267f52ba8ae5` for final publish.
- **Hover/Active stories pixel-identical to Default after settle:** Fixed with `previewState` CSS module classes.

## Ambiguities encountered

- **Metadata button hardcoded English title:** Pre-existing; copy button uses i18n per conventions (no human ping needed).
- **Active vs hover macaw tokens nearly identical:** Differentiated Active story with inset box-shadow in preview CSS.

## Concerns / warnings

- Disabled secondary button icon contrast ~2:1 follows macaw defaults; documented in ui-design.
- `OrderDetailsPage` integration and tests listed in tech plan but intentionally deferred to task agents.

## Did not do (out of scope or deferred)

- Wire button into `OrderDetailsPage.tsx`: integration pass per tech plan.
- `pnpm run extract-messages`: planning prototype only; task agent should run before merge.
- Unit tests for `getShareableOrderUrl`: deferred to integration tasks.
