---
agent: step-7-deep-simplify-order-copy-link-button-pass-1
input_branch: 04aaf8e902a7277b5e64bee43842a5c4f41bed35
verdict: fail
---

## Summary

Production code for the order copy-link button is appropriately lean — `OrderCopyLinkButton.tsx` reuses `useClipboard`, `ClipboardCopyIcon`, and `getOrderShareableUrl` without reinventing clipboard or URL utilities. Storybook scaffolding carries avoidable duplication: a copied-state preview that mirrors production JSX, triplicated `data-state` story wrappers, and CSS rules that repeat production pseudo-class styles plus story-only selectors shipped in the production CSS module.

## Findings

### F-001 [WARNING] Copied story duplicates production Button markup

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:79–101` vs `OrderCopyLinkButton.tsx:32–49`
- Description: `OrderCopyLinkButtonCopiedPreview` hand-builds the same macaw `Button` tree (className, variant, icon sizing, `data-test-id`, title/aria-label) that `OrderCopyLinkButton` already renders. Any future prop or styling change must be applied in two places.
- Evidence:

```tsx
// Production (OrderCopyLinkButton.tsx:32–49)
<Button className={styles.button} variant="secondary" disabled={disabled}
  icon={<ClipboardCopyIcon hasBeenClicked={copied} size={iconSize.medium} ... />}
  onClick={handleCopyLink} data-test-id="copy-order-link" title={label} aria-label={label} marginRight={3} />

// Story preview (OrderCopyLinkButton.stories.tsx:83–99) — same tree with copied=true hard-coded
<Button className={componentStyles.button} variant="secondary"
  icon={<ClipboardCopyIcon hasBeenClicked size={iconSize.medium} ... />}
  onClick={() => undefined} data-test-id="copy-order-link" title={label} aria-label={label} marginRight={3} />
```

- Suggested fix: Extract a small presentational sub-component (e.g. `OrderCopyLinkButtonView` accepting `copied`, `disabled`, `onClick`, `orderId`-derived label) shared by production and stories. Alternatively, add a Copied-story decorator that stubs `useClipboard` to return `[true, noop]` — the component test already uses this pattern (`OrderCopyLinkButton.test.tsx:65–67`); Storybook would need an equivalent module mock or a documented `copied` override prop limited to stories.

### F-002 [WARNING] Hover/Focus/Active stories repeat identical wrapper pattern

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx:48–69`
- Description: Three story exports differ only by the `data-state` attribute string on a wrapper `<div>`. The repetition adds scan cost and invites copy-paste drift if a fourth interaction state is added.
- Evidence:

```tsx
export const Hover: Story = {
  render: (args) => (<div data-state="hover"><OrderCopyLinkButton {...args} /></div>),
};
// Focus and Active follow the same shape with "focus" / "active"
```

- Suggested fix: Introduce a one-line helper, e.g. `const withDataState = (state: string) => (args: OrderCopyLinkButtonStoryArgs) => (<div data-state={state}><OrderCopyLinkButton {...args} /></div>)`, and assign `render: withDataState("hover")` etc.

### F-003 [WARNING] CSS duplicates production pseudo-class rules for Storybook previews

- Location: `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css:1–32`
- Description: Active and focus styles are declared twice — once for real interaction (`:active`, `:focus-visible`) and again for Storybook settled-state previews (`[data-state="active"]`, `[data-state="focus"]`). The active block is line-for-line equivalent; focus outline values match `:focus-visible`. Story-only `[data-state="hover"]` rules also live in the production-imported module, coupling docs styling to the runtime bundle.
- Evidence:

```css
/* Production */
.button:active:not(:disabled) { background-color: var(--mu-colors-background-default2) !important; box-shadow: none !important; outline: none !important; }

/* Storybook mirror — identical declarations */
[data-state="active"] .button:not(:disabled) { background-color: var(--mu-colors-background-default2) !important; box-shadow: none !important; outline: none !important; }
```

- Suggested fix: Merge shared selectors (`.button:active:not(:disabled), [data-state="active"] .button:not(:disabled) { … }` and similarly for focus outline). Move story-only `[data-state="hover"]` rules to a story-scoped CSS module if ESLint file-extension config can be adjusted (prior iteration moved them into production CSS to satisfy `extraFileExtensions` — revisit that constraint rather than permanently shipping preview selectors in production).
