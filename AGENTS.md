<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run lint` — runs `eslint` (flat config, ESLint 9). This is **not** `next lint`; don't run `next lint`.
- Typecheck: `npx tsc --noEmit` (there is no `typecheck` script).
- No test framework is configured — don't invent test commands.

## Stack notes

- Next.js 16.2.10 (App Router) + React 19.2.4. TypeScript strict, `noEmit`, `moduleResolution: bundler`.
- Path alias `@/*` maps to the repo root (`./*`), not `src/`.
- Tailwind CSS v4: configured inline via `@import "tailwindcss"` + `@theme` in `app/globals.css` and the `@tailwindcss/postcss` plugin. There is **no** `tailwind.config.ts`; do not create one.

## Project context

- `open-daycare`: a Spanish-language daycare management app (staff + family/parent flows). UI copy is in Spanish.
- `app/page.tsx` is still the default create-next-app scaffold — the real UI has not been built yet.
- `references/pantallas/*.dc.html` are the design source of truth for each screen; open `references/pantallas/index.dc.html` for the catalog of 15 screens. `references/screenshots/*.png` are rendered previews. Implement against these: fonts are Fredoka (headings) + Nunito (body) on a warm palette (background `#f6ecdf`, accent `#d9583c`/`#f2937a`, staff blue `#2e89a6`, family purple `#7b5fc0`).

## MCPs

- Playwright: screenshots and any Playwright output go in `.playwright-mcp/` (gitignored).
- Context7: use it to fetch current framework docs instead of relying on training data.
- Supabase: backend (Postgres, Auth, Storage, Edge Functions, Realtime). Usa las herramientas MCP (`list_tables`, `apply_migration`, `execute_sql`, `get_advisors`, `query_logs`) para cambios de schema, debugging y queries. Antes de tocar el schema, ejecuta `list_tables` para entender la estructura existente. Prefiere desarrollo local con la CLI antes de aplicar cambios al proyecto remoto.

## Agents

- `spec-verifier`: Verifies acceptance criteria of a spec file. Reviews implementation against each criterion, fixes code/spec issues found, and marks checkboxes. Uses Playwright MCP with vision to compare screenshots against references, and Context7 MCP to validate Next.js best practices.

## Skills

### Spec Driven Development

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.
- /verify-spec Usaremos este comando para verificar los criterios de aceptación de una spec.

### Supabase

- `supabase`: Úsala para CUALQUIER tarea que involucre Supabase — productos (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues), integraciones cliente/SSR (`supabase-js`, `@supabase/ssr`) en Next.js/React, problemas de auth (login, logout, sesiones, JWT, cookies, RLS), CLI o MCP server, cambios de schema, migraciones, extensiones Postgres y debugging de errores.
- `supabase-postgres-best-practices`: Cárgala ANTES de escribir o cambiar cualquier cosa que viva en Postgres — crear/alterar tablas y columnas (incluido elegir tipos), diseño de schema, migraciones y declarative schemas, políticas RLS y sus tests, índices, triggers, funciones, queues y jobs programados (pg_cron, pgmq), vector search (pgvector), restaurar dumps. También para diagnosticar queries lentas, CPU alta, timeouts, EXPLAIN plans, conexión, locking, bloat o filas visibles para el usuario/tentant equivocado.

## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés.
