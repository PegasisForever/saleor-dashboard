# DEV-66 Tasks

Prototype loop shipped the production UI (component, helper, TopNav integration, Storybook matrix, focus styles). Remaining work is pre-merge verification: unit/component tests and locale extraction flagged in iteration-005 consistency review.

## T-5d103224: Add tests for order copy-link URL builder and button

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

Absolute URL shape (client-only clipboard write):

- Relative path: `orderPath(encodeURIComponent(orderId))` → `/orders/{id}`
- Absolute: `urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath)`

[Source: ./docs/DEV-66/tech-plan.md#API conventions]

Risk mitigation — subpath deployments must match how the app is served:

- **Subpath deployments:** `getAppMountUriForRedirect()` must match how the app is served; verified against existing `StaffList` / auth redirect patterns. Mitigation: unit-test URL builder with mocked `window.__SALEOR_CONFIG__`.

[Source: ./docs/DEV-66/tech-plan.md#Risks]

Existing helper (do not reimplement; test this module):

```typescript
export const getOrderAbsoluteUrl = (orderId: string): string =>
  urlJoin(
    window.location.origin,
    getAppMountUriForRedirect(),
    orderPath(encodeURIComponent(orderId)),
  );
```

[Source: `src/orders/utils/getOrderAbsoluteUrl.ts`]

Mount-uri test precedent in this repo (`auth/utils.test.ts`):

```typescript
it("should return the correct redirect URL if dashboard is mounted under /dashboard", () => {
  window.__SALEOR_CONFIG__ = {
    ...window.__SALEOR_CONFIG__,
    APP_MOUNT_URI: "/dashboard/",
  };
  const redirectUrl = getNewPasswordResetRedirectUrl();
  expect(redirectUrl).toBe("http://localhost/dashboard/new-password/");
});
```

[Source: `src/auth/utils.test.ts`]

Component behavior to cover (production module already exists):

- Uses `useClipboard` and `ClipboardCopyIcon` — `variant="secondary"`, `data-test-id="copy-order-link"`, `aria-label`/`title` from `messages.copyOrderLink`
- When `orderId` is empty, returns `null` (no button)
- On click, `copy(getOrderAbsoluteUrl(orderId))`

[Source: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`]

Copy-button test pattern (`CopyableText.test.tsx`): mock `@dashboard/hooks/useClipboard`, assert `mockCopy` called with expected string on click, assert `.lucide-check` / `.lucide-copy` when `copied` is true/false.

[Source: `src/components/CopyableText/CopyableText.test.tsx`]

Optional strict-narrowing fix while editing the component (runtime-safe today, strict TS would flag optional `orderId` passed to `getOrderAbsoluteUrl(orderId: string)`):

- `handleCopy` passes optional `orderId` to `getOrderAbsoluteUrl(orderId: string)` before the falsy guard at lines 27–29.

[Source: ./docs/DEV-66/findings/prototype/iteration-005/consistency.md#F-005]

### Acceptance

- [ ] `src/orders/utils/getOrderAbsoluteUrl.test.ts` exists; `pnpm run test:quiet src/orders/utils/getOrderAbsoluteUrl.test.ts` passes
- [ ] Test with default mount (`/`): URL is `http://localhost/orders/{encodeURIComponent(orderId)}` for a sample order id
- [ ] Test with `window.__SALEOR_CONFIG__.APP_MOUNT_URI: "/dashboard/"`: URL includes `/dashboard/` segment before `orders/…`
- [ ] `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exists; `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` passes
- [ ] Clicking the button (role + name from `messages.copyOrderLink` / "Copy order link") calls mocked `copy` with the absolute URL for the given `orderId`
- [ ] When `copied` mock state is `true`, button subtree contains `.lucide-check`; when `false`, contains `.lucide-copy`
- [ ] Rendering with `orderId=""` does not expose `data-test-id="copy-order-link"` in the document

## T-cd5300d3: Extract copy-order-link i18n messages into locale catalogs

- Status: pending
- Priority: medium
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

Pre-merge convention:

- Pre-merge: `pnpm run lint`, `check-types`, `test:quiet`, `knip`

[Source: ./docs/DEV-66/project-context.md#Conventions]

New message keys (defined but not yet in `locale/` per consistency review):

```typescript
export const messages = defineMessages({
  copyOrderLink: {
    defaultMessage: "Copy order link",
    id: "BLmn1V",
    description: "button",
  },
  copyOrderLinkFailed: {
    defaultMessage: "Failed to copy order link",
    id: "Hztpse",
    description: "copy order link error",
  },
});
```

[Source: `src/orders/components/OrderCopyLinkButton/messages.ts`]

`copyOrderLinkFailed` is used in the Error Storybook state only today; still must be extracted for non-English locales.

[Source: ./docs/DEV-66/ui-design.md#States covered]

### Acceptance

- [ ] `pnpm run extract-messages` completes without error
- [ ] `locale/` catalogs include entries for message ids `BLmn1V` and `Hztpse` (or equivalent keys matching those ids in generated locale files)
- [ ] `git diff locale/` is non-empty and only adds/updates strings for the new copy-order-link messages (no unrelated locale churn reverted)
