# SPEC 08 — Tabla `users` + enums + trigger de Auth y usuario staff de prueba

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (tabla `daycares`, setup de Supabase y clientes JS)
> **Fecha:** 2026-08-29
> **Objetivo:** Crear la tabla `users` con sus enums `user_role` y `user_status`, un trigger `AFTER INSERT` sobre `auth.users` que genere automáticamente el perfil, políticas RLS de lectura y un usuario staff seedeable para probar la app.

## Scope

**In:**

- Crear migración `create_users_table` con:
  - Enum type `user_role` (`staff`, `parent`, `admin`).
  - Enum type `user_status` (`pending`, `active`).
  - Tabla `public.users` (id uuid PK FK → `auth.users` ON DELETE CASCADE, daycare_id FK → `daycares`, role, status default `active`, full_name, avatar_url nullable, notify_on_post default true, daily_summary_enabled default true, created_at, updated_at).
  - Trigger `AFTER INSERT` en `auth.users` (función `SECURITY DEFINER`) que inserta en `public.users` leyendo `daycare_id`, `role` y `full_name` de `raw_user_meta_data`.
  - RLS habilitada con dos políticas SELECT: propia fila (`auth.uid() = id`) y por daycare (mismo `daycare_id` para staff/admin), usando un helper `SECURITY DEFINER` `get_my_daycare_id()` para evitar la recursión de RLS.
- Actualizar `supabase/seed.sql` con un usuario staff de prueba:
  - INSERT en `auth.users` con `encrypted_password` (usando `crypt()` de `pgcrypto`) + meta_data con `daycare_id`, `role = 'staff'`, `full_name`.
  - La fila en `public.users` se crea automáticamente vía el trigger (no se inserta a mano).
- Aplicar la migración y el seed al proyecto remoto vía `supabase db push`.
- Regenerar `types/database.types.ts` para incluir la tabla `users` y los enums.
- Verificar `npm run lint` y `npx tsc --noEmit` pasan sin errores.

**Out of scope (para specs futuras):**

- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.
- Enum types restantes (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Políticas INSERT/UPDATE/DELETE en `users` (el INSERT lo maneja el trigger).
- Auth flows UI (login, logout, sesiones, middleware de refresh).
- Integración de Supabase en componentes UI existentes (feed, kids, modales).
- Endpoint de Edge Function para registro de padres (flujo de invitación).
- Actualización automática de `updated_at` (trigger de modificación).

## Data model

### Enums

```sql
CREATE TYPE public.user_role   AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active');
```

### Tabla `public.users`

```sql
CREATE TABLE public.users (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id             uuid NOT NULL REFERENCES public.daycares(id) ON DELETE CASCADE,
  role                   public.user_role NOT NULL,
  status                 public.user_status NOT NULL DEFAULT 'active',
  full_name              text NOT NULL,
  avatar_url             text,
  notify_on_post         boolean NOT NULL DEFAULT true,
  daily_summary_enabled  boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Perfil de aplicación vinculado a Supabase Auth. Padres y staff comparten tabla, diferenciados por role.';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Trigger sobre `auth.users`

```sql
-- Función SECURITY DEFINER que crea el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'daycare_id')::uuid,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger AFTER INSERT sobre auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Helper para RLS + políticas

```sql
-- Helper SECURITY DEFINER: devuelve el daycare_id del usuario autenticado.
-- Evita la recursión infinita de RLS: un subselect directo sobre public.users
-- dentro de la política provocaría 'infinite recursion detected in policy'.
CREATE OR REPLACE FUNCTION public.get_my_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT daycare_id FROM public.users WHERE id = auth.uid()
$$;

-- Un usuario ve su propia fila
CREATE POLICY "users_select_self"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Staff y admin ven todos los usuarios de su daycare
CREATE POLICY "users_select_same_daycare_staff"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    role IN ('staff', 'admin')
    AND daycare_id = public.get_my_daycare_id()
  );
```

### Seed — usuario staff de prueba

```sql
-- supabase/seed.sql (añadir al existente que ya tiene el daycare)

-- Insertar directamente en auth.users con pgcrypto.
-- Las columnas string van a '' (y is_super_admin a false) porque GoTrue las
-- escanea como no-nulas al hacer login; si quedan NULL, el signin falla con
-- 500 'Database error querying schema'.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  encrypted_password,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  recovery_token,
  reauthentication_token,
  confirmation_token,
  is_super_admin,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff@opendaycare.test',
  now(),
  crypt('staff12345', gen_salt('bf')),
  '', '', '',
  '', '', '',
  '', '',
  '',
  false,
  '{}'::jsonb,
  jsonb_build_object(
    'daycare_id', (SELECT id FROM public.daycares WHERE name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Sofía Staff'
  ),
  now(),
  now()
);

-- La fila en public.users se crea automáticamente vía el trigger on_auth_user_created.
```

> **Nota:** El `instance_id` fijo es necesario para inserts directos en `auth.users` en entornos locales/seed. En producción los usuarios se crean vía el flujo normal de Auth y el `instance_id` lo gestiona Supabase.

## Implementation plan

1. **Crear la migración.** Ejecutar `npx supabase migration new create_users_table`. Editar el archivo generado con: los dos enum types, la tabla `users` con todas sus columnas y FKs, el comentario, RLS habilitada, las dos políticas SELECT, la función `handle_new_user()` y el trigger `on_auth_user_created`. _Prueba: revisar el SQL manualmente._

2. **Actualizar el seed.** Añadir al final de `supabase/seed.sql` el INSERT en `auth.users` para el usuario staff de prueba. _Prueba: revisar que el `raw_user_meta_data` incluye `daycare_id`, `role` y `full_name`._

3. **Aplicar al remoto.** Ejecutar `npx supabase db push`. Esto aplica la migración (enums, tabla, trigger, RLS) y luego ejecuta el seed. _Prueba: ejecutar `list_tables` desde MCP y verificar que `users` existe. Ejecutar `execute_sql` para verificar que el usuario staff existe en `public.users` con `role = 'staff'`._

4. **Verificar el login del staff.** Intentar hacer signin con `staff@opendaycare.test` / `staff12345` (desde el cliente JS o MCP). _Prueba: la autenticación devuelve una sesión válida._

5. **Verificar advisors.** Ejecutar `get_advisors` desde MCP para confirmar que no hay warnings críticos sobre `users` o el trigger. _Prueba: sin advisors críticos relacionados._

6. **Regenerar tipos TypeScript.** Ejecutar `npx supabase gen types typescript --linked > types/database.types.ts`. _Prueba: abrir el archivo y verificar que contiene la interfaz `Database` con la tabla `users` y los enums `user_role` / `user_status`._

7. **Lint + typecheck final.** Ejecutar `npm run lint` y `npx tsc --noEmit`. _Prueba: ambos pasan sin errores._

## Acceptance criteria

- [ ] Existe un archivo de migración `create_users_table` con el SQL de enums, tabla, trigger y políticas.
- [ ] Los enum types `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) existen en el remoto.
- [ ] La tabla `public.users` existe con columnas: `id` (uuid PK FK → auth.users), `daycare_id` (FK → daycares), `role` (user_role), `status` (user_status default 'active'), `full_name`, `avatar_url` (nullable), `notify_on_post` (default true), `daily_summary_enabled` (default true), `created_at`, `updated_at`.
- [ ] La función `handle_new_user()` existe como `SECURITY DEFINER`.
- [ ] El trigger `on_auth_user_created` existe sobre `auth.users` (AFTER INSERT).
- [ ] RLS está habilitada en `users`.
- [ ] Existe la política `users_select_self` (SELECT donde `auth.uid() = id`).
- [ ] Existe la política `users_select_same_daycare_staff` (SELECT para staff/admin del mismo daycare).
- [ ] La función helper `get_my_daycare_id()` existe como `SECURITY DEFINER` y es usada por `users_select_same_daycare_staff` (evita recursión de RLS).
- [ ] `supabase/seed.sql` contiene el INSERT del usuario staff en `auth.users`.
- [ ] El usuario `staff@opendaycare.test` existe en `auth.users` del remoto.
- [ ] La fila correspondiente existe en `public.users` con `role = 'staff'` y `full_name = 'Sofía Staff'` (creada por el trigger).
- [ ] El login con `staff@opendaycare.test` / `staff12345` devuelve una sesión válida.
- [ ] `types/database.types.ts` contiene la interfaz `Database` con la tabla `users` y los enums `user_role` / `user_status`.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `get_advisors` no reporta advisors críticos relacionados con `users` o el trigger.

## Decisions

- **Sí:** Trigger `AFTER INSERT` sobre `auth.users` para crear el perfil automáticamente. Es lo que sugiere el db-schema y desacopla la creación de auth de la del perfil de dominio.
- **Sí:** Leer `daycare_id`, `role` y `full_name` de `raw_user_meta_data` en el signup. Mantiene el perfil de dominio separado de auth (no duplica email/password).
- **Sí:** `COALESCE` con defaults (`role = 'parent'`, `full_name = ''`) en el trigger. Evita errores si el signup no incluye meta_data completa.
- **Sí:** Función `SECURITY DEFINER` con `search_path = public`. Necesario porque el trigger corre sobre `auth.users` (schema interno) y debe insertar en `public.users`.
- **Sí:** Dos políticas SELECT (propia fila + por daycare para staff). Permite que el staff vea a su equipo y los padres vean solo su propio perfil.
- **Sí:** Helper `get_my_daycare_id()` (`SECURITY DEFINER`, `STABLE`, `search_path = public`) usado por `users_select_same_daycare_staff` en lugar de un subselect directo sobre `public.users`. Un subselect sobre la misma tabla dentro de una política provoca `infinite recursion detected in policy for relation "users"` en runtime; el helper lo evita (patrón recomendado por Supabase).
- **Sí:** Seed directo en `auth.users` con `pgcrypto` para el usuario staff. Reproducible, no depende del dashboard, y el trigger prueba que funciona end-to-end.
- **Sí:** `instance_id` fijo en el seed. Necesario para inserts directos en `auth.users` en entornos de seed; en producción Supabase lo gestiona.
- **Sí:** Setear a `''` las columnas string de `auth.users` en el seed (`email_change`, `email_change_token_new/current`, `phone`, `phone_change`, `phone_change_token`, `recovery_token`, `reauthentication_token`) y `is_super_admin = false`. GoTrue las escanea como strings no-nulas al hacer login; con NULL el signin falla con `500 Database error querying schema` (verificado en logs de auth: `sql: Scan error ... converting NULL to string is unsupported`).
- **Sí:** Regenerar tipos TypeScript en esta spec. Mantiene `types/database.types.ts` sincronizado con el schema real.
- **No:** Políticas INSERT/UPDATE/DELETE en `users`. El INSERT lo maneja el trigger; los demás van con specs de admin/gestión de usuarios.
- **No:** Trigger de `updated_at`. Va en otra spec cuando se implemente edición de perfiles.
- **No:** Enums restantes (`relationship_type`, `invitation_status`, etc.). Se crean en las specs de las tablas que los usan.
- **No:** Auth flows UI (login, middleware, refresh de sesión). Va en la SPEC 03 (login and activate) cuando se implemente.

## What is **not** in this spec

- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts`, etc.
- Enum types restantes (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Políticas INSERT/UPDATE/DELETE en `users`.
- Trigger de actualización de `updated_at`.
- Auth flows UI (login, logout, sesiones, middleware de refresh).
- Integración de Supabase en componentes UI existentes (feed, kids, modales).
- Edge Function de registro de padres vía invitación.

Cada uno de esos, si llega, va en su propia spec.
