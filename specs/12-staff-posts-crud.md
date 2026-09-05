# SPEC 12 — CRUD de publicaciones del staff: Server Actions + modal Crear/Editar + Feed real

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (home-feed), SPEC 06 (new-post-modal), SPEC 10 (children-crud), SPEC 09 (auth y tablas `rooms`/`children`)
> **Fecha:** 2026-09-05
> **Objetivo:** Implementar las operaciones CREATE, UPDATE y DELETE para publicaciones del staff mediante Server Actions, con soporte para imágenes (hasta 10, máx 3MB c/u), visibilidad diferenciada (público/privado), y alimentación del feed principal desde la base de datos.

## Scope

**In:**

- Crear migración SQL para las tablas `posts`, `post_children` y `post_photos`:
  - `posts`: id, author_id (FK users), room_id (FK rooms, nullable), type (enum post_type), title (nullable), body, is_public (boolean), published_at, created_at, updated_at
  - `post_children`: post_id + child_id (PK compuesta)
  - `post_photos`: id, post_id (FK posts), url, width, height, position, created_at
  - Índices en author_id, room_id, published_at, child_id
  - RLS habilitado con políticas para staff (CRUD completo) y padres (solo lectura de posts de sus hijos + anuncios)
- Crear migración SQL para bucket `post-photos` en Supabase Storage:
  - Púbico, tamaño máximo 3MB, formatos: jpeg, png, webp, gif
  - Políticas: staff puede subir/eliminar, todos pueden leer
- Crear `lib/actions/posts.ts` con Server Actions:
  - `createPost(input)` — INSERT en `posts` + `post_children` + upload fotos a Storage
  - `getPosts(options)` — SELECT con joins a author, room, children, photos; filtrado por room_id o child_id
  - `getPostById(id)` — SELECT de un post con todos los joins
  - `updatePost(input)` — UPDATE en `posts` + sincronizar `post_children` + gestionar fotos (subir/eliminar)
  - `deletePost(id)` — DELETE en `posts` (cascade) + eliminar fotos de Storage
- Actualizar `NewPostModal` para modo crear y modo editar:
  - Agregar campo título (opcional)
  - Agregar toggle de visibilidad (público/privado)
  - Integrar upload real de fotos con validación (3MB, formatos permitidos)
  - Preview de fotos seleccionadas antes de subir
  - Llamar a `createPost` o `updatePost` según el modo
  - Mostrar loading state durante la mutación
- Actualizar `PostCard` para mostrar datos reales:
  - Fotos reales desde BD en lugar de placeholder
  - Badge de visibilidad (público/privado)
  - Menú de opciones (editar/eliminar) solo para el autor
  - Nombre del autor real desde la BD
- Actualizar `app/page.tsx` para fetch real:
  - Reemplazar datos mock por llamada a `getPosts()`
  - Mantener layout existente (sidebar, mobile nav)
- Verificar `npm run lint` y `npx tsc --noEmit` sin errores.

**Out of scope (para specs futuras):**

- Reacciones (likes) funcionales
- Comentarios funcionales
- Notificaciones a staff o familias
- Paginación infinita o búsqueda server-side
- Programación de publicaciones (fecha futura)
- Borradores (todas las publicaciones se publican inmediatamente)
- Edición/eliminación por administradores de posts de otros staff

## Data model

### Enums

```sql
CREATE TYPE post_type AS ENUM (
  'meal', 'nap', 'activity', 'achievement', 'photo', 'announcement'
);
```

### Tabla `posts`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `author_id` | `uuid` FK → `users` | Staff que publica. ON DELETE CASCADE |
| `room_id` | `uuid` FK → `rooms` | Nullable — para anuncios de sala. ON DELETE SET NULL |
| `type` | `post_type` | `meal` / `nap` / `activity` / `achievement` / `photo` / `announcement` |
| `title` | `text` | Nullable (ej. "Anuncio general") |
| `body` | `text` | Descripción obligatoria |
| `is_public` | `boolean` | Default `true`. `true`=público, `false`=solo staff |
| `published_at` | `timestamptz` | Default `now()` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |

### Tabla `post_children`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `post_id` | `uuid` FK → `posts` | ON DELETE CASCADE |
| `child_id` | `uuid` FK → `children` | ON DELETE CASCADE |
| | | PK compuesta (`post_id`, `child_id`) |

### Tabla `post_photos`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `post_id` | `uuid` FK → `posts` | ON DELETE CASCADE |
| `url` | `text` | URL pública del archivo en Storage |
| `width` | `int` | Nullable — útil para vista a pantalla completa |
| `height` | `int` | Nullable — útil para vista a pantalla completa |
| `position` | `int` | Orden de la foto (0-indexed) |
| `created_at` | `timestamptz` | Default `now()` |

### Storage Bucket

| Campo | Valor |
| --- | --- |
| `id` | `post-photos` |
| `name` | `post-photos` |
| `public` | `true` |
| `file_size_limit` | `3145728` (3MB) |
| `allowed_mime_types` | `["image/jpeg", "image/png", "image/webp", "image/gif"]` |

### Tipos TypeScript (en `lib/actions/posts.ts`)

```ts
export type CreatePostInput = {
  type: string
  title?: string
  body: string
  room_id?: string
  is_public: boolean
  child_ids?: string[]
  photos?: File[]
}

export type UpdatePostInput = CreatePostInput & {
  id: string
  deleted_photo_ids?: string[]
}

export type PostWithDetails = {
  id: string
  author_id: string
  room_id: string | null
  type: post_type
  title: string | null
  body: string
  is_public: boolean
  published_at: string
  created_at: string
  updated_at: string
  author: { full_name: string; avatar_url: string | null }
  room: { name: string } | null
  children: { child: { id: string; full_name: string } }[]
  photos: { id: string; url: string; width: number | null; height: number | null; position: number }[]
}
```

## Implementation plan

1. **Crear migración de tablas.** Archivo `supabase/migrations/YYYYMMDDHHMMSS_create_posts_tables.sql` con enum `post_type`, tablas `posts`, `post_children`, `post_photos`, índices y políticas RLS. _Prueba: `supabase db reset` crea las tablas sin errores._

2. **Crear migración de storage.** Archivo `supabase/migrations/YYYYMMDDHHMMSS_create_post_photos_bucket.sql` con bucket `post-photos` y políticas. _Prueba: verificar bucket en Supabase Studio._

3. **Crear `lib/actions/posts.ts`** con las 5 Server Actions (`createPost`, `getPosts`, `getPostById`, `updatePost`, `deletePost`). Cada una usa `createClient()` de `lib/supabase/server`, ejecuta la operación y llama `revalidatePath`. _Prueba: revisar el SQL que genera cada action._

4. **Crear componente `PhotoUpload`.** Archivo `components/home/PhotoUpload.tsx`:
   - Props: `photos: File[]`, `onPhotosChange: (photos: File[]) => void`, `maxPhotos: number`, `existingPhotos?: Photo[]`, `onRemoveExisting?: (id: string) => void`
   - Drag & drop + click para seleccionar archivos
   - Preview de fotos seleccionadas con botón de eliminar
   - Validación: tamaño máximo 3MB, formatos permitidos
   - Mostrar error si archivo excede tamaño o formato inválido
   - _Prueba: seleccionar foto válida muestra preview; seleccionar foto > 3MB muestra error._

5. **Actualizar `NewPostModal`** para modo crear/editar:
   - Agregar prop opcional `post?: PostWithDetails` (si existe, modo edición)
   - Agregar campo título (input text, opcional)
   - Agregar toggle de visibilidad (público/privado)
   - Integrar componente `PhotoUpload`
   - Al guardar: llamar `createPost` o `updatePost` según el modo
   - Mostrar loading spinner durante la mutación
   - Precargar datos si modo edición
   - _Prueba: abrir modal vacío = crear; abrir con post = editar con datos precargados._

6. **Actualizar `PostCard`** para datos reales:
   - Importar tipo `PostWithDetails`
   - Mostrar fotos reales desde `post.photos` en lugar de `photoPlaceholder`
   - Agregar badge de visibilidad (público/privado)
   - Agregar menú de opciones (editar/eliminar) solo si `post.author_id === currentUserId`
   - Mostrar nombre del autor desde `post.author.full_name`
   - _Prueba: post con fotos muestra galería; post propio muestra menú de opciones._

7. **Actualizar `app/page.tsx`** para fetch real:
   - Importar `getPosts` desde `lib/actions/posts`
   - Reemplazar `posts` mock por `const posts = await getPosts()`
   - Pasar datos reales a `PostCard`
   - Mantener layout existente (sidebar, mobile nav)
   - _Prueba: feed muestra posts desde la BD, no mock._

8. **Lint + typecheck final.** Ejecutar `npm run lint` y `npx tsc --noEmit`. _Prueba: ambos pasan sin errores._

## Acceptance criteria

- [ ] Migración SQL crea tablas `posts`, `post_children`, `post_photos` con RLS habilitado
- [ ] Migración SQL crea bucket `post-photos` con políticas correctas
- [ ] `lib/actions/posts.ts` existe con `createPost`, `getPosts`, `getPostById`, `updatePost`, `deletePost`
- [ ] `createPost` inserta post + children + fotos en Supabase y revalida `/`
- [ ] `getPosts` retorna posts con author, room, children y photos (joins correctos)
- [ ] `getPostById` retorna un post con todos los joins
- [ ] `updatePost` actualiza post + sincroniza children + gestiona fotos (subir/eliminar)
- [ ] `deletePost` elimina post + fotos de Storage
- [ ] `NewPostModal` acepta prop `post?` y precarga el formulario en modo edición
- [ ] `NewPostModal` tiene campo título (opcional)
- [ ] `NewPostModal` tiene toggle de visibilidad (público/privado)
- [ ] `NewPostModal` integra upload de fotos con validación (3MB, formatos)
- [ ] `NewPostModal` muestra preview de fotos seleccionadas
- [ ] `NewPostModal` muestra loading durante la mutación
- [ ] `PhotoUpload` permite drag & drop y selección de archivo
- [ ] `PhotoUpload` muestra preview con opción de eliminar
- [ ] `PhotoUpload` valida tamaño (3MB) y muestra error si excede
- [ ] `PostCard` muestra fotos reales desde BD
- [ ] `PostCard` muestra badge de visibilidad (público/privado)
- [ ] `PostCard` muestra menú de opciones (editar/eliminar) solo para el autor
- [ ] `PostCard` muestra nombre del autor real
- [ ] `app/page.tsx` fetch posts reales desde `getPosts()`
- [ ] Feed muestra posts desde la BD, no datos mock
- [ ] Staff puede crear publicaciones con título, contenido, tipo y visibilidad
- [ ] Staff puede adjuntar hasta 10 fotos (máx 3MB c/u)
- [ ] Staff puede editar sus propias publicaciones
- [ ] Staff puede eliminar sus propias publicaciones
- [ ] Publicaciones públicas son visibles para todos
- [ ] Publicaciones privadas solo son visibles para staff
- [ ] Padres ven publicaciones de sus hijos + anuncios de sala
- [ ] `npm run lint` pasa sin errores
- [ ] `npx tsc --noEmit` pasa sin errores

## Decisions

- **Sí:** Server Actions en `lib/actions/posts.ts`. Convención de Next.js 16, separado de las páginas para reutilización.
- **Sí:** Bucket `post-photos` público. Las fotos de posts son visibles para todos los usuarios autenticados (padres ven fotos de sus hijos).
- **Sí:** Campo `is_public` para visibilidad. Simple, un boolean que controla si solo staff o todos ven el post.
- **Sí:** Upload de fotos en la Server Action. Mantiene la lógica en el servidor, seguro y consistente.
- **Sí:** Preview de fotos en el cliente antes de subir. Mejor UX, el usuario ve qué va a publicar.
- **Sí:** Reutilizar `NewPostModal` para crear y editar. Un solo componente, menos mantenimiento.
- **Sí:** `confirm()` nativo para eliminar post. Simple, sin dependencias extra.
- **Sí:** Cascade delete en tablas intermedias. `post_children` y `post_photos` se eliminan automáticamente al eliminar el post.
- **No:** Borradores. Todas las publicaciones se publican inmediatamente. Simplifica el flujo.
- **No:** Programación de publicaciones. Fuera de scope, se puede agregar después.
- **No:** Reacciones o comentarios funcionales. Van en specs separadas.
- **No:** Optimistic UI. La revalidación con `revalidatePath` es suficiente para el volumen actual.
- **No:** Paginación infinita. Se puede agregar después con cursor-based pagination.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Upload de fotos falla por tamaño o formato | Validar en el cliente antes de enviar; mostrar error claro |
| Storage bucket no existe al hacer upload | Crear bucket en migración SQL; verificar en Supabase Studio |
| RLS policies bloquean acceso a posts | Usar `get_my_role()` y `get_my_daycare_id()` como en otras tablas |
| `revalidatePath` no actualiza el cliente si hay cache stale | Usar `router.refresh()` desde el componente después de la action |
| Fotos grandes ralentizan el upload | Limitar a 3MB por archivo; mostrar progress indicator |
| Concurrent edits causan conflictos | Usar `updated_at` para detectar conflictos; mostrar error si post fue modificado |

## What is **not** in this spec

- Reacciones (likes) funcionales
- Comentarios funcionales
- Notificaciones a staff o familias
- Paginación infinita o búsqueda server-side
- Programación de publicaciones (fecha futura)
- Borradores
- Edición/eliminación por administradores de posts de otros staff
- Galería a pantalla completa de fotos
- Optimistic updates
- Drag & drop para reordenar fotos
- Recorte de imágenes

Cada uno de esos, si llega, va en su propia spec.
