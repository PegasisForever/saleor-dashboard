# DEV-78 Tasks

## T-986e6e35: Add tests and extract i18n for OrderCopyLinkButton

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

Prototype loop shipped the copy-link feature (component, URL helper, TopNav wiring, Storybook). PRD acceptance criteria for UI behavior are satisfied in the cumulative diff. Remaining work is test coverage and locale catalog sync deferred by the tech plan and flagged in consistency review (F-003, F-010).

Tech plan testing notes:

> - Unit test: `getOrderShareableUrl` with mocked `window.location` and mount URI
> - Component test: `OrderCopyLinkButton` click → clipboard called, label updates
> - Manual: verify button appears on normal + unconfirmed order details TopNav

[Source: ./docs/DEV-78/tech-plan.md#testing-notes-deferred-to-task-agent]

Existing helper under test:

```typescript
export const getOrderShareableUrl = (orderId: string): string =>
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
```

[Source: src/orders/urls.ts — shipped in prototype diff]

Component behavior to cover:

```typescript
const [copied, copy] = useClipboard();

const handleCopyLink = useCallback(() => {
  copy(getOrderShareableUrl(orderId));
}, [copy, orderId]);

const label = copied
  ? intl.formatMessage(orderCopyLinkButtonMessages.orderLinkCopied)
  : intl.formatMessage(orderCopyLinkButtonMessages.copyOrderLink);
```

Button exposes `data-test-id="copy-order-link"`, dynamic `title` / `aria-label`, and `ClipboardCopyIcon` with `hasBeenClicked={copied}`.

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx — shipped in prototype diff]

i18n messages defined but not yet in locale catalog (consistency F-003):

```typescript
export const orderCopyLinkButtonMessages = defineMessages({
  copyOrderLink: {
    id: "l+hZ1x",
    defaultMessage: "Copy order link",
    description: "order details TopNav copy-link button label",
  },
  orderLinkCopied: {
    id: "GyfpSu",
    defaultMessage: "Order link copied",
    description: "order details TopNav copy-link button feedback after copy",
  },
});
```

[Source: src/orders/components/OrderCopyLinkButton/messages.ts]

Follow existing test patterns: extend `src/orders/urls.test.ts` for URL helpers; mock `useClipboard` like `CopyableText.test.tsx` / `OrderCustomer.test.tsx` for component tests. Use `Wrapper` from `@test/wrapper`, `// Arrange // Act // Assert` comments, and `pnpm run test:quiet <file_path>`.

URL encoding note (consistency F-007, non-blocking): `getOrderShareableUrl` passes raw `orderId` to `orderPath` (same as `orderFulfillPath`); `orderUrl` uses `encodeURIComponent`. GraphQL global IDs are URL-safe; tests should assert the constructed URL shape rather than changing encoding unless a test proves otherwise.

### Acceptance

- [ ] `src/orders/urls.test.ts` includes a `getOrderShareableUrl` describe block with at least: (1) mocked `window.location.origin` + mocked `getAppMountUriForRedirect()` producing an absolute URL containing origin, mount prefix, and order path segment; (2) empty mount URI (root deploy) case
- [ ] New `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` renders with `Wrapper`, clicks the `data-test-id="copy-order-link"` button, and asserts mocked `copy` is called with the shareable URL for the given `orderId`
- [ ] Component test asserts `aria-label` is `"Copy order link"` before copy and `"Order link copied"` when `useClipboard` mock returns `[true, mockCopy]`
- [ ] `pnpm run extract-messages` run and `locale/defaultMessages.json` updated to include `"Copy order link"` and `"Order link copied"` entries for the message IDs from `orderCopyLinkButtonMessages`
- [ ] `pnpm run test:quiet src/orders/urls.test.ts` and `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` pass
- [ ] `pnpm run lint` passes on changed files
