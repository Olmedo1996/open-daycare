<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Open Daycare

Daycare app for families/teachers; UI copy is Spanish. Next.js 16 App Router, currently still a fresh `create-next-app` scaffold (`app/` is boilerplate, so most work is greenfield).

## Commands (pnpm only)

- `pnpm dev` — dev server on http://localhost:3000
- `pnpm build` / `pnpm start` — prod build / serve
- `pnpm lint` — ESLint flat config (`eslint` directly, not `next lint`)
- Typecheck: `pnpm exec tsc --noEmit` — there is **no** `typecheck` or test script in `package.json`

Package manager is pinned to `pnpm@11.5.2` (`packageManager` field, committed `pnpm-lock.yaml`). Use pnpm, not npm/yarn/bun.

## Tailwind v4 — no config file

Tailwind v4 runs via `@tailwindcss/postcss`. There is no `tailwind.config.*`; theme tokens live in CSS using `@theme inline` in `app/globals.css`. Extend the design system there, not in a JS config.

## Design source of truth

`references/pantallas/*.dc.html` are self-contained design comps (Fredoka + Nunito fonts, palette bg `#FBF4EC`); `references/screenshots/*.png` are previews. Screen names are Spanish (`login`, `feed`, `crear-publicacion`, `ninos`, ...). Build UI against these rather than inventing a theme, and keep copy in Spanish.

## MCPs / conventions

- Playwright screenshots and anything Playwright-related go in `.playwright-mcp/`.
- Use the Context7 MCP for up-to-date framework documentation.
- Next.js 16 uses typed routes — `app/layout.tsx` already does `LayoutProps<"/">`. Check `node_modules/next/dist/docs/` for current conventions.
- Use spec-driven development for features: `/spec` to write the spec, then `/spec-impl` to implement it (skills in `.agents/skills/`).

## Reglas de código 

- Usar código limpio, nombres, funciones y variables, etc. en inglés 