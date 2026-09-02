# open-daycare

Aplicación de gestión de guardería (flujos de personal y familias). Next.js 16 (App Router) + React 19 + Supabase (Postgres, Auth, Storage) + Tailwind CSS v4.

## Requisitos previos

- [Node.js](https://nodejs.org) (>= 20) y [pnpm](https://pnpm.io) (el proyecto fija `pnpm@11.5.2` vía `packageManager`).
- [Docker](https://www.docker.com) (para levantar el stack local de Supabase).
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional si se usa `npx supabase`).

## Configuración de variables de entorno

1. Copia la plantilla a tu archivo local:

   ```bash
   cp .env.template .env.local
   ```

2. Rellena los valores:

   - `SUPABASE_DB_PASSWORD`: contraseña de la base de datos (usada por el stack local y/o `supabase db push`).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de la API de Supabase. Para el proyecto remoto es `https://pqhdlxebmnhxkqudfwdv.supabase.co`; para desarrollo local contra el stack de CLI es `http://127.0.0.1:54321`.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publishable (`sb_publishable_...`). Nunca uses la `service_role`/secret key en el cliente.
   - `RESEND_API_KEY`: API key de [Resend](https://resend.com) para envío de correos.

## Autenticación con Supabase

### 1. Autenticación del CLI (por persona, para trabajo con la base de datos)

Cada miembro del equipo debe autenticarse una vez con su cuenta de Supabase:

```bash
supabase login
```

Esto abre el navegador para iniciar sesión en supabase.com y guarda el token en `~/.supabase/access-token`. Luego vincula el proyecto local al proyecto remoto:

```bash
supabase link --project-ref pqhdlxebmnhxkqudfwdv
```

Con el CLI autenticado ya puedes usar `supabase db push`, `supabase db pull`, `supabase db diff`, etc.

### 2. Autenticación del MCP de Supabase

El servidor MCP de Supabase está configurado en opencode (configuración global) apuntando al servidor alojado con el `project_ref` del proyecto:

```
https://mcp.supabase.com/mcp?project_ref=pqhdlxebmnhxkqudfwdv&features=...
```

El MCP **no** usa el token del CLI. Por defecto usa *dynamic client registration* (OAuth): la primera vez que opencode se conecta, te redirige al navegador para iniciar sesión en tu cuenta de Supabase y conceder acceso. Debes elegir la organización que contiene el proyecto.

Para autenticarte (validar) el MCP de Supabase desde opencode:

```bash
opencode mcp auth supabase
```

Esto abre el navegador y completa el flujo OAuth. Para comprobar el estado de la autenticación usa `opencode mcp auth list`, y para desloguearte `opencode mcp logout supabase`.

Notas:

- Si usas el stack local (`supabase start`), el MCP local está disponible en `http://localhost:54321/mcp`.
- Para entornos de CI (donde no hay navegador), se puede autenticar con un *Personal Access Token* (PAT) pasándolo en la cabecera `Authorization: Bearer <token>`.
- El MCP nunca debe conectarse a datos de producción: está pensado solo para desarrollo y testing.

## Levantar el proyecto

1. Instala dependencias:

   ```bash
   pnpm install
   ```

2. Levanta el stack local de Supabase (Postgres, Auth, Storage, Studio):

   ```bash
   supabase start
   ```

   - Base de datos: `localhost:54322`
   - API: `localhost:54321`
   - Studio: `localhost:54323`
   - SMTP de prueba (correos): `localhost:54324`

   Para aplicar las migraciones y el seed desde cero:

   ```bash
   supabase db reset
   ```

3. Arranca el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Comandos útiles

- `pnpm dev` — servidor de desarrollo.
- `pnpm build` / `pnpm start` — build de producción y arranque.
- `pnpm lint` — ESLint (flat config, ESLint 9).
- `npx tsc --noEmit` — typecheck.
- `supabase start` / `supabase stop` — arrancar/parar el stack local.
- `supabase db reset` — reaplicar migraciones y seed localmente.
- `supabase db push` — aplicar migraciones locales al proyecto remoto vinculado.
