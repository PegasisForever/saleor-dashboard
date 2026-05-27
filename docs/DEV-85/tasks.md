## T-04b2dd15: Add OrderCopyLinkButton unit tests and sync i18n catalog
- Status: pending
- Priority: high
- Blocked by: none
- Discovered from: —
- Supersedes: —

### Context
The prototype loop shipped the full copy-link feature (container, presentational layer, TopNav integration, Storybook state coverage, and `ClipboardCopyIcon` sizing props). The tech plan explicitly defers unit-test coverage to the integration pass:

> | Missing unit test for `OrderCopyLinkButton`               | Add test in integration pass mirroring `CopyableText.test.tsx` pattern                             |

[Source: ./docs/DEV-85/tech-plan.md#risks]

PRD acceptance criteria the tests must mechanically verify (implementation already exists in source; tests are the gap):

> - [ ] Clicking the copy button writes `window.location.href` to the system clipboard
> - [ ] After a successful copy, the button icon shows a check mark (via `ClipboardCopyIcon`) for 2 seconds, then reverts to the copy icon
> - [ ] After a successful copy, the button `aria-label` and `title` read "Order link copied" (via `messages.orderLinkCopied`); before copy they read "Copy order link" (via `messages.copyOrderLink`)
> - [ ] When clipboard write fails, the button remains in the default (copy icon, "Copy order link") state and `useClipboard` logs a console warning — no unhandled promise rejection
> - [ ] All user-visible strings are defined in `src/orders/components/OrderCopyLinkButton/messages.ts` and rendered through react-intl

[Source: ./docs/DEV-85/prd.md#acceptance-criteria]

Container wiring to test against (mock `useClipboard`; do not re-implement clipboard logic):

```typescript
export const OrderCopyLinkButton = ({
  url,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();

  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);

  return <OrderCopyLinkButtonContent copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx]

Presentational layer exposes `data-test-id="copy-order-link"` and toggles label/icon via `copied`:

```typescript
  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
    <Button
      variant="secondary"
      ...
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
```

[Source: src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonContent.tsx]

Follow the existing clipboard-component test pattern:

```typescript
jest.mock("@dashboard/hooks/useClipboard");

describe("CopyableText", () => {
  it("copies provided text to clipboard when button is clicked", async () => {
    mockUseClipboard.mockReturnValue([false, mockCopy]);
    ...
    await user.click(copyButton);
    expect(mockCopy).toHaveBeenCalledWith(textToCopy);
  });

  it("shows check icon after text is copied", () => {
    mockUseClipboard.mockReturnValue([true, jest.fn()]);
    ...
    expect(checkIcon).toBeInTheDocument();
  });
});
```

[Source: src/components/CopyableText/CopyableText.test.tsx]

Tech-plan risk mitigation also requires syncing extracted messages before merge:

> | Message ID lint (`formatjs/enforce-id`)                   | Run `pnpm run extract-messages` during integration to normalize hash IDs                           |

[Source: ./docs/DEV-85/tech-plan.md#risks]

Messages already defined in co-located `messages.ts` (`copyOrderLink` id `bqtu1/`, `orderLinkCopied` id `FzcMi0`) but not yet present in `locale/` JSON catalogs.

### Acceptance
- [ ] `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exists with Arrange/Act/Assert structure and mocks `@dashboard/hooks/useClipboard` (same pattern as `CopyableText.test.tsx`)
- [ ] Clicking the button calls `mockCopy` with `window.location.href` when `url` prop is omitted
- [ ] Clicking the button calls `mockCopy` with the explicit `url` prop when provided
- [ ] When `mockUseClipboard` returns `[true, …]`, the button has accessible name "Order link copied" and renders a `.lucide-check` icon
- [ ] When `mockUseClipboard` returns `[false, …]`, the button has accessible name "Copy order link" and renders a `.lucide-copy` icon
- [ ] `pnpm run test:quiet src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.test.tsx` exits 0
- [ ] `pnpm run extract-messages` adds entries for message IDs `bqtu1/` and `FzcMi0` to locale JSON files
- [ ] `pnpm run lint` and `pnpm run check-types` exit 0 with no new errors in touched files
