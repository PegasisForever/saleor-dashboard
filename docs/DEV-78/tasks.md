## T-f7e2b890: Integrate OrderCopyLinkButton into order details TopNav with tests

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

The prototype loop shipped the copy-link component slice but not production integration. Consistency review F-004 confirms `OrderDetailsPage.tsx` has no `OrderCopyLinkButton` import and the planned test file is absent.

From the PRD acceptance criteria still requiring production wiring:

> - [ ] Order details TopNav renders `OrderCopyLinkButton` to the left of the metadata button (`data-test-id="show-order-metadata"`) and before `TopNav.Menu`
> - [ ] Clicking the button when `orderId` is present writes `getShareableOrderUrl(orderId)` to the clipboard via `useClipboard`
> - [ ] Copied URL equals `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId))` with no query string

[Source: ./docs/DEV-78/prd.md#acceptance-criteria]

Tech plan integration target — `OrderDetailsPage.tsx` currently renders the metadata button as the first TopNav child:

```tsx
<TopNav href={backLinkUrl} title={<Title order={order} />}>
  <Button
    variant="secondary"
    icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
    onClick={onOrderShowMetadata}
    data-test-id="show-order-metadata"
    title="Edit order metadata"
    marginRight={3}
  />
  <TopNav.Menu ... />
</TopNav>
```

Insert `<OrderCopyLinkButton orderId={order.id} />` immediately before the metadata `Button`.

[Source: ./docs/DEV-78/tech-plan.md#affected-components]

Already-shipped container (do not rewrite — wire it up):

```tsx
export const OrderCopyLinkButton = ({ orderId }: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();
  const disabled = !orderId;

  const handleCopy = useCallback(() => {
    if (disabled) {
      return;
    }

    copy(getShareableOrderUrl(orderId));
  }, [copy, disabled, orderId]);

  return <OrderCopyLinkButtonView copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx]

URL helper already shipped:

```tsx
export const getShareableOrderUrl = (orderId: string): string =>
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
```

[Source: src/orders/utils/getShareableOrderUrl.ts]

UI placement expectation:

```
│ ←  Order #42  [status pill]              [copy] [metadata] [⋮ menu] │
```

Copy button uses `data-test-id="copy-order-link"`, secondary icon-only `Button`, and sits before the metadata control.

[Source: ./docs/DEV-78/ui-design.md#order-details-topnav]

Testing guidance from tech plan:

> File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — add interaction test for copy button placement and clipboard call (integration task; file may need creation if absent)

Follow existing order-component test patterns (e.g. mock heavy child components, use `OrderFixture`, mock `useClipboard` like `OrderCustomer.test.tsx` / `CopyableText.test.tsx`). Add `getShareableOrderUrl.test.ts` to assert URL shape against mocked `window.location.origin` and mount URI helpers.

i18n hygiene (consistency F-006): run `pnpm run extract-messages` so `messages.copyOrderLink` / `messages.orderLinkCopied` sync to locale catalogs.

### Acceptance

- [ ] `OrderDetailsPage.tsx` imports and renders `<OrderCopyLinkButton orderId={order.id} />` as the first TopNav action child, immediately before the metadata button (`data-test-id="show-order-metadata"`) and before `TopNav.Menu`
- [ ] `OrderDetailsPage.test.tsx` exists and asserts the copy button (`data-test-id="copy-order-link"`) appears in the DOM before the metadata button when the page renders with a loaded order
- [ ] `OrderCopyLinkButton.test.tsx` asserts clicking the button calls the mocked `useClipboard` copy function with `getShareableOrderUrl(orderId)` and that `orderId=""` renders a disabled button with no copy call on click
- [ ] `getShareableOrderUrl.test.ts` asserts the returned string equals `urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId))` with no query string for a sample global ID (e.g. `T3JkZXI6MQ==`)
- [ ] `pnpm run extract-messages` has been run and locale catalogs include the new message IDs (`BLmn1V`, `ThVxK6`)
- [ ] `pnpm run lint`, `pnpm run check-types`, and `pnpm run test:quiet` pass for all new/modified files under `src/orders/components/OrderCopyLinkButton/`, `src/orders/components/OrderDetailsPage/`, and `src/orders/utils/getShareableOrderUrl.test.ts`
