---
agent: step-7-deep-desktop-ux-order-copy-link-pass-1
sequence: 27
input_branch: 8428347a1c77b9fc3d4b8c33a5da12a724556a8d
status: DONE
---

## Summary

Reviewed order-copy-link diff (10 implementation files), expanded into parent TopNav integration, `useClipboard`, and peer copy patterns. Installed deps, started Vite dev server, and drove Chrome at 1280×800. Saleor backend was unavailable so OrderDetailsPage could not be reached; Storybook Default/Focus stories plus unit tests substituted for component-level interaction checks. Verdict **fail** due to incomplete production-walkthrough mechanical check; one WARNING filed for `useClipboard` double-click timer race.

## Decisions made independently

- **production-walkthrough → fail (not skip)**: Backend down and login shell broken (504 optimize deps) prevented order-details navigation; per prompt, skip is for inapplicable angles, not hard-to-run checks — recorded honest fail with environmental evidence.
- **integration-context → pass via code**: TopNav JSX order, prop wiring (`orderId={order?.id}`), loading null-guard, and draft exclusion verified in source without live page — sufficient for integration wiring angle though not layout pixels.
- **Double-click race → WARNING not BLOCKER**: Truncated feedback is intermittent (rapid re-click within 2s) and inherited from shared hook; does not block primary single-click flow covered by unit tests.
- **Clipboard failure UI → no finding**: PRD/tech-plan explicitly exclude in-UI error affordance; matches `TrackingNumberDisplay` / `CopyableText` parity.
- **Layout shift on order load → no finding**: PRD AC requires no render when `orderId` empty; pop-in before metadata is an accepted consequence of that AC.

## Files / sections inspected

- `docs/DEV-66/prd.md`: AC list for copy-link placement, clipboard URL, icon swap, a11y, empty guard
- `docs/DEV-66/ui-design.md`: TopNav layout, keyboard order, focus ring decision
- `docs/DEV-66/tech-plan.md`: component tree, clipboard risk note
- `docs/DEV-66/logs/026-step-7-coordinator-pass-1.md`: area scope (10 src/locale paths)
- `git diff 45b5cef8..HEAD --stat -- src/orders/** locale/**`: 343 LOC across 10 files
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: full component
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: `:focus-visible` ring
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232`: TopNav integration
- `src/hooks/useClipboard.ts` + `useClipboard.test.ts`: timer behavior, multi-copy test gap
- `src/components/AppLayout/TopNav/Root.tsx:57-83`: DOM/focus order for TopNav children
- `src/orders/views/OrderDetails/OrderDetails.tsx:62-68,181+`: loading vs NotFound routing
- Storybook via Chrome: Default (click/clipboard), Focus story CSS, keyboard Tab/Enter on Default iframe
- Evidence screenshots under `docs/DEV-66/findings/deep-review/pass-001/evidence/desktop-ux/`

## Considered then dropped

- **BLOCKER on missing production walkthrough**: Reclassified as mechanical-check fail + environmental limitation, not a merge-blocking product defect in the diff itself.
- **BLOCKER on Storybook clipboard TypeError**: `navigator.clipboard` undefined in Storybook iframe only; production dashboard runs on localhost with clipboard API — not attributed to this diff.
- **WARNING on TopNav layout shift when order loads**: PRD mandates null render without `orderId`; shift is spec-compliant.
- **WARNING on no clipboard error UI**: Explicitly out of PRD scope and consistent with orders-domain peers.
- **FAIL keyboard-flow**: Tab to button yielded `matchesFocusVisible: true` and 2px accent1 outline — upgraded to pass after proper keyboard Tab (initial programmatic `focus()` correctly showed no ring).

## Dead ends and retries

- **`pnpm install` EACCES on global store**: Retried with `--store-dir .pnpm-store` in workspace — succeeded.
- **`pnpm run dev` first attempt**: Failed without node_modules; succeeded after install (~8s codegen + Vite on :9000).
- **Chrome sub-agent (readonly)**: Could not drive browser; ran walkthrough in main session instead.
- **Production login at localhost:9000**: Page title loaded but UI empty; console 504 Outdated Optimize Dep + 404; backend curl to :8000 returned connection refused.
- **Storybook clipboard verify**: Click/Enter triggered `Uncaught TypeError: Cannot read properties of undefined (reading 'writeText')` — iframe lacks `navigator.clipboard`; icon swap could not be observed live in Storybook.

## Ambiguities encountered

- **Whether Storybook counts as production-walkthrough**: Treated as component-level fallback only; integration-context and clipboard timing ACs still require OrderDetailsPage — not fully satisfied.
- **Focus ring verification method**: Programmatic `focus()` does not trigger `:focus-visible`; resolved by Shift+Tab then Tab keyboard sequence showing 2px `rgb(35, 57, 251)` outline.

## Concerns / warnings

- Deep-review desktop-UX pass cannot fully sign off on clipboard/icon timing in real TopNav without a running Saleor backend — recommend re-run production-walkthrough when backend is available.
- `useClipboard` timer race affects all copy controls using the hook, not only this button.

## Did not do (out of scope or deferred)

- **Step 3 static re-checks**: Contrast/touch-target/token purity on unchanged Storybook surfaces — explicitly out of scope per prompt.
- **Mobile viewport walkthrough**: Assigned to mobile-ux angle.
- **Lighthouse a11y audit**: Step 3 already ran on Storybook states.
