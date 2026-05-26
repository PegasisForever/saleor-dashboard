---
agent: step-3-ui-reviewer
sequence: 15
input_branch: 3b7f75ab9ea285ec7b621260829aff022f08b6a6
status: DONE
---

## Summary

Ran static checks on `OrderCopyLinkButton` sources and walked all eight Storybook states on deploy `3334d95e…` via chrome-devtools (host rewritten to `local-deploy:11000`). Captured per-state screenshots and live contrast/touch measurements. Verdict **fail** due to BLOCKER: production component lacks the Focus-story accent1 ring documented in ui-design.

## Decisions made independently

- **Contrast mechanical pass despite 1.35:1 resting border**: Treated resting border as supplementary chrome; primary identification is the icon (4.08:1). Focus story outline is the declared affordance and passes ≥6.42:1.
- **Touch-target mechanical pass at 32×32**: Compared to metadata secondary icon button in `OrderDetailsPage.tsx` — same fleet size → WARNING not BLOCKER per severity calibration rules.
- **Production focus gap = BLOCKER**: ui-design declares accent1 ring as focus affordance; only story CSS implements it; keyboard focus on Default story shows no qualifying indicator.

## Files / sections inspected

- `docs/DEV-66/ui-design.md` (full): Storybook URL, eight states, focus-ring design decision
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.tsx`: production component, no story CSS import
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.tsx`: eight story exports
- `src/orders/components/OrderCopyLinkButton/OrderCopyLinkButton.stories.module.css`: story pseudo-states + focus ring
- `src/orders/components/OrderCopyLinkButton/messages.ts`: i18n for label + error
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx:210-232`: TopNav integration + metadata neighbor
- `src/orders/utils/getOrderAbsoluteUrl.ts`: URL helper
- Storybook iframes `orders-ordercopylinkbutton--{default,hover,focus,active,disabled,loading,error,empty}` on `local-deploy:11000/3334d95e…`

## Considered then dropped

- **BLOCKER on resting border 1.35:1**: Reclassified to WARNING F-002 — icon passes non-text 3:1; border is macaw fleet chrome shared with metadata button, not copy-specific regression.
- **BLOCKER on 32×32 touch target**: Downgraded to WARNING F-003 after confirming metadata neighbor uses same secondary icon-only sizing.
- **FAIL contrast mechanical check**: Initially considered fail for default border; reversed because WCAG spirit applies threshold to the focus *affordance* (outline ring in Focus story), not supplementary resting chrome.
- **Using readonly sub-agent chrome results**: Sub-agent returned Ask-mode partial data citing prior iterations; discarded and re-ran all measurements live in main session (independence rule).

## Dead ends and retries

- **Task sub-agent chrome blocked**: Spawned chrome sub-agent in `readonly: true`; it could not invoke chrome-devtools. Re-ran full state walkthrough directly in main agent session.
- **Programmatic `btn.focus()` for production focus**: Did not trigger `:focus-visible`; used snapshot + style probe on focused button; border remained 1.35:1 with `outlineWidth: 0px`.

## Ambiguities encountered

- **Whether story-only focus ring is acceptable for prototype**: ui-design explicitly labels ring as story-only, but also lists production files and Accessibility keyboard requirements — resolved as BLOCKER because production path is in scope and keyboard users won't see the validated ring.

## Concerns / warnings

- Lighthouse snapshot scored 100 on Default; only ran once (not per-state) to limit chrome load.
- Disabled vs Loading look similar in screenshots but opacity 0.5 vs 1.0 is measurable and distinct enough for state-coverage pass.
- `OrderDetailsPage` metadata button still uses bare English `title="Edit order metadata"` (pre-existing, out of copy-button diff scope).

## Did not do (out of scope or deferred)

- Read prior iteration findings, router reports, or `logs/` from other agentRuns (independence rule).
- Persona walkthroughs (optional; not run).
- Mobile viewport emulation (ui-design notes nowrap TopNav; desktop audit sufficient for this pass).
- Per-state Lighthouse (one Default snapshot only).
