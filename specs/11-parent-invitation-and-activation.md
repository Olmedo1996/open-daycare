# SPEC 11 — Vinculación de padres: tablas + invitación por email (Resend) + activación de cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (daycares + setup Supabase); SPEC 08 (tabla `users`, trigger, `get_my_daycare_id()`); SPEC 09 (tablas `rooms`/`children`); SPEC 05 (`LinkParentModal`); SPEC 03 (`/activate`)
> **Fecha:** 2026-09-01
> **Objetivo:** Implementar la vinculación de padres de punta a punta: crear las tablas `invitations`/`parent_children` con sus enums y RPCs, enviar la invitación real por email con Resend desde `LinkParentModal`, y hacer funcional `/activate` para que el padre cree su cuenta con Supabase Auth y quede vinculado al niño.

## Scope

**In:**

- **Base de datos (migración `create_invitations_and_parent_children_tables`):**
  - Enum `relationship_type` (`father`, `mother`, `guardian`).
  - Enum `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`).
  - Tabla `public.invitations` (id, child_id, invited_by, full_name, email, relationship, code UNIQUE, status, expires_at, accepted_at, created_at).
  - Tabla `public.parent_children` (id, parent_id, child_id, relationship, created_at, UNIQUE(parent_id, child_id)).
  - RLS habilitada en ambas tablas con políticas SELECT/INSERT para `invitations` y SELECT para `parent_children`.
  - Función RPC `get_invitation_by_code(code, email)` — `SECURITY DEFINER`, ejecutable por `anon`/`authenticated`.
  - Función RPC `complete_invitation(code, email)` — `SECURITY DEFINER`, ejecutable por `authenticated`.
  - Seed: invitación pendiente (código `7K4P9`) + padre de prueba vinculado.
- **Email (Resend):**
  - Instalar `resend`; agregar `RESEND_API_KEY` a `.env` y `.env.template`.
  - Helper `lib/resend.ts` (`sendInvitationEmail`) con `from: onboarding@resend.dev`.
- **Invitación (server action):**
  - `createInvitation` en `app/kids/actions.ts`: genera código de 5 chars alfanuméricos, INSERT en `invitations` (status `pending`, `expires_at = now()+7 días`), envía email con código + enlace a `/activate?code=…&email=…`.
  - Actualizar `LinkParentModal`: recibe `childId`, quita la tarjeta de código hardcodeada, mapea Mamá/Papá/Tutor/a → mother/father/guardian, llama a `createInvitation`, muestra loading y cierra con toast al éxito.
  - Actualizar `KidProfile` para pasar `childId` y el toast.
- **Activación de cuenta:**
  - Funcionalizar `/activate`: leer `?code`/`?email`, mostrar la tarjeta de invitación con el nombre real del niño (vía RPC), y un form cliente con acción `activateAccount`.
  - Server action `activateAccount` en `lib/actions/activate.ts`: RPC `get_invitation_by_code` → `auth.signUp` (auto-confirmado, metadata role=parent) → RPC `complete_invitation` → redirect a `/login`.
  - Manejo de errores: código inválido/vencido, email que no coincide, email ya registrado, contraseña débil.
- Regenerar `types/database.types.ts` y verificar `npm run lint` / `npx tsc --noEmit`.

**Out of scope (para specs futuras):**

- Pantallas de familia (feed familiar) y redirección post-login por rol.
- Mostrar padres vinculados en el perfil del niño (hoy muestra "Sin padres vinculados").
- Re-envío, cancelación o expiración automática de invitaciones y su gestión UI.
- Políticas UPDATE/DELETE de `invitations`.
- Confirmación de email por correo (se desactiva en Supabase Auth).
- Plantilla de email con React Email (HTML plano).

## Data model

### Enums

```sql
CREATE TYPE public.relationship_type  AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
```

### Tabla `public.invitations`

```sql
CREATE TABLE public.invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  invited_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  relationship  public.relationship_type NOT NULL,
  code          text NOT NULL UNIQUE,
  status        public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz NOT NULL,
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
```

### Tabla `public.parent_children`

```sql
CREATE TABLE public.parent_children (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship  public.relationship_type NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
```

### Políticas RLS

```sql
-- invitations: staff/admin del mismo daycare
CREATE POLICY "invitations_select_staff" ON public.invitations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('staff','admin')
      AND u.daycare_id = public.get_my_daycare_id()
  ));

CREATE POLICY "invitations_insert_staff" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('staff','admin'))
    AND EXISTS (
      SELECT 1 FROM public.children c JOIN public.rooms r ON r.id = c.room_id
      WHERE c.id = child_id AND r.daycare_id = public.get_my_daycare_id()
    )
  );

-- parent_children
CREATE POLICY "parent_children_select_staff" ON public.parent_children
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('staff','admin')
      AND u.daycare_id = public.get_my_daycare_id()
  ));

CREATE POLICY "parent_children_select_self" ON public.parent_children
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- Sin política INSERT: los vínculos se crean vía la RPC complete_invitation (SECURITY DEFINER).
```

### Funciones RPC

```sql
-- Lee una invitación por código+email (sin sesión). Devuelve datos para /activate y el signup.
CREATE OR REPLACE FUNCTION public.get_invitation_by_code(p_code text, p_email text)
RETURNS TABLE (
  id uuid, child_id uuid, full_name text, email text,
  relationship public.relationship_type, daycare_id uuid,
  child_name text, room_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.id, i.child_id, i.full_name, i.email, i.relationship,
         u.daycare_id, c.full_name, rm.name
  FROM public.invitations i
  JOIN public.users u ON u.id = i.invited_by
  JOIN public.children c ON c.id = i.child_id
  LEFT JOIN public.rooms rm ON rm.id = c.room_id
  WHERE i.code = upper(p_code)
    AND lower(i.email) = lower(p_email)
    AND i.status = 'pending'
    AND i.expires_at > now()
$$;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_code(text, text) TO anon, authenticated;

-- Vincula al padre (auth.uid()) con el niño y marca la invitación como accepted.
CREATE OR REPLACE FUNCTION public.complete_invitation(p_code text, p_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT i.* INTO inv
  FROM public.invitations i
  WHERE i.code = upper(p_code)
    AND lower(i.email) = lower(p_email)
    AND i.status = 'pending'
    AND i.expires_at > now()
  FOR UPDATE;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_found';
  END IF;

  INSERT INTO public.parent_children (parent_id, child_id, relationship)
  VALUES (auth.uid(), inv.child_id, inv.relationship)
  ON CONFLICT (parent_id, child_id) DO NOTHING;

  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = inv.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_invitation(text, text) TO authenticated;
```

### Seed

```sql
-- Invitación pendiente para un niño existente (email aún sin cuenta).
INSERT INTO public.invitations (child_id, invited_by, full_name, email, relationship, code, status, expires_at)
VALUES (
  (SELECT id FROM public.children WHERE full_name = 'Blanca Duarte'),
  (SELECT id FROM auth.users WHERE email = 'staff@opendaycare.test'),
  'Lucía Fernández', 'lucia.fernandez@gmail.com', 'mother', '7K4P9', 'pending', now() + interval '7 days'
);

-- Padre de prueba: auth.users + (trigger crea public.users) + vínculo.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, email_confirmed_at, encrypted_password,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token, recovery_token, reauthentication_token, confirmation_token,
  is_super_admin, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'padre@opendaycare.test', now(), crypt('padre12345', gen_salt('bf')),
  '', '', '', '', '', '', '', '', '', false, '{}'::jsonb,
  jsonb_build_object(
    'daycare_id', (SELECT id FROM public.daycares WHERE name = 'Guardería Sala Soles'),
    'role', 'parent', 'full_name', 'Lucía Parent'
  ),
  now(), now()
);

INSERT INTO public.parent_children (parent_id, child_id, relationship)
VALUES (
  (SELECT id FROM public.users WHERE full_name = 'Lucía Parent'),
  (SELECT id FROM public.children WHERE full_name = 'Diego Olmedo'),
  'mother'
);
```

### Estructuras TypeScript (client)

```ts
// createInvitation input
type CreateInvitationInput = {
  childId: string;
  parentName: string;
  email: string;
  relationship: 'mother' | 'father' | 'guardian';
};

// activateAccount estado de error (client-side)
type ActivateState = { error: string | null };
```

## Implementation plan

1. **Crear la migración.** Ejecutar `npx supabase migration new create_invitations_and_parent_children_tables`. Editar el archivo con: enums, tablas, RLS, políticas y las dos RPC. _Prueba: revisar el SQL manualmente._

2. **Actualizar `supabase/seed.sql`.** Añadir la invitación pendiente y el padre de prueba. _Prueba: revisar los subselects y que no choquen con el seed existente._

3. **Aplicar al remoto y regenerar tipos.** Ejecutar `npx supabase db push` y `npx supabase gen types typescript --linked > types/database.types.ts`. _Prueba: `list_tables` muestra las tablas nuevas; el archivo de tipos las incluye._

4. **Instalar y configurar Resend.** `pnpm add resend`; agregar `RESEND_API_KEY` a `.env`/`.env.template`; crear `lib/resend.ts` con `sendInvitationEmail({ to, parentName, childName, code, activateUrl })`. _Prueba: llamar manualmente y recibir el email en el correo verificado del sandbox._

5. **`createInvitation` en `app/kids/actions.ts`.** Generar código (5 chars, mayúsculas, reintentar en colisión UNIQUE), INSERT en `invitations` con `invited_by = auth.uid()`, enviar email, `revalidatePath`. _Prueba: revisar SQL + email recibido._

6. **Actualizar `LinkParentModal`.** Prop `childId`; quitar tarjeta de código; mapear rol; submit → `createInvitation` con loading; al éxito cierra y dispara toast. _Prueba: enviar invitación real desde la UI._

7. **Actualizar `KidProfile`.** Pasar `childId` al modal y mostrar toast "Invitación enviada" al éxito. Reemplazar el `onLink={() => {}}` no-op. _Prueba: enviar desde la UI muestra el toast y cierra el modal._

8. **Funcionalizar `/activate`.** Crear `app/(auth)/activate/activate-form.tsx` (`'use client'`): lee `code`/`email` de `useSearchParams`; la página (Server Component) llama la RPC `get_invitation_by_code` para renderizar la tarjeta con el nombre real del niño; inputs código/email/contraseña + botón con `useFormStatus`. _Prueba: `/activate?code=7K4P9&email=lucia.fernandez@gmail.com` muestra "Blanca Duarte · Sala Soles"._

9. **`activateAccount` en `lib/actions/activate.ts`.** RPC `get_invitation_by_code` → `auth.signUp` (metadata role=parent) → RPC `complete_invitation` → `redirect('/login')`. Capturar errores y devolver `{ error }`. _Prueba: activar una cuenta completa el flujo._

10. **Verificación end-to-end.** Staff envía invitación → email llega al sandbox → abrir enlace → `/activate` precargado → setear contraseña → cuenta creada + vínculo + invitación `accepted` → redirect `/login` → login del padre. Ejecutar `npm run lint` y `npx tsc --noEmit` y `get_advisors`.

## Acceptance criteria

- [ ] El enum `relationship_type` (`father`, `mother`, `guardian`) y `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) existen en el remoto.
- [ ] La tabla `public.invitations` existe con `code` UNIQUE y RLS habilitada.
- [ ] La tabla `public.parent_children` existe con UNIQUE (`parent_id`, `child_id`) y RLS habilitada.
- [ ] `get_invitation_by_code(text, text)` y `complete_invitation(text, text)` existen, son `SECURITY DEFINER` y están otorgadas a `anon`/`authenticated` respectivamente.
- [ ] Las políticas SELECT/INSERT de `invitations` y SELECT de `parent_children` existen.
- [ ] El seed dejó 1 invitación `pending` y 1 vínculo `parent_children` en el remoto.
- [ ] `types/database.types.ts` incluye las tablas y enums nuevos.
- [ ] `resend` está instalado y `RESEND_API_KEY` definida en `.env` y `.env.template`.
- [ ] `lib/resend.ts` expone `sendInvitationEmail` con `from: onboarding@resend.dev`.
- [ ] `createInvitation` genera un código de 5 chars alfanuméricos, inserta en `invitations` (pending, vence en 7 días) y envía el email con código + enlace a `/activate`.
- [ ] `LinkParentModal` ya no muestra la tarjeta de código hardcodeada (`7K4P9`).
- [ ] Mamá/Papá/Tutor/a se mapean a mother/father/guardian.
- [ ] Al enviar una invitación válida, el modal cierra y aparece un toast "Invitación enviada".
- [ ] Al enviar, aparece loading en el botón (sin doble submit).
- [ ] `/activate?code=…&email=…` muestra la tarjeta de invitación con el nombre real del niño y la sala.
- [ ] Con código/email inválidos o vencidos, `/activate` muestra un error claro.
- [ ] Al activar con contraseña válida, se crea la cuenta en `auth.users` (role `parent`, email auto-confirmado) y su fila en `public.users`.
- [ ] Tras activar, existe un vínculo en `parent_children` y la invitación queda `accepted` con `accepted_at`.
- [ ] Tras activar, redirige a `/login`.
- [ ] El padre puede iniciar sesión con el email/contraseña elegidos.
- [ ] Email ya registrado muestra un error y no rompe el flujo.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan.
- [ ] `get_advisors` no reporta críticos sobre las tablas nuevas.

## Decisions

- **Sí:** Un solo spec que cubre DB + email + activación. El flujo de vinculación es un único recorrido de usuario y las partes dependen entre sí.
- **Sí:** Dos tablas en una sola migración. Son dependientes entre sí y se crean juntas naturalmente.
- **Sí:** RPC `SECURITY DEFINER` en vez de exponer `service_role` al cliente. Es el patrón recomendado para validar invitaciones antes de que exista la sesión.
- **Sí:** `get_invitation_by_code` ejecutable por `anon` (solo devuelve la invitación pendiente); `complete_invitation` solo por `authenticated` (usa `auth.uid()`).
- **Sí:** El INSERT en `parent_children` solo vía RPC. El padre no inserta vínculos directamente.
- **Sí:** `daycare_id` se resuelve desde `invited_by` (el staff) en la RPC. Es más confiable que vía `room_id` (nullable).
- **Sí:** Código de 5 chars alfanuméricos, `UNIQUE`, expira en 7 días. Coincide con el mock previo (`7K4P9`).
- **Sí:** Enviar email con código **y** enlace precargado a `/activate`. Menos fricción; el código queda visible como respaldo.
- **Sí:** `from: onboarding@resend.dev`. Sandbox de Resend; solo llega al email verificado de la cuenta.
- **Sí:** `signUp` con email auto-confirmado. Se desactiva "Confirm email" en Supabase Auth (decisión de proyecto, demo de un solo daycare).
- **Sí:** `daycare_id`/`full_name` en `raw_user_meta_data` para que el trigger `handle_new_user` (SPEC 08) cree el perfil con `role = 'parent'`.
- **Sí:** Redirect a `/login` tras activar. Las pantallas de familia no existen; el padre inicia sesión manualmente.
- **Sí:** Quitar la tarjeta de código del modal. El código se genera server-side y solo se comparte por email (el mock de SPEC 05 ya no aplica).
- **Sí:** Seed de invitación con email sin cuenta (`lucia.fernandez@gmail.com`) para probar el flujo de activación; el padre seed usa otro email para no chocar con el signup.
- **No:** Políticas UPDATE/DELETE en `invitations`. No hay UI de cancelación aún.
- **No:** Confirmación de email por correo (doble paso).
- **No:** Redirección post-login por rol (el padre cae en `/`, feed de staff, hasta que exista el feed familiar).
- **No:** Plantilla con React Email; se usa un HTML plano en el body de Resend.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| RPC `SECURITY DEFINER` ejecutable por `anon` es superficie de ataque | `search_path = public`, retorno acotado a invitaciones `pending` no expiradas; validar con advisors |
| `complete_invitation` corrida dos veces crea vínculo duplicado | `ON CONFLICT (parent_id, child_id) DO NOTHING` + validación de estado `pending` |
| `room_id` NULL rompe el preview de `/activate` | `LEFT JOIN rooms` y `daycare_id` tomado de `invited_by`, no de la sala |
| Sandbox de Resend solo entrega al email verificado de la cuenta | Documentarlo; para probar, invitar a ese mismo email |
| Colisión de código UNIQUE al generarlo | Reintentar generación hasta insertar sin error |
| Email de invitación ya registrado en Auth | Capturar error de `signUp` y mostrar "este email ya tiene cuenta" |
| Firmas de Server Actions/redirect en Next 16 | Verificar en `node_modules/next/dist/docs/` durante la implementación |

## What is **not** in this spec

- Feed familiar y redirección post-login por rol.
- Mostrar padres vinculados en el perfil del niño.
- Reenvío, cancelación o expiración automática de invitaciones.
- Confirmación de email por correo.
- Plantilla de email con React Email.
- Políticas UPDATE/DELETE de `invitations`.

Cada uno de esos, si llega, va en su propia spec.
