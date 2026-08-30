# SPEC 07 — Tabla daycares + setup de Supabase (CLI, migraciones, cliente JS y tipos)

> **Estado:** implementado
> **Depende de:** ninguna (primera spec de backend/BD)
> **Fecha:** 2026-08-29
> **Objetivo:** Crear la tabla `daycares` en Supabase con RLS habilitada y política de solo lectura para autenticados, inicializar la infraestructura local de migraciones (`supabase/`), instalar `@supabase/ssr`, crear los clientes browser/server y generar los tipos TypeScript.

## Scope

**In:**

- Inicializar Supabase CLI local: carpeta `supabase/` con `config.toml` y estructura de migraciones.
- Crear migración `create_daycares_table` con:
  - Tabla `public.daycares` (`id` uuid PK default `gen_random_uuid()`, `name` text NOT NULL, `created_at` timestamptz default `now()`).
  - Comentario descriptivo en la tabla.
  - RLS habilitada.
  - Política SELECT para usuarios autenticados (`USING (true)`).
- Crear `supabase/seed.sql` con una fila de demo: "Guardería Sala Soles".
- Aplicar la migración y el seed al proyecto remoto vía `supabase db push`.
- Instalar `@supabase/ssr` como dependencia del proyecto.
- Crear `lib/supabase/client.ts` con `createBrowserClient` usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Crear `lib/supabase/server.ts` con `createServerClient` (async, lee cookies de `next/headers`).
- Configurar `.env.local` con las variables públicas del proyecto (URL + anon key).
- Actualizar `.env.template` con las keys sin valores.
- Generar tipos TypeScript de la base de datos (`supabase gen types typescript`) y guardarlos en `types/database.types.ts`.
- Verificar `npm run lint` y `npx tsc --noEmit` pasan sin errores.

**Out of scope (para specs futuras):**

- Tabla `users` y su trigger sobre `auth.users`.
- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.
- Políticas INSERT/UPDATE/DELETE en `daycares` (van con la spec de `users` + `admin`).
- Enum types (`user_role`, `user_status`, `relationship_type`, etc.) — se crean en las specs de las tablas que los usan.
- Auth flows (login, logout, sesiones).
- Integración de Supabase en componentes UI existentes (feed, kids, etc.).
- Middlewares de Next.js para refresh de sesión.

## Data model

### Tabla `public.daycares`

```sql
CREATE TABLE public.daycares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.daycares IS 'Entidad raíz: la guardería. Todos los usuarios, salas y niños pertenecen a una daycare.';

ALTER TABLE public.daycares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daycares_select_authenticated"
  ON public.daycares
  FOR SELECT
  TO authenticated
  USING (true);
```

### Seed

```sql
-- supabase/seed.sql
INSERT INTO public.daycares (name) VALUES ('Guardería Sala Soles');
```

### Cliente browser (`lib/supabase/client.ts`)

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### Cliente server (`lib/supabase/server.ts`)

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

### Variables de entorno

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=<get_project_url del MCP>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get_publishable_keys del MCP>
```

## Implementation plan

1. **Instalar `@supabase/ssr`.** Ejecutar `pnpm add @supabase/ssr`. _Prueba: verificar que aparece en `package.json` dependencies._

2. **Inicializar Supabase CLI local.** Ejecutar `npx supabase init` en la raíz del repo. Esto crea `supabase/config.toml` y `supabase/.gitignore`. _Prueba: `ls supabase/` muestra `config.toml` y `migrations/`._

3. **Linkear al proyecto remoto.** Ejecutar `npx supabase link --project-ref <ref>` (el project-ref se obtiene de la URL del proyecto). _Prueba: `npx supabase status` muestra el proyecto linkeado._

4. **Crear la migración.** Ejecutar `npx supabase migration new create_daycares_table`. Editar el archivo generado en `supabase/migrations/` con el SQL de la tabla, RLS y política SELECT. _Prueba: revisar el SQL manualmente._

5. **Crear el seed.** Escribir `supabase/seed.sql` con el INSERT de "Guardería Sala Soles". _Prueba: revisar el archivo._

6. **Aplicar al remoto.** Ejecutar `npx supabase db push`. Esto aplica la migración y luego el seed. _Prueba: ejecutar `list_tables` desde MCP y verificar que `daycares` existe con sus columnas. Ejecutar `execute_sql` para verificar que la fila de seed existe._

7. **Configurar variables de entorno.** Obtener URL y anon key del MCP (`get_project_url`, `get_publishable_keys`). Escribir `.env.local` y actualizar `.env.template` con las keys sin valores. _Prueba: `cat .env.template` muestra las dos variables._

8. **Crear `lib/supabase/client.ts`.** Implementar `createBrowserClient` con las env vars. _Prueba: importar desde un archivo temporal y verificar que no hay errores de tipos._

9. **Crear `lib/supabase/server.ts`.** Implementar `createServerClient` con manejo de cookies de `next/headers`. _Prueba: importar y verificar tipos._

10. **Generar tipos TypeScript.** Ejecutar `npx supabase gen types typescript --linked > types/database.types.ts`. _Prueba: abrir el archivo y verificar que contiene la interfaz `Database` con la tabla `daycares`._

11. **Verificar advisors.** Ejecutar `get_advisors` desde MCP para confirmar que no hay warnings de seguridad sobre la tabla. _Prueba: sin advisors críticos relacionados con `daycares`._

12. **Lint + typecheck final.** Ejecutar `npm run lint` y `npx tsc --noEmit`. _Prueba: ambos pasan sin errores._

## Acceptance criteria

- [ ] `@supabase/ssr` está instalado y aparece en `package.json`.
- [ ] La carpeta `supabase/` existe con `config.toml` y `supabase/migrations/`.
- [ ] Existe un archivo de migración `create_daycares_table` con el SQL de la tabla.
- [ ] La tabla `public.daycares` existe en el proyecto remoto con columnas `id` (uuid PK), `name` (text NOT NULL), `created_at` (timestamptz default now()).
- [ ] RLS está habilitada en `daycares`.
- [ ] Existe una política SELECT para usuarios `authenticated` en `daycares`.
- [ ] `supabase/seed.sql` existe y contiene el INSERT de "Guardería Sala Soles".
- [ ] La fila "Guardería Sala Soles" existe en la tabla `daycares` del remoto (verificable con query SQL).
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con valores reales.
- [ ] `.env.template` contiene las dos variables sin valores.
- [ ] `lib/supabase/client.ts` existe y exporta `createClient()` con `createBrowserClient`.
- [ ] `lib/supabase/server.ts` existe y exporta `createClient()` async con `createServerClient`.
- [ ] `types/database.types.ts` existe y contiene la interfaz `Database` con la tabla `daycares`.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `get_advisors` no reporta advisors críticos relacionados con `daycares`.

## Decisions

- **Sí:** CLI local con `supabase/` versionado en git. Permite reproducibilidad, revisión de migraciones en PRs y trabajo offline.
- **Sí:** Setup completo en una sola spec (tabla + cliente JS + tipos + env vars). Es la primera spec de backend y conviene tener toda la base lista para specs siguientes.
- **Sí:** RLS habilitada desde el principio con política SELECT para autenticados. Buena práctica de seguridad desde el día 1; INSERT/UPDATE/DELETE se agregan cuando exista `users` con `role = admin`.
- **Sí:** Seed en archivo separado (`supabase/seed.sql`). Separa schema de datos y permite re-seed sin tocar migraciones.
- **Sí:** Ambos clientes (browser + server) en esta spec. Base completa para cualquier feature futuro (SSR, server components, client components).
- **Sí:** Variables `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon key). Compatible con la mayoría de tutoriales y ejemplos de `@supabase/ssr`.
- **Sí:** Tipos TypeScript generados en `types/database.types.ts`. Autocompletado y type safety para queries.
- **No:** Crear las demás tablas del schema. Cada tabla va en su propia spec.
- **No:** Crear los enum types ahora. Se crean en las specs de las tablas que los usan (ej. `user_role` con la spec de `users`).
- **No:** Middleware de Next.js para refresh de sesión. Va en la spec de auth cuando se implemente login.
- **No:** Integrar Supabase en los componentes UI existentes. Va en specs de migración de mocks a datos reales.

## What is **not** in this spec

- Tabla `users` y trigger sobre `auth.users`.
- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.
- Enum types (`user_role`, `user_status`, etc.).
- Políticas INSERT/UPDATE/DELETE en `daycares`.
- Auth flows (login, logout, sesiones, middleware).
- Integración de Supabase en componentes UI existentes (feed, kids, modales).
- Migración de mocks a datos reales.

Cada uno de esos, si llega, va en su propia spec.
