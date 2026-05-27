# DEV-75 Tasks

## T-3f8a2c7e: Wire OrderCopyLinkButton into OrderDetailsPage TopNav

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

PRD requires the copy-link control on the live order details page, not only in Storybook:

> Order details TopNav renders `OrderCopyLinkButton` immediately to the left of the metadata (`show-order-metadata`) button (Storybook TopNav shell proves placement; `OrderDetailsPage` wiring is part of the same feature delivery)
> [Source: ./docs/DEV-75/prd.md#acceptance-criteria]

Tech plan specifies the integration point:

> File: `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — import and render `<OrderCopyLinkButton orderId={order.id} />` before metadata button
> [Source: ./docs/DEV-75/tech-plan.md#affected-components]

Current TopNav action cluster in production (metadata button only — copy button not yet wired):

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

[Source: src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx (L209–231)]

UI design placement (copy immediately left of metadata):

```
┌─────────────────────────────────────────────────────────────────┐
│ ←  Order #1234                    [copy] [metadata] [⋮ menu]   │
└─────────────────────────────────────────────────────────────────┘
```

[Source: ./docs/DEV-75/ui-design.md#order-details-topnav]

The `OrderCopyLinkButton` component is already implemented and must be imported via direct path (no barrel). Do **not** pass `previewState` in production — it is Storybook-only:

> Optional prop ignored unless passed; integration task should not pass it
> [Source: ./docs/DEV-75/tech-plan.md#risks]

Existing component API (already shipped in prototype):

```tsx
export const OrderCopyLinkButton = ({
  orderId,
  disabled = false,
  previewState,
}: OrderCopyLinkButtonProps): JSX.Element => {
  // ...
  const isDisabled = disabled || !orderId;
  // data-test-id="copy-order-link", marginRight={3}, i18n labels via messages.ts
};
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx]

### Acceptance

- [x] `OrderDetailsPage.tsx` imports `OrderCopyLinkButton` from `@dashboard/orders/components/OrderCopyLinkButton/OrderCopyLinkButton` (direct path, no barrel)
- [x] `<OrderCopyLinkButton orderId={order.id} />` renders as the first TopNav child action, immediately before the metadata `Button` with `data-test-id="show-order-metadata"`
- [x] `previewState` is not passed to `OrderCopyLinkButton` in `OrderDetailsPage`
- [x] `pnpm run check-types` exits 0
- [x] `pnpm run lint` exits 0 on changed files under `src/orders/`
