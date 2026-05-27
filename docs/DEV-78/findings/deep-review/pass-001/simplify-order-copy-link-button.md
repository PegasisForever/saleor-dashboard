---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
input_branch: 75bd8efb01e5646823a3c54c8bd1a075c3b0ad31
verdict: pass
---

## Summary

The order-copy-link-button feature correctly reuses `useClipboard`, `ClipboardCopyIcon`, and existing URL primitives rather than hand-rolling clipboard or URL logic. Readability and library usage are solid. The main simplification debt is structural duplication: a redundant disabled guard in the click handler, triplicate Storybook state stories with identical play functions, copy-pasted Storybook user fixtures, and a 137-line page integration test with heavy mocking for a single DOM-order assertion. None of these block merge from a simplify perspective; they increase maintenance surface for a ~60 LOC production feature spread across eleven files.

## Findings

### F-001 [WARNING] Redundant disabled guard in click handler

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx:15-18` vs `OrderCopyLinkButtonView.tsx:29`
- Description: `disabled` is derived from `!orderId`, applied to the macaw `Button`, and checked again inside `handleCopy`. When the button is disabled, user clicks do not invoke `onClick`; the handler guard is unreachable on the production path. Peer clipboard controls (`TrackingNumberDisplay.tsx:57`, `CopyableText.tsx:45`) use inline `onClick={() => copy(...)}` without a second guard.
- Evidence:
```15:21:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const handleCopy = useCallback(() => {
    if (disabled) {
      return;
    }

    copy(getShareableOrderUrl(orderId));
  }, [copy, disabled, orderId]);
```
```28:29:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx
      onClick={onCopy}
      disabled={disabled}
```
- Suggested fix: Remove the `if (disabled) return` branch and drop `disabled` from the `useCallback` dependency array; rely on `Button disabled={disabled}` as the single enforcement point, matching sibling patterns.

### F-002 [WARNING] Hover, Focus, and Active stories are near-duplicates

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:88-131`
- Description: Three stories differ only by the CSS wrapper class (`previewHover`, `previewFocus`, `previewActive`) while sharing identical render markup (`OrderCopyLinkButtonView copied={false} onCopy={fn()}`) and identical `play` assertions (`aria-label` === `"Copy order link"`). The play functions do not drive hover, focus, or active interaction — they only re-check a label already covered by `Default`.
- Evidence:
```88:131:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Hover: Story = {
  render: () => (
    <div className={storyStyles.previewHover}>
      <OrderCopyLinkButtonView copied={false} onCopy={fn()} />
    </div>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const button = getCopyButton(canvasElement);
    await expect(button).toHaveAttribute("aria-label", "Copy order link");
  },
};
// Focus and Active repeat the same structure with a different storyStyles class
```
- Suggested fix: Extract a `createVisualStateStory(previewClass: string)` helper or use Storybook `args`/`parameters` to parameterize the wrapper class; keep one shared `play` or drop redundant plays since visual states are CSS-only previews.

### F-003 [WARNING] Storybook user fixtures duplicated from TopNav.stories

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:18-44` vs `src/components/AppLayout/TopNav/TopNav.stories.tsx:11-37`
- Description: The 27-line `mockUser` / `mockUserContext` block is copy-pasted verbatim between the new stories and existing TopNav stories. Any fixture drift (permissions, channel access) must be updated in two places.
- Evidence: Both files define identical `mockUser: UserFragment` with `id: "user-1"`, `email: "admin@example.com"`, `accessibleChannels: []`, etc., and identical `mockUserContext: UserContextType` with all auth callbacks set to `undefined`.
- Suggested fix: Extract a shared story helper (e.g. `storybook/fixtures/mockStaffUserContext.tsx` or a `withMockUserContext` decorator) consumed by both TopNav and OrderCopyLinkButton stories.

### F-004 [WARNING] OrderDetailsPage integration test is disproportionately heavy

- Location: `src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx:18-136`
- Description: A new 137-line test file boots the full `OrderDetailsPage` with thirteen child-component mocks and a 35-field `defaultProps` object to assert one DOM-order relationship. Clipboard behavior is already covered in `OrderCopyLinkButton.test.tsx`; placement is also mirrored in Storybook's `TopNavDecorator`. The test uses `compareDocumentPosition` bitmask logic — the only such usage in the entire `src/` test tree — rather than a simpler sibling query.
- Evidence:
```116:136:src/orders/components/OrderDetailsPage/OrderDetailsPage.test.tsx
  it("renders copy-order-link button before show-order-metadata in TopNav", () => {
    render(
      <Wrapper>
        <MemoryRouter>
          <OrderDetailsPage {...defaultProps} />
        </MemoryRouter>
      </Wrapper>,
    );
    const copyButton = screen.getByTestId("copy-order-link");
    const metadataButton = screen.getByTestId("show-order-metadata");
    expect(
      copyButton.compareDocumentPosition(metadataButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
```
- Suggested fix: Render a minimal TopNav action cluster fixture (copy + metadata stubs) for placement-only assertion, or mock `OrderCopyLinkButton` as a lightweight stub and assert render order via `within(topNav).getAllByRole('button')` index comparison.

### F-005 [WARNING] Container/view split adds files without a codebase precedent

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx` + `OrderCopyLinkButtonView.tsx`
- Description: Production clipboard buttons in the same domain (`TrackingNumberDisplay.tsx`, `CopyableText.tsx`, `PspReference.tsx`) keep hook wiring and UI in a single file. This feature splits ~60 LOC across two production files solely to let Storybook render static states on `OrderCopyLinkButtonView` without mocking `useClipboard`. That is intentional per tech plan, but it is the only `*View.tsx` pattern under `src/orders/` and increases the review/trace surface for minimal runtime benefit.
- Evidence: Container is a 24-line pass-through; view holds the macaw `Button` JSX. Grep under `src/orders/` finds no other `*View.tsx` exports besides this component.
- Suggested fix: If Storybook state coverage remains a requirement, consider mocking `useClipboard` in stories (as component tests already do) and collapsing container + view into one file aligned with `TrackingNumberDisplay`.

### F-006 [WARNING] Six-line URL helper isolated in separate module and test file

- Location: `src/orders/utils/getShareableOrderUrl.ts:5-6`, `getShareableOrderUrl.test.ts`, `OrderCopyLinkButton.test.tsx:10-14`
- Description: `getShareableOrderUrl` is a one-expression wrapper over `orderPath` and `getAppMountUriForRedirect` — the same `urlJoin(origin, mount, path)` pattern used inline in auth code. It lives in `orders/utils/` (otherwise view-model/data helpers) with a dedicated 56-line test file, while `orderPath` and siblings live in `urls.ts` with existing `urls.test.ts`. The component test adds a third layer by mocking the helper entirely and hardcoding `https://example.com/dashboard/orders/T3JkZXI6MQ==`, duplicating what the util test already proves.
- Evidence:
```5:6:src/orders/utils/getShareableOrderUrl.ts
export const getShareableOrderUrl = (orderId: string): string =>
  urlJoin(window.location.origin, getAppMountUriForRedirect(), orderPath(orderId));
```
```9:14:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx
jest.mock("@dashboard/orders/utils/getShareableOrderUrl");
const mockGetShareableOrderUrl = getShareableOrderUrl as jest.MockedFunction<
  typeof getShareableOrderUrl
>;
```
- Suggested fix: Colocate `getShareableOrderUrl` in `src/orders/urls.ts` next to `orderPath`/`orderUrl`, add its test to `urls.test.ts`, and let the component test call the real helper (with shared location mocks) or drop the URL mock boundary.

### F-007 [WARNING] Disabled story bypasses container's orderId wiring

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:133-134` vs `OrderCopyLinkButton.tsx:13`
- Description: The `Disabled` story sets `disabled` directly on `OrderCopyLinkButtonView`, while production derives disabled from `disabled = !orderId`. This creates two code paths to the same visual state; the story never exercises `<OrderCopyLinkButton orderId="" />` even though the unit test does.
- Evidence:
```133:134:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx
export const Disabled: Story = {
  render: () => <OrderCopyLinkButtonView copied={false} disabled onCopy={fn()} />,
```
```13:13:src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx
  const disabled = !orderId;
```
- Suggested fix: Change the Disabled story to `<OrderCopyLinkButton orderId="" />` inside the existing `TopNavDecorator`, eliminating the view-only shortcut and aligning story + production wiring.
