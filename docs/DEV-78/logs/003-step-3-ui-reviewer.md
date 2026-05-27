---
agent: step-3-ui-reviewer
sequence: 3
input_branch: 7db08b0a576c44b419ce7563f02c20c5d229aad2
status: DONE
---

## Summary

Reviewed DEV-78 prototype iteration 1: read `ui-design.md`, all `OrderCopyLinkButton` source files, and drove the published Storybook deploy through chrome-devtools MCP (6 states, contrast/touch-target/Lighthouse). Verdict **fail** due to state-coverage and token-purity mechanical check failures. Committed findings and screenshots.

## Decisions made independently

- **touch-target mechanical pass despite 32×32 measurement:** Copy button matches metadata (32×32) and menu (32×32) neighbors per severity-calibration rules — convention WARNING, not regression BLOCKER; mechanical check recorded as `pass`.
- **contrast on disabled skipped:** Applied inactive-state exemption per review spec; disabled palette ~2:1 is by design.
- **Focus story state-coverage fail:** Although Storybook `play()` applies focus at runtime (button shows focus ring in screenshot), static args/render are identical to `Default` — mechanical rule treats identical args as coverage defect regardless of play function.
- **token-purity fail for rgba box-shadow:** Even though values mirror measured macaw styles and classes are story-gated via `previewState`, literals live in production-imported `.module.css` and violate project "no hardcoded colors" rule.

## Files / sections inspected

- `docs/DEV-78/ui-design.md`: Storybook URL, 6 declared states, contrast/a11y design decisions
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: story exports, TopNav decorator, state coverage
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButtonView.tsx`: Button props, i18n, previewState classes
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: useClipboard integration
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.module.css`: preview hover/active styles, rgba literals
- `src/orders/components/OrderCopyLinkButton/messages.ts`: i18n messages
- `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx`: 16px icon sizing
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-217`: metadata neighbor pattern
- `src/hooks/useClipboard.ts`: error handling (console.warn only)
- `.claude/skills/saleor-dashboard-styles/SKILL.md`: token purity anti-patterns
- Storybook runtime via `http://local-deploy:11000/ced5a50a-8962-4084-ba5d-267f52ba8ae5/iframe.html?id=orders-ordercopylinkbutton--*`
- Lighthouse report `/tmp/chrome-devtools-mcp-KzIfi9/report.json`: button-name/link-name failures on back control

## Considered then dropped

- **BLOCKER on 32×32 touch target:** Initially flagged because all interactive TopNav buttons measured sub-44. Reclassified to WARNING after neighbor comparison showed copy = metadata = menu at 32×32 (not smaller than family).
- **BLOCKER on icon 16px vs metadata 20px:** Noted visual size difference but touch-target rect is identical (32×32 button chrome); icon glyph size alone doesn't change hit area — dropped as separate BLOCKER.
- **FAIL contrast on disabled muted icon:** Re-read inactive-state exemption in prompt; correctly skipped disabled contrast entirely.
- **BLOCKER on Lighthouse 87 score:** Failures trace to story decorator back link, not copy button; downgraded to WARNING F-005 on fixture only.

## Dead ends and retries

- **Chrome sub-agent blocked in Ask mode:** Spawned `generalPurpose` sub-agent for Storybook walkthrough; all chrome-devtools MCP calls rejected ("ask mode"). Ran full 6-state browser audit directly in main session instead.
- **MCP typo:** One `wait_for` call used wrong server name (`chrome-devtools，`) — retried successfully.

## Ambiguities encountered

- **Focus story distinctness at runtime vs static:** Storybook iframe executes `play()` so Focus renders with focus ring live, but mechanical state-coverage rule explicitly flags identical static args — resolved in favor of fail per spec wording.
- **token-purity scope for story-only preview classes:** Classes ship in production bundle but are only activated via Storybook-only `previewState` prop; still counted as source-tree violation since rgba is outside token file.

## Concerns / warnings

- Hover vs active visual distinction is subtle (same background token, shadow-only delta) — acceptable but may be hard to spot in Chromatic thumbnails.
- Lighthouse accessibility 87 on all states due to decorator a11y gaps; copy button itself passes aria-label checks.

## Did not do (out of scope or deferred)

- **Persona walkthroughs:** Optional per prompt; skipped to stay within chrome budget after sub-agent failure.
- **Mobile viewport emulation:** Design doc notes mobile inherits same touch targets; desktop measurements plus neighbor comparison deemed sufficient for prototype iteration 1.
- **Prior findings / sibling reviews / router reports / logs/:** Excluded per review independence rule.
