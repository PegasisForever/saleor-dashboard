---
agent: step-1-planning
sequence: 1
input_branch: 45b5cef8f4ddd1d99d7a2a497bb055d6bb3f2634
status: DONE
---

## Summary

Planned and prototyped DEV-78: a copy-link button in order details TopNav. Created PRD, UI design, tech plan, project context, `OrderCopyLinkButton` component with Storybook state stories, wired it into `OrderDetailsPage`, and published Storybook at `http://localhost:11000/a5701849-a43a-46cb-849a-3f5d168c7314`.

## Decisions made independently

- **Button placement:** Copy button immediately before metadata button — matches ticket wording and keeps related actions grouped.
- **URL shape:** Clean `orderPath(id)` without dialog query params — shareable links should not include transient modal state.
- **Feedback mechanism:** Icon swap via `ClipboardCopyIcon` only (no toast) — matches existing order clipboard patterns and ticket scope.
- **Focus ring:** Added production CSS module `:focus-visible` outline because macaw secondary Button suppresses default outline.
- **Storybook clipboard:** Mock `navigator.clipboard` in story decorator — real API unavailable in static Storybook iframe.

## Files / sections inspected

- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:209-230` — TopNav metadata button pattern and insertion point
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — existing copy-icon component
- `src/orders/components/OrderCardTitle/TrackingNumberDisplay.tsx` — clipboard + ClipboardCopyIcon usage reference
- `src/hooks/useClipboard.ts` — 2s copied state contract
- `src/orders/urls.ts:192-235` — `orderPath` / `orderUrl` helpers
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect`
- `src/staff/views/StaffList/StaffList.tsx:140-144` — absolute URL construction pattern
- `src/discounts/.../RuleActions.module.css:17-21` — focus-visible outline convention
- Linear DEV-78 description — feature requirements

## Considered then dropped

- **Using `CopyableText` component:** Rejected — hover-reveal inline pattern unsuitable for TopNav icon action cluster.
- **Toast on copy:** Rejected — ticket explicitly uses icon feedback; matches `TrackingNumberDisplay`.
- **Story-only CSS for hover/focus:** Started checking macaw defaults, then added styles to production `OrderCopyLinkButton.module.css` instead to avoid story/production divergence.

## Dead ends and retries

- **pnpm install EACCES:** Default pnpm store path denied; fixed with `--store-dir /tmp/pnpm-store`.
- **First Storybook build/upload:** Built before component files saved; rebuild required. Upload 409 on re-upload to same UUID — allocated fresh subpaths each publish.
- **Focus/active verification:** Programmatic `focus()` did not trigger `:focus-visible`; fixed story play to use `userEvent.tab()` and added `!important` outline in CSS module.
- **Copied story without clipboard API:** Storybook iframe lacks `navigator.clipboard`; added mock in story decorator.

## Ambiguities encountered

- **Message ID format:** Resolved by running ESLint auto-fix (`formatjs/enforce-id` generated hash IDs).
- **ClipboardCopyIcon size:** Extended with optional `size`/`strokeWidth` props to match TopNav metadata icon (`iconSize.medium`) without breaking existing callers.

## Concerns / warnings

- `OrderDetailsPage` remains `@ts-strict-ignore` legacy; integration is minimal JSX only.
- Clipboard failure in production (permission denied) still silent except console.warn — consistent with `useClipboard` but no user-visible error state.

## Did not do (out of scope or deferred)

- Unit/component tests — deferred to task agent per planning scope.
- `pnpm run extract-messages` — ESLint assigned IDs; extract-messages can run in integration pass.
- Toast notification on copy failure — out of ticket scope.
