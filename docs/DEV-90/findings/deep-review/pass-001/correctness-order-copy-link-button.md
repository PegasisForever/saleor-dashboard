---
agent: step-7-deep-correctness-order-copy-link-button-pass-1
input_branch: 023b41831ba9742b23d525268bc364d082fbbdc1
verdict: pass
---

## Summary

Independent correctness review of the `order-copy-link-button` area against PRD, tech-plan, and project-context. Runtime behavior matches all ten PRD acceptance criteria: TopNav placement is correctly gated on `order?.id`, URL construction reuses `orderUrl` (with `encodeURIComponent`) and `getAppMountUriForRedirect`, and clipboard feedback follows the shared `useClipboard` contract. No BLOCKER defects found. Three SHOULD-FIX gaps remain: no automated tests for the load-bearing URL builder or button click path, and inherited `useClipboard` timer overlap that can shorten the advertised ~2s copied feedback on a realistic double-click. Mechanical checks: PRD and URL-shape contract pass; test coverage and Playwright E2E fail or skip for environment/feature reasons.

## Findings

### F-001 [SHOULD-FIX] No unit test for `getShareableOrderUrl`

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`
- Description: The exported URL builder is the sole source of clipboard payload (PRD AC2) but has zero Jest coverage. Mount-URI branches (`getAppMountUriForRedirect` returning `""` vs a subpath) and composition with `orderUrl` are untested.
- Trigger: Any regression in `getAppMountUriForRedirect`, `orderUrl`, or `urlJoin` argument order during a future refactor; CI stays green because nothing asserts `getShareableOrderUrl("T3JkZXI6MQ==")` shape.
- Impact: Staff user clicks copy on an order-details page deployed under a non-default `APP_MOUNT_URI`; clipboard receives a malformed absolute URL (missing mount segment or wrong path). Pasting the link opens a 404 or the wrong dashboard surface with no in-app error.
- Evidence: Grep `getShareableOrderUrl` in `**/*.{test,spec}*` → 0 matches. Implementation:

```5:8:src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts
export const getShareableOrderUrl = (orderId: string): string => {
  const relativePath = orderUrl(orderId);

  return urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath);
```

- Suggested fix: Add `getShareableOrderUrl.test.ts` mocking `window.location.origin` and `getAppMountUriForRedirect`, asserting output for default mount, custom mount, and encoded order IDs (mirror `orderUrl` trailing `?`).

### F-002 [SHOULD-FIX] No unit test for `OrderCopyLinkButton` click → clipboard payload

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`
- Description: PRD requires click to write `getShareableOrderUrl(orderId)` via `useClipboard` and update icon/labels. No component test mocks `useClipboard` or asserts `copy` receives the shareable URL (pattern exists in `OrderCustomer.test.tsx` and `CopyableText.test.tsx`).
- Trigger: Developer changes `handleCopy` to pass a relative path or drops `getShareableOrderUrl`; unit suite does not run for this component.
- Impact: Button shows copied feedback (if hook succeeds) but clipboard holds the wrong string; user pastes a broken link into Slack/email.
- Evidence: Grep `OrderCopyLinkButton` / `copy-order-link` in `**/*.{test,spec}*` → 0 matches. Click handler:

```32:34:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback((): void => {
    copy(getShareableOrderUrl(orderId));
  }, [copy, orderId]);
```

- Suggested fix: Add `OrderCopyLinkButton.test.tsx` with `jest.mock("@dashboard/hooks/useClipboard")`, render via `@test/wrapper`, click `[data-test-id="copy-order-link"]`, assert `mockCopy` called with expected absolute URL.

### F-003 [SHOULD-FIX] Double-click within 2s can shorten copied feedback window

- Location: `src/hooks/useClipboard.ts` (consumed by `OrderCopyLinkButton.tsx:30-34`)
- Description: `copy()` schedules a 2s reset timer on each success but does not clear a prior timer before scheduling the next. A second click ~500ms after the first leaves the first timer armed; when it fires it clears the second timer and sets `copied` false early (~1.5s after the second click, not ~2s).
- Trigger: User clicks the copy button, then clicks again within ~300–800ms to confirm the copy (common double-click or “did it work?” tap). Preconditions: clipboard permission granted; same order details page.
- Impact: Check icon and “Order link copied” label revert to copy/default sooner than ~2 seconds after the **last** click; brief flicker possible. Clipboard still holds the latest URL (same `orderId`); observable issue is feedback duration, not wrong bytes.
- Evidence:

```12:21:src/hooks/useClipboard.ts
  const copy = (text: string): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus(true);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
```

`useClipboard.test.ts` “multiple copy calls” asserts immediate `copied === true` only; no `jest.advanceTimersByTime` after second click.

- Suggested fix: At the start of `copy()`, call `clear()` before `setTimeout`, or reset the timer on each success so feedback always lasts 2s from the latest click.

### F-004 [WARNING] i18n message IDs not extracted to locale catalogs

- Location: `src/orders/components/OrderCopyLinkButton/messages.ts`
- Description: `rdiFOg` and `vcCUT0` are not present in `locale/*.json`; non-English locales rely on `defaultMessage` fallback until `pnpm run extract-messages` runs.
- Trigger: Staff user sets dashboard UI to a non-English locale after deploy without running message extraction in the release pipeline.
- Impact: Button labels may stay English (“Copy order link” / “Order link copied”) while the rest of the order page is translated.
- Evidence: Grep `rdiFOg` / `vcCUT0` in `locale/` → no matches.
- Suggested fix: Run `pnpm run extract-messages` and commit updated locale JSON before release.

### F-005 [WARNING] Storybook `force*` props exposed on production component API

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:15-18,36`
- Description: `forceCopied`, `forceHovered`, `forceActive`, `forceFocused` ship on the public props interface; `isCopied = forceCopied || copied` allows faking success without clipboard write.
- Trigger: Future integrator passes `forceCopied={true}` outside Storybook (copy-paste from story args).
- Impact: Button permanently shows check icon and “Order link copied” label without writing to clipboard.
- Evidence: `OrderDetailsPage.tsx:211` passes only `orderId`; risk is API surface, not current wire-up.
- Suggested fix: Move force props to a Storybook-only wrapper or prefix/document as `@internal` and omit from production types.

### F-006 [WARNING] `getShareableOrderUrl` colocated outside `src/orders/urls.ts`

- Location: `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts`; `docs/DEV-90/project-context.md:41`
- Description: Project context recommends URL helpers in feature `urls.ts`; shareable URL builder lives beside the button component.
- Trigger: Engineer searches `urls.ts` for shareable-order URL helper and does not find it; duplicates logic without `encodeURIComponent`.
- Impact: No runtime bug today; increases risk of inconsistent URL helpers in future edits.
- Evidence: `project-context.md` “URL helpers in feature `urls.ts`”; tech-plan lists file under component folder.
- Suggested fix: Move `getShareableOrderUrl` to `src/orders/urls.ts` or document intentional colocation in tech-plan.

## Files / sections inspected

### Touched files (diff since `45b5cef8`)

- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` — clipboard hook, i18n labels, `data-test-id`, Storybook force props, click handler.
- `src/orders/components/OrderCopyLinkButton/getShareableOrderUrl.ts` — absolute URL via `orderUrl` + `getAppMountUriForRedirect` + `urlJoin`.
- `src/orders/components/OrderCopyLinkButton/messages.ts` — `orderCopyLinkButtonMessages` catalog.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css` — hover/focus/active/disabled and force-state classes for contrast.
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx` — state + TopNav composition stories.
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:38,210-219` — TopNav integration with `order?.id` guard.

### Call sites of exports

| Export                        | Call sites                                                                                                                                                          | Contract                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `OrderCopyLinkButton`         | `OrderDetailsPage.tsx:211` — `orderId={order.id}` only; respects guard. `OrderCopyLinkButton.stories.tsx:44,53-83,95` — Storybook; composition hardcodes `orderId`. | Production wire-up correct.      |
| `getShareableOrderUrl`        | `OrderCopyLinkButton.tsx:33` only (no other repo callers per grep).                                                                                                 | Single internal consumer.        |
| `orderCopyLinkButtonMessages` | `OrderCopyLinkButton.tsx:9,38-40` only.                                                                                                                             | Used for `title` / `aria-label`. |

### Parent / host components

- `OrderDetailsPage.tsx:210-219` — Renders copy button before metadata; `order?.id` guard matches PRD; metadata button always shown; `loading` not passed to copy button (intentional per ui-design).
- `OrderNormalDetails/index.tsx:201-222` — Passes `order={data?.order}` (may be undefined while loading); copy hidden until id exists.
- `OrderUnconfirmedDetails/index.tsx:201-222` — Passes `order={data.order}` when status is UNCONFIRMED.
- `OrderDetails.tsx:62-72,180-255` — Routes draft → `OrderDraftDetails` (no copy button); null order → `NotFoundPage`.
- `OrderDraftPage.tsx:111` — TopNav without copy (PRD out of scope).

### Integration dependencies

- `src/hooks/useClipboard.ts` — 2s feedback, silent failure on clipboard deny; timer overlap on re-click (F-003).
- `src/orders/urls.ts:234-235` — `orderUrl` applies `encodeURIComponent`; trailing `?` via `stringifyQs`.
- `src/utils/urls.ts:27-28` — `getAppMountUriForRedirect` empty when default mount.
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` — copy/check icon swap.
- `src/orders/index.tsx:82-87,161` — route decodes id; aligns with encoded URLs from `orderUrl`.

### Tests overlapping

- `src/hooks/useClipboard.test.ts` — 6 tests pass; does not cover timer extension after re-click.
- Grep `OrderCopyLinkButton` / `getShareableOrderUrl` / `copy-order-link` in tests and `playwright/` — 0 matches.
- `OrderCustomer.test.tsx` — sibling copy pattern with mocked `useClipboard` (reference only).

### Planning artifacts

- `docs/DEV-90/prd.md` — all ACs traced to code paths.
- `docs/DEV-90/tech-plan.md` — URL shape and architecture.
- `docs/DEV-90/ui-design.md` — states, placement, a11y notes.
- `docs/DEV-90/project-context.md` — conventions and clipboard patterns.
