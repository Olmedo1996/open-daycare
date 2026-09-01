# SPEC 10 — CRUD de niños: Server Actions + modal Crear/Editar + Eliminar

> **Estado:** Aprobado
> **Depende de:** SPEC 09 (tablas `rooms` y `children`, migración UI de `/kids`)
> **Fecha:** 2026-08-31
> **Objetivo:** Implementar las operaciones CREATE, UPDATE y DELETE para la tabla `children` mediante Server Actions, reutilizando el modal `AddKidModal` en modo crear/editar y agregando eliminación desde el perfil.

## Scope

**In:**

- Crear `app/kids/actions.ts` con Server Actions:
  - `createChild(data)` — INSERT en `children`.
  - `updateChild(id, data)` — UPDATE en `children`.
  - `deleteChild(id)` — DELETE en `children`.
- Actualizar `AddKidModal` para soportar modo crear y modo editar:
  - Recibe `child?: Child` opcional. Si existe, precarga el formulario y hace UPDATE al guardar. Si no, hace INSERT.
  - El dropdown de sala ahora usa `room_id` (uuid) en vez de `name` (text).
  - Convertir `allergy_tags` de texto libre a `text[]` via split por coma + trim + lowercase.
  - Convertir `birthDate` de `dd/mm/aaaa` a formato ISO (`YYYY-MM-DD`) para Supabase.
- Agregar botón "Editar" en `KidProfile` que abre `AddKidModal` en modo edición.
- Agregar botón "Eliminar" en `KidProfile` con `confirm()` nativo antes de ejecutar `deleteChild`.
- After mutation, usar `router.refresh()` para revalidar los datos.
- Verificar `npm run lint` y `npx tsc --noEmit` sin errores.

**Out of scope (para specs futuras):**

- Upload de foto del niño.
- Tabla `parent_children` y vinculación de padres.
- Paginación o búsqueda server-side.

## Data model

No introduce nuevas tablas. Reutiliza `children` de SPEC 09.

Server Actions en `app/kids/actions.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChild(data: { full_name: string; birth_date: string; room_id: string; allergy_tags?: string[]; medical_notes?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').insert({
    full_name: data.full_name,
    birth_date: data.birth_date,
    room_id: data.room_id || null,
    allergy_tags: data.allergy_tags ?? [],
    medical_notes: data.medical_notes ?? '',
  })
  if (error) throw error
  revalidatePath('/kids')
}

export async function updateChild(id: string, data: { full_name: string; birth_date: string; room_id: string; allergy_tags?: string[]; medical_notes?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').update({
    full_name: data.full_name,
    birth_date: data.birth_date,
    room_id: data.room_id || null,
    allergy_tags: data.allergy_tags ?? [],
    medical_notes: data.medical_notes ?? '',
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/kids')
  revalidatePath(`/kids/${id}`)
}

export async function deleteChild(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/kids')
}
```

## Implementation plan

1. **Crear `app/kids/actions.ts`** con las 3 Server Actions (`createChild`, `updateChild`, `deleteChild`). Cada una usa `createClient()` de `lib/supabase/server`, ejecuta la operación y llama `revalidatePath`. _Prueba: revisar el SQL que genera cada action._

2. **Actualizar `AddKidModal`** para modo crear/editar:
   - Agregar prop opcional `child?: Child`.
   - Si `child` existe, precargar todos los campos al montar.
   - El dropdown de sala usa `r.id` como value en vez de `r.name`.
   - Convertir `allergy_tags` de `text[]` a string para el input (join por coma).
   - Al guardar: convertir fecha `dd/mm/aaaa` → ISO, split de alergias, llamar `createChild` o `updateChild` según el modo.
   - Mostrar loading state durante la mutación.
   - _Prueba: abrir modal vacío = crear; abrir con child = editar con datos precargados._

3. **Actualizar `KidProfile`** (components/kids/KidProfile.tsx):
   - Importar `AddKidModal` y `deleteChild`.
   - Agregar estado `editingKid` para controlar el modal en modo edición.
   - Botón "Editar" abre `AddKidModal` con `child={kid}`.
   - Botón "Eliminar" ejecuta `confirm()` y luego `deleteChild(kid.id)`, redirigiendo a `/kids`.
   - _Prueba: editar precarga el modal; eliminar redirige a la lista._

4. **Actualizar `KidsList`** para pasar `onEdit` callback al `KidCard` (o eliminar el link directo y manejar todo desde `KidProfile`). _Prueba: desde la lista se puede navegar al perfil._

5. **Lint + typecheck final.** Ejecutar `npm run lint` y `npx tsc --noEmit`. _Prueba: ambos pasan sin errores._

## Acceptance criteria

- [ ] `app/kids/actions.ts` existe con `createChild`, `updateChild` y `deleteChild`.
- [ ] `createChild` inserta un niño en Supabase y revalida `/kids`.
- [ ] `updateChild` actualiza un niño existente y revalida `/kids` y `/kids/[id]`.
- [ ] `deleteChild` elimina un niño y revalida `/kids`.
- [ ] `AddKidModal` acepta prop `child?` y precarga el formulario en modo edición.
- [ ] El dropdown de sala usa `room_id` (uuid) en vez de `name`.
- [ ] `allergy_tags` se convierte de string libre a `text[]` (split por coma, trim, lowercase).
- [ ] La fecha `dd/mm/aaaa` se convierte a ISO antes de enviar a Supabase.
- [ ] El botón "Editar" en `KidProfile` abre el modal con los datos del niño.
- [ ] El botón "Eliminar" en `KidProfile` muestra confirmación y ejecuta `deleteChild`.
- [ ] Después de crear/editar/eliminar, la UI se actualiza sin recarga manual.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.

## Decisions

- **Sí:** Server Actions en `app/kids/actions.ts`. Convención de Next.js 16, cerca de las páginas que las usan.
- **Sí:** Reusar `AddKidModal` para crear y editar. Un solo componente, menos mantenimiento.
- **Sí:** `confirm()` nativo para eliminar. Simple, sin dependencias extra. Se puede mejorar después con un modal custom.
- **Sí:** `router.refresh()` después de cada mutación. Revalidación automática de Server Components.
- **No:** Página separada de edición. El modal es suficiente para los campos actuales.
- **No:** Optimistic UI. La revalidación con `revalidatePath` es suficiente para el volumen actual.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `revalidatePath` no actualiza el cliente si hay cache stale | Usar `router.refresh()` desde el componente después de la action |
| `birth_date` en formato incorrecto | Validar en el modal antes de enviar; usar `isValidDate` existente |
| `allergy_tags` vacío causa array `{}` en vez de `{}` | Default a `{}` en la action si el array está vacío |

## What is **not** in this spec

- Upload de foto del niño.
- Tabla `parent_children` y vinculación de padres.
- Paginación o búsqueda server-side.
- Modal custom de confirmación para eliminar.
- Optimistic updates.
