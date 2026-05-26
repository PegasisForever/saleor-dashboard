# DEV-68 Tasks

## T-f8e2a914: Wire copy-link button into OrderDetailsPage with tests and i18n extraction

- Status: done
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context

The prototype loop shipped `OrderCopyLinkButton`, `getAbsoluteOrderUrl`, and Storybook state stories. Production integration into `OrderDetailsPage` and automated tests were explicitly deferred:

> - File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` — render `<OrderCopyLinkButton orderId={order.id} />` before metadata button (integration task)
> - File: `./src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx` — add test for copy button presence and clipboard invocation (integration task)
>
> [Source: ./docs/DEV-68/tech-plan.md#Affected components]

PRD acceptance criteria still requiring production wiring:

> - [ ] Order details TopNav (`OrderDetailsPage`) renders a copy-link button immediately to the left of the existing metadata (`Code`) button on non-draft order views
> - [ ] Clicking the button writes the absolute order URL (`origin` + mount URI + `/orders/{id}`) to the system clipboard via `navigator.clipboard.writeText`
> - [ ] The copied URL contains no query-string dialog params (e.g. no `?action=view-order-metadata`)
>
> [Source: ./docs/DEV-68/prd.md#Acceptance criteria]

Current `OrderDetailsPage` TopNav renders only the metadata button — copy button not yet wired:

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

[Source: src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx — TopNav children ~L209–217]

Draft orders are out of scope — `OrderDraftDetails` renders `OrderDraftPage`, not `OrderDetailsPage`:

> - Cover normal and unconfirmed order detail views that use `OrderDetailsPage` (not draft orders)
>
> [Source: ./docs/DEV-68/prd.md#Scope]

URL helper already shipped; unit tests still missing:

```typescript
export const getAbsoluteOrderUrl = (orderId: string): string => {
  const relativePath = orderPath(encodeURIComponent(orderId));

  return urlJoin(
    window.location.origin,
    getAppMountUriForRedirect(),
    relativePath.startsWith("/") ? relativePath.slice(1) : relativePath,
  );
};
```

> | Subpath mount URL incorrect | `getAbsoluteOrderUrl` uses `getAppMountUriForRedirect()` matching auth/login URL construction; add unit test in `urls.test.ts` during integration |
>
> [Source: ./docs/DEV-68/tech-plan.md#Risks]

i18n messages exist in component but are not yet in the locale catalog:

```typescript
export const orderCopyLinkMessages = defineMessages({
  copyOrderLink: {
    id: "dgOk7n",
    defaultMessage: "Copy order link",
    description: "copy order link button",
  },
  linkCopied: {
    id: "jWwD8U",
    defaultMessage: "Link copied",
    description: "copy order link success feedback",
  },
});
```

> | Message ID lint (`formatjs/enforce-id`) | Run `pnpm run extract-messages` during integration to assign content-hash IDs |
>
> [Source: ./docs/DEV-68/tech-plan.md#Risks]

Existing clipboard mock pattern for order components:

```typescript
const mockCopy = jest.fn();

jest.mock("@dashboard/hooks/useClipboard", () => ({
  useClipboard: () => [false, mockCopy],
}));
```

[Source: src/orders/components/OrderCustomer/OrderCustomer.test.tsx — clipboard mock ~L26–30]

### Acceptance

- [ ] `OrderDetailsPage.tsx` imports `OrderCopyLinkButton` and renders `<OrderCopyLinkButton orderId={order.id} />` as the first TopNav action child, immediately before the existing metadata `Button` (`data-test-id="show-order-metadata"`)
- [ ] `OrderDetailsPage.test.tsx` (new file) renders `OrderDetailsPage` with an `OrderFixture` order and asserts `screen.getByTestId("copy-order-link")` is in the document
- [ ] The same test asserts `copy-order-link` precedes `show-order-metadata` in DOM order (`compareDocumentPosition` or `within(TopNav).getAllByRole('button')` index check)
- [ ] The same test clicks the copy button and asserts the mocked `useClipboard` `copy` function was called once with the value returned by `getAbsoluteOrderUrl(order.id)` (no query string in the URL string)
- [ ] `src/orders/urls.test.ts` adds a `getAbsoluteOrderUrl` describe block with tests that stub `window.location.origin` and `getAppMountUriForRedirect`, verifying: encoded order ID in path, no `?` query segment, and mount URI segment when mount differs from default
- [ ] `pnpm run extract-messages` run and `locale/defaultMessages.json` contains entries for message IDs `dgOk7n` and `jWwD8U`
- [ ] `pnpm run lint`, `pnpm run check-types`, and `pnpm run test:quiet` on the new/updated test files pass without errors
