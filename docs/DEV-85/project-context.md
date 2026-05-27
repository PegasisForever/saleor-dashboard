# Project Context

## Tech stack

- **Language:** TypeScript 5.8.3 (target ES2020, strict mode off globally; new code should be strict)
- **UI framework:** React 18.3.1 SPA
- **Build:** Vite 7.3.2 + SWC (`@vitejs/plugin-react-swc`); dev server port 9000
- **Package manager:** pnpm 10.28.2 (Node ≥24 <25)
- **UI library:** `@saleor/macaw-ui-next` 1.4.2 (primary); legacy `@saleor/macaw-ui` / MUI v4 still present in old views
- **Icons:** `lucide-react` (preferred over deprecated Macaw icons)
- **Data layer:** Apollo Client 3.4.17 + GraphQL 16.11.0 (codegen → `src/graphql/*.generated.ts`)
- **Routing:** React Router v5
- **Forms:** React Hook Form
- **i18n:** react-intl 5.25.1
- **Toasts:** Sonner via `useNotifier()` hook
- **Testing:** Jest 27 + Testing Library (unit), Playwright (E2E), Vitest + Storybook 10 (component)
- **Storybook:** `pnpm run storybook` (port 6006), `pnpm run build-storybook` → `storybook-static/`

## Conventions

- Feature-based modules under `src/{domain}/` with `views/`, `components/`, `queries.ts`, `mutations.ts`, `urls.ts`, `fixtures.ts`
- Path aliases: `@dashboard/*` → `src/*`, `@test/*` → `testUtils/*`
- **Named exports only** for new components; no barrel/index re-exports for new code
- **CSS Modules** (`.module.css`) for pseudo-selectors and complex styling; Macaw `Box` props for simple layout
- **Direct imports:** `import { Foo } from "./components/Foo/Foo"` — not folder barrels
- Co-locate `messages.ts`, hooks, and CSS modules beside components
- ESLint enforces import sorting, `formatjs/enforce-id`, no legacy MUI/Macaw imports
- Run `pnpm run lint`, `pnpm run check-types`, `pnpm run test:quiet <file>` before completing changes

## Existing patterns

- **Clipboard:** `useClipboard()` at `src/hooks/useClipboard.ts` returns `[copied, copy]`; resets after 2s; logs warning on failure
- **Copy icon:** `ClipboardCopyIcon` at `src/orders/components/OrderCardTitle/ClipboardCopyIcon.tsx` toggles Copy/Check icons
- **Copyable text pattern:** `src/components/CopyableText/CopyableText.tsx` — hover-reveal tertiary button with copy feedback
- **TopNav actions:** Secondary icon `Button` in `TopNav` children (see order metadata button in `OrderDetailsPage.tsx`)
- **i18n:** `defineMessages` in co-located `messages.ts`; reuse `buttonMessages` from `src/intl.ts` where applicable
- **Order URLs:** `orderPath(id)`, `orderUrl(id, params?)` in `src/orders/urls.ts`
- **Notifications:** `useNotifier()` for success/error toasts after mutations
- **Tests:** `@test/wrapper` with Apollo + Intl; Arrange/Act/Assert comments; typed fixtures

## Prior architectural decisions

- Dashboard is a GraphQL admin SPA; backend is source of truth (Saleor API at `http://localhost:8000/graphql/`)
- GraphQL types/hooks are codegen-generated — never hand-edit `*.generated.ts`
- macaw-ui-next is the design system for all new UI; Lucide for icons
- All user-facing strings must be internationalized via react-intl
- New components should include Storybook stories (`ComponentName.stories.tsx`)
- Static deployment model (Vite build → `build/dashboard`)
- Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`

## Out of scope

- Backend/API changes (clipboard is browser-only)
- New clipboard hooks or copy-icon components (ticket reuses existing ones)
- Legacy UI libraries (`@saleor/macaw-ui`, `@material-ui/*`)
- Barrel export index files for new code
- Manual edits to generated GraphQL or lock files
- Non-i18n user-facing strings
- `console.log` in src/ (only warn/error allowed)
