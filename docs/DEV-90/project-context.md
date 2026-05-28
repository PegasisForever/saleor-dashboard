# Project Context

## Tech stack

- **Language:** TypeScript 5.8.3 (global `strict: false`, gradual strictness via `typescript-strict-plugin`)
- **UI:** React 18.3.1, React Router 5.3.4, `@saleor/macaw-ui-next` 1.4.2, Lucide icons
- **Data:** Apollo Client 3.4.17, GraphQL 16.11.0 with codegen hooks in `@dashboard/graphql`
- **Build:** Vite 7.3.2, SWC, pnpm 10.28.2, Node >=24
- **Testing:** Jest 27 + Testing Library; Playwright E2E; Storybook 10.2.16 + Vitest
- **i18n:** react-intl 5.25.1 with `defineMessages` and `locale/*.json`
- **Dev server:** port 9000 (`pnpm run dev`); Storybook port 6006 (`pnpm run storybook`)

## Conventions

- Feature modules under `src/{domain}/` with `views/`, `components/`, `queries.ts`, `mutations.ts`, `urls.ts`, `fixtures.ts`
- Path aliases: `@dashboard/*` → `src/*`, `@test/*` → `testUtils/*`, `@storybookUtils/*` → `storybookUtils/*`
- Named exports only (no default exports in new code); direct imports (no barrel files for new work)
- CSS Modules (`.module.css`) co-located with components; Macaw Box props for simple layout
- User-facing strings via `react-intl` (`messages.ts` per feature + shared catalogs in `src/intl.ts`)
- Storybook stories: `{Component}.stories.tsx` alongside component source
- ESLint enforces import sort, formatjs message IDs, deprecated library warnings

## Existing patterns

- **Auth:** `useUser()` from `src/auth/useUser.ts`; session via legacy SDK + Apollo `credentials: "include"`
- **Data fetching:** Generated hooks from `@dashboard/graphql` wrapped by `makeQuery`/`makeMutation` (auto error toasts, JWT handling)
- **Errors:** GraphQL field errors in mutation responses; `useNotifier()` for success/error toasts
- **i18n:** `FormattedMessage`, `useIntl().formatMessage()`, shared `buttonMessages` / `commonMessages`
- **Clipboard:** `useClipboard()` hook (`src/hooks/useClipboard.ts`) — 2s copied state, `navigator.clipboard.writeText`
- **Copy UI:** `ClipboardCopyIcon` (orders), `CopyableText` (shared), inline copy buttons in `OrderCustomer`
- **TopNav actions:** Secondary `Button` with Lucide icon (e.g. metadata `Code` icon on order/warehouse details)
- **Testing:** `@test/wrapper` with Apollo mocks + IntlProvider; Arrange/Act/Assert comments

## Prior architectural decisions

- Static SPA admin frontend; no SSR; backend is external Saleor GraphQL
- Prefer `@saleor/macaw-ui-next` over legacy Macaw/MUI (CI blocks increasing legacy imports)
- GraphQL types/hooks are generated — never hand-edit `*.generated.ts`
- Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`
- List UX: scroll containers for 50+ items; loading/empty states required for tables
- URL helpers in feature `urls.ts` (e.g. `orderUrl(id)` → `/orders/{id}?`)

## Out of scope

- Backend/API changes in this repo (dashboard is client-only)
- New clipboard primitives when `useClipboard` + existing copy-icon components suffice
- Barrel exports, default exports, legacy Macaw UI, Material UI, moment.js, classnames
- Manual edits to generated GraphQL artifacts or lockfile conflict resolution without regeneration
