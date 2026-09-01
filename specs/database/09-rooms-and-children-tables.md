# SPEC 09 — Tablas `rooms` y `children` + enums + seed + migración UI de /kids

> **Estado:** Implementado
> **Depende de:** SPEC 07 (tabla `daycares`, setup de Supabase y clientes JS); SPEC 08 (tabla `users`, enums, trigger de Auth)
> **Fecha:** 2026-08-31
> **Objetivo:** Crear las tablas `rooms` y `children` con el enum `child_status`, seed de 3 salas por defecto y políticas RLS, y migrar la página `/kids` para que lea datos reales de Supabase en vez del mock `app/_data/kids.ts`.

## Scope

**In:**

- Crear migración `create_rooms_and_children_tables` con:
  - Enum type `child_status` (`active`, `archived`).
  - Tabla `public.rooms` (id uuid PK, daycare_id FK → daycares, name text NOT NULL, created_at timestamptz).
  - Tabla `public.children` (id uuid PK, room_id FK → rooms nullable, full_name text NOT NULL, birth_date date, enrolled_at date, medical_notes text, allergy_tags text[], photo_consent boolean default true, status child_status default 'active', created_at timestamptz, updated_at timestamptz).
  - RLS habilitada en ambas tablas.
  - Políticas SELECT, INSERT, UPDATE, DELETE para `rooms` (solo staff/admin del mismo daycare vía `get_my_daycare_id()`).
  - Políticas SELECT, INSERT, UPDATE, DELETE para `children` (staff/admin del mismo daycare vía room → daycare_id).
  - Función trigger `update_updated_at()` + trigger `set_children_updated_at` sobre `children`.
- Actualizar `supabase/seed.sql` con 3 salas: "Soles", "Estrellas", "Lunas" (sin niños).
- Aplicar migración y seed al remoto vía `supabase db push`.
- Regenerar `types/database.types.ts` para incluir `rooms`, `children` y `child_status`.
- Migrar `app/kids/page.tsx` a Server Component que lee niños y salas de Supabase.
- Migrar `app/kids/[id]/page.tsx` a Server Component que lee el niño de Supabase por UUID.
- Verificar `npm run lint` y `npx tsc --noEmit` pasan sin errores.

**Out of scope (para specs futuras):**

- Tabla `parent_children` (vínculo padre ↔ niño) y sus políticas RLS.
- Tabla `invitations` (invitaciones) y el flujo de vinculación de padres.
- Migración del `LinkParentModal` para hacer INSERT real.
- Migración del feed (`app/page.tsx`) para leer de Supabase.
- Upload de fotos de perfil del niño.
- La funcionalidad de "Resumen del día" en el perfil del niño.
- Búsqueda server-side o paginación.
- La tabla `posts` y sus dependencias.
- Pantallas de familia (`familia-feed`, `familia-cuenta`).

## Data model

### Enums

```sql
CREATE TYPE public.child_status AS ENUM ('active', 'archived');
```

### Tabla `public.rooms`

```sql
CREATE TABLE public.rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id  uuid NOT NULL REFERENCES public.daycares(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rooms IS 'Salas de la guardería (Soles, Estrellas, Lunas, etc.).';

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
```

### Tabla `public.children`

```sql
CREATE TABLE public.children (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  full_name       text NOT NULL,
  birth_date      date NOT NULL,
  enrolled_at     date NOT NULL DEFAULT CURRENT_DATE,
  medical_notes   text NOT NULL DEFAULT '',
  allergy_tags    text[] NOT NULL DEFAULT '{}',
  photo_consent   boolean NOT NULL DEFAULT true,
  status          public.child_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.children IS 'Niños inscritos en la guardería.';

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
```

### Función trigger `update_updated_at`

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Políticas RLS — `rooms`

```sql
CREATE POLICY "rooms_select_same_daycare"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_insert_same_daycare"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_update_same_daycare"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id())
  WITH CHECK (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_delete_same_daycare"
  ON public.rooms
  FOR DELETE
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id());
```

### Políticas RLS — `children`

```sql
CREATE POLICY "children_select_same_daycare_staff"
  ON public.children
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = (
          SELECT r.daycare_id FROM public.rooms r WHERE r.id = children.room_id
        )
    )
  );

CREATE POLICY "children_insert_same_daycare"
  ON public.children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  );

CREATE POLICY "children_update_same_daycare"
  ON public.children
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  );

CREATE POLICY "children_delete_same_daycare"
  ON public.children
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND EXISTS (
          SELECT 1 FROM public.rooms r
          WHERE r.id = children.room_id
            AND r.daycare_id = u.daycare_id
        )
    )
  );
```

### Seed — 3 salas por defecto

```sql
INSERT INTO public.rooms (daycare_id, name)
SELECT id, 'Soles' FROM public.daycares WHERE name = 'Guardería Sala Soles';

INSERT INTO public.rooms (daycare_id, name)
SELECT id, 'Estrellas' FROM public.daycares WHERE name = 'Guardería Sala Soles';

INSERT INTO public.rooms (daycare_id, name)
SELECT id, 'Lunas' FROM public.daycares WHERE name = 'Guardería Sala Soles';
```

## Implementation plan

1. **Crear la migración.** Ejecutar `npx supabase migration new create_rooms_and_children_tables`. Editar el archivo generado con: enum `child_status`, tablas `rooms` y `children`, función `update_updated_at()`, trigger `set_children_updated_at`, y todas las políticas RLS. _Prueba: revisar el SQL manualmente._

2. **Actualizar el seed.** Añadir al final de `supabase/seed.sql` los 3 INSERTs de salas (Soles, Estrellas, Lunas) con `daycare_id` referenciando "Guardería Sala Soles". _Prueba: revisar que los INSERTs usan subselects correctos._

3. **Aplicar al remoto.** Ejecutar `npx supabase db push`. _Prueba: ejecutar `list_tables` desde MCP y verificar que `rooms` y `children` existen. Ejecutar `execute_sql` para verificar las 3 filas en `rooms`._

4. **Regenerar tipos TypeScript.** Ejecutar `npx supabase gen types typescript --linked > types/database.types.ts`. _Prueba: abrir el archivo y verificar que contiene `rooms`, `children` y `child_status`._

5. **Verificar advisors.** Ejecutar `get_advisors` desde MCP para confirmar que no hay warnings de seguridad sobre las tablas nuevas. _Prueba: sin advisors críticos._

6. **Migrar `/kids` page a Server Component.** Actualizar `app/kids/page.tsx`:
   - Eliminar `'use client'` y convertir en Server Component.
   - Consultar `rooms` de Supabase para obtener la lista de salas.
   - Consultar `children` con JOIN a `rooms` para obtener los niños agrupados por sala.
   - Pasar los datos como props a un componente cliente `KidsList` que maneje el buscador y el modal.
   - El componente `KidsList` recibe `rooms` y `children` como props, mantiene el `useState` para búsqueda y el modal.
   - _Prueba: `/kids` carga sin errores, muestra 0 niños (seed vacío), las 3 salas aparecen con contador 0._

7. **Migrar `/kids/[id]` page a Server Component.** Actualizar `app/kids/[id]/page.tsx`:
   - Eliminar `'use client'` y convertir en Server Component.
   - Consultar el niño por UUID de Supabase (con JOIN a `rooms` para el nombre de sala).
   - Si no existe, mostrar fallback.
   - Mantener el `LinkParentModal` como componente cliente con props.
   - _Prueba: `/kids/nonexistent-uuid` muestra "Niño no encontrado"; con un UUID válido muestra el perfil._

8. **Verificar AddKidModal.** Confirmar que el `AddKidModal` existente en `components/kids/AddKidModal.tsx` funciona con la nueva data. Si el dropdown de salas estaba hardcodeado, actualizarlo para recibir las salas como props. _Prueba: abrir el modal, el dropdown muestra Soles/Estrellas/Lunas._

9. **Lint + typecheck final.** Ejecutar `npm run lint` y `npx tsc --noEmit`. _Prueba: ambos pasan sin errores._

10. **Verificación end-to-end.** `npm run dev`, navegar a `/kids`, verificar que la página carga con las 3 salas y 0 niños. Comparar visualmente con `ninos.dc.html`. _Prueba: la UI es idéntica al mock pero con datos vacíos._

## Acceptance criteria

- [ ] Existe un archivo de migración `create_rooms_and_children_tables` con el SQL de enums, tablas, triggers y políticas.
- [ ] El enum `child_status` (`active`, `archived`) existe en el proyecto remoto.
- [ ] La tabla `public.rooms` existe con columnas: `id` (uuid PK), `daycare_id` (FK → daycares), `name` (text NOT NULL), `created_at` (timestamptz).
- [ ] La tabla `public.children` existe con columnas: `id` (uuid PK), `room_id` (FK → rooms nullable), `full_name` (text NOT NULL), ` birth_date` (date), `enrolled_at` (date), `medical_notes` (text), `allergy_tags` (text[]), `photo_consent` (boolean), `status` (child_status), `created_at`, `updated_at`.
- [ ] RLS está habilitada en `rooms` y `children`.
- [ ] Las políticas SELECT, INSERT, UPDATE, DELETE existen para `rooms` (solo staff/admin del mismo daycare).
- [ ] Las políticas SELECT, INSERT, UPDATE, DELETE existen para `children` (solo staff/admin del mismo daycare, vía room).
- [ ] El trigger `set_children_updated_at` existe sobre `children` (BEFORE UPDATE).
- [ ] `supabase/seed.sql` contiene los INSERT de las 3 salas: "Soles", "Estrellas", "Lunas".
- [ ] Las 3 filas de salas existen en la tabla `rooms` del remoto.
- [ ] No hay filas en `children` (seed vacío de niños).
- [ ] `types/database.types.ts` contiene `rooms`, `children` y `child_status`.
- [ ] `app/kids/page.tsx` es un Server Component que consulta `rooms` y `children` de Supabase.
- [ ] `app/kids/[id]/page.tsx` es un Server Component que consulta el niño por UUID de Supabase.
- [ ] La UI de `/kids` muestra las 3 salas con contador 0 niños cada una.
- [ ] La UI de `/kids` es visualmente idéntica al mock `ninos.dc.html`.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] `get_advisors` no reporta advisors críticos relacionados con las tablas nuevas.

## Decisions

- **Sí:** Dos tablas en una sola migración (`rooms` + `children`). Son dependientes entre sí (children FK → rooms) y se crean juntas naturalmente.
- **Sí:** Enum `child_status` creado ahora. El schema queda completo según el db-schema reference; evita crear el enum por separado después.
- **Sí:** `room_id` nullable en `children`. Permite que un niño no esté asignado a ninguna sala temporalmente.
- **Sí:** RLS con EXISTS anidado para `children`. La relación children → rooms → daycare_id es necesaria porque `children` no tiene `daycare_id` directo (sigue el db-schema).
- **Sí:** Trigger `update_updated_at` en `children`. Evita tener que setear `updated_at` manualmente en cada UPDATE.
- **Sí:** 3 salas por defecto: Soles, Estrellas, Lunas. Nombres consistentes con el mock existente (AddKidModal ya usa estos nombres).
- **Sí:** Seed sin niños. La spec pide explícitamente no ocupar ningún niño en la tabla.
- **Sí:** Migrar `/kids` a Server Components para leer de Supabase. Server Components son el patrón correcto en Next.js 16 para datos que no necesitan interactividad; el componente cliente `KidsList` maneja el estado del buscador y modal.
- **Sí:** No tocar `app/_data/kids.ts`. Se mantiene porque otros componentes (como `NewPostModal` de SPEC 06) lo usan para el feed.
- **No:** Tabla `parent_children` en esta spec. Merece su propia spec por las políticas RLS de padres y el flujo de vinculación.
- **No:** Tabla `invitations` en esta spec. Va con el flujo de onboarding de padres.
- **No:** Migrar el `LinkParentModal` para hacer INSERT real. Requiere `invitations` primero.
- **No:** Búsqueda server-side o paginación. La búsqueda frontend es suficiente para el volumen actual.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Las políticas RLS de `children` con EXISTS anidado pueden ser lentas con muchos registros | Crear índice en `rooms(daycare_id)` y usar `STABLE` en `get_my_daycare_id()`. Monitorear con `EXPLAIN` si hay degradación. |
| El `AddKidModal` tiene el dropdown de salas hardcodeado | Actualizar el modal para recibir `rooms` como props desde la página. Los 3 nombres coinciden con el seed. |
| `room_id` nullable puede causar que un niño no aparezca en ninguna sala | La política SELECT de staff permite ver niños con `room_id = NULL` (el EXISTS falla silenciosamente). Agregar un filtro visual en la UI si se desea. |
| Next.js 16 puede cambiar la firma de Server Components con params async | Verificar en `node_modules/next/dist/docs/` durante la implementación. |

## What is **not** in this spec

- Tabla `parent_children` (vínculo padre ↔ niño).
- Tabla `invitations` (invitaciones de padres).
- Migración del `LinkParentModal` para hacer INSERT real.
- Migración del feed para leer de Supabase.
- Upload de fotos de perfil.
- Resumen del día.
- Búsqueda server-side o paginación.
- Pantallas de familia.

Cada uno de esos, si llega, va en su propia spec.
