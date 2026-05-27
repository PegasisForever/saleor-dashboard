---
agent: step-1-planning
sequence: 1
input_branch: 45b5cef8f4ddd1d99d7a2a497bb055d6bb3f2634
status: DONE
---

## Summary

Planned DEV-75 (order details copy-link TopNav button): wrote project context, PRD, UI design, and tech plan; built `OrderCopyLinkButton` prototype with Storybook state stories; published Storybook to local-deploy and verified interactive states on the deployed bundle.

## Decisions made independently

- **Component location:** `src/orders/components/OrderCopyLinkButton/` — colocated with order feature, reusable from `OrderDetailsPage` integration task
- **Share URL shape:** `orderPath(id)` + origin + mount URI (not `orderUrl()` which appends query string)
- **Reuse `ClipboardCopyIcon`** from `OrderCardTitle` rather than inline Lucide Copy/Check (ticket requirement)
- **Prototype only in TopNav story:** integration into `OrderDetailsPage.tsx` deferred to downstream task agent (listed in tech plan)
- **Omitted loading/error/empty states:** sync clipboard copy has no async/empty surface per mechanical state matrix rules

## Files / sections inspected

- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:209-231` — TopNav metadata button placement pattern
- `src/hooks/useClipboard.ts` — 2s copied reset, no error toast
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — copy/check icon toggle
- `src/orders/urls.ts:192,234` — `orderPath` vs `orderUrl`
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect()` for absolute URLs
- `src/discounts/.../RuleActions.module.css:17-21` — focus ring token pattern
- `package.json:15,51` — Storybook scripts confirmed on branch
- Linear DEV-75 — feature scope and constraints

## Considered then dropped

- **Inline copy in `OrderDetailsPage` without separate component:** rejected — ticket implies reusable control; separate component enables isolated Storybook states
- **Custom hover CSS on secondary button:** dropped after macaw native hover shadow proved distinct from default in deployed verification
- **Re-upload to first UUID after rebuild:** 409 conflict; allocated fresh subpath `ac05001f-...` and updated `ui-design.md`

## Dead ends and retries

- **`pnpm install` EACCES on default store:** fixed with `--store-dir` inside workspace
- **`pnpm run storybook -- --ci`:** Storybook 10 rejects extra args; used `build-storybook` directly instead
- **Focus story with `button.focus()`:** `:focus-visible` ring did not appear (0px outline); fixed story to `userEvent.tab()` ×2 and strengthened production CSS with outline + box-shadow ring
- **local-deploy re-upload 409:** new UUID allocated

## Ambiguities encountered

- **"copy-icon component" naming:** interpreted as existing `ClipboardCopyIcon` (only dedicated copy-icon helper in orders domain); no human ping needed
- **Focus story play in static Storybook:** play tabs land on back link first; manual Tab confirmed copy button focus ring ≥3:1 — acceptable for prototype, integration E2E can assert keyboard path

## Concerns / warnings

- `OrderDetailsPage` metadata button title still hardcoded English (pre-existing); out of scope
- Focus story play may not reliably focus copy button in all Storybook runners; keyboard Tab from back link produces correct focus ring in production CSS

## Did not do (out of scope or deferred)

- Wire button into `OrderDetailsPage.tsx` — listed as downstream integration in tech plan
- Toast on clipboard failure — matches existing `useClipboard` behavior
- Commit `storybook-static/` or findings screenshots — build artifact / diagnostic only
