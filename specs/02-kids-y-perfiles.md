# SPEC 02 — Gestión de niños y perfil

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-08-19
> **Objetivo:** Implementar las pantallas Niños (`/kids`) y Perfil de niño (`/kids/[slug]`) de `references/pantallas/ninos.dc.html` y `perfil-nino.dc.html`, con datos mock y reutilizando el shell y los componentes compartidos de SPEC 01.

## Scope

**In:**

- `/kids`: grilla de niños (2 columnas), búsqueda en vivo, sección "SALA SOLES · 8 niños", botón "Agregar niño" inerte, sidebar con Niños activo.
- `/kids/[slug]`: perfil con breadcrumb "Volver a Niños", avatar grande, nombre, edad/sala, botón "Editar" inerte, banner de alergias (solo si hay notas), filas nacimiento/sala/ingreso, botón "Resumen del día" inerte, tarjeta "PADRES VINCULADOS" con estado por padre, link "Vincular otro padre" inerte.
- `AppShell` compartido en `shared/` que compone `Sidebar` + `MobileHeader` + `<main>`; refactor de `app/page.tsx` para usarlo.
- Nav real parcial: Feed → `/`, Niños → `/kids`; item activo según ruta (incluye `/kids/[slug]`). Avisos y Mi cuenta siguen inertes.
- Datos mock en `app/data/kids.ts`: tipos `Kid`, `Parent` y 8 niños con perfil completo.
- Búsqueda por nombre en vivo (client-side).
- Slug kebab-case y `notFound()` para slugs inexistentes.
- Tokens nuevos en `@theme`, iconos nuevos, componente `Pill`, `Avatar` extendido con paleta.
- Responsive bajo `lg`: grilla 1 columna; perfil apila las columnas; drawer existente.

**Out of scope (para specs futuros):**

- Agregar/editar niño (`agregar-nino.dc.html`) — botones "Agregar niño" y "Editar" inertes.
- Vincular padre (`vincular-padre.dc.html`) — link inerte.
- Resumen del día (`resumen-dia.dc.html`) — botón inerte.
- Pantallas Avisos y Mi cuenta (nav inertes).
- Autenticación, base de datos, API routes.
- Acciones reales sobre padres (aceptar/revocar invitación).

## Modelo de datos

```ts
// app/data/kids.ts
export type ParentStatus = "active" | "pending";

export type ParentTone = "violet" | "steel";

export type Parent = {
  name: string;        // "Lucía Fernández"
  role: string;        // "Mamá" | "Papá" — copy visible en español
  status: ParentStatus; // active → "activa" + pill ACTIVA; pending → "invitación enviada" + pill PENDIENTE
  tone: ParentTone;
};

export type KidAvatarTone = "sky" | "rose" | "mint" | "gold" | "violet";
export type KidPill = "danger" | "link" | null; // MANÍ/LACTOSA, VINCULAR, o chevron

export type Kid = {
  slug: string;          // kebab-case: "mateo-fernandez"
  name: string;          // "Mateo Fernández"
  avatarTone: KidAvatarTone;
  ageLabel: string;      // "3 años"
  pill: KidPill;         // null → chevron
  pillLabel?: string;    // "MANÍ" | "LACTOSA" | "VINCULAR" cuando pill no es null
  notes?: string;        // texto del banner "Alergias y notas" (opcional)
  birthDate: string;     // "12 mar 2022"
  room: string;          // "Soles"
  enrollment: string;    // "feb 2025"
  parents: Parent[];
};
```

Convenciones: el subtítulo de la tarjeta se deriva de `parents.length` ("sin padres vinculados" / "1 padre vinculado" / "N padres vinculados"); el contador "8 niños" se deriva de `kids.length`; nomenclatura interna en inglés con copy visible en español (`pill` define el tono, `pillLabel` el texto: "MANÍ"/"LACTOSA" → danger, "VINCULAR" → link; `active` → "ACTIVA", `pending` → "PENDIENTE"). Sala = "Soles" para los 8. Solo Mateo tiene perfil renderizado en el comp; el resto se inventa siguiendo el mismo patrón.

## Plan de implementación

1. `app/globals.css`: agregar tokens en `@theme` — paleta avatares (`rose-bg/#c44a7a`, `mint-bg/#3e8b62`, `gold-bg/#9a7b1e`, `violet-bg/#7b5fc0`, `steel-bg/#a9c7e8`), pills (`peanut-bg/#d9684a`, `vincular-bg/#c56486`, `pending-bg/#9a7b1e`), banner alergia (`#fbdad6`, `#f4a8a0`, `#c5413a`, `#b25249`), hover tarjeta (`#f2a78e`). Manual: `pnpm dev` compila.
2. `app/components/shared/icons.tsx`: agregar `ChevronRightIcon`, `SearchIcon`, `AlertIcon`, `EditIcon` (SvgIcon existente). Manual: `pnpm exec tsc --noEmit`.
3. `app/components/shared/nav-items.ts`: `NavItem` gana `href: string`; Feed `/`, Niños `/kids`, Avisos y Mi cuenta `#`; se elimina el campo `active` hardcodeado.
4. `app/data/kids.ts`: tipos `Kid`, `Parent`, `ParentStatus`, `ParentTone`, `KidAvatarTone`, `KidPill` y array `kids` con los 8 niños del comp y sus perfiles (Mateo con datos exactos del comp).
5. `app/components/shared/Avatar.tsx`: extender `AvatarTone` con la paleta de niños (`sky/rose/mint/gold/violet`) y de padres (`violet/steel`); ampliar `TONE_CLASSES`. Manual: `/` sigue igual (tonos existentes intactos).
6. `app/components/shared/Pill.tsx`: componente genérico `{ label, tone }` con tonos `danger | link | active | pending`. Manual: tsc.
7. `app/components/shared/Sidebar.tsx` y `MobileHeader.tsx`: aceptar prop `activePath`; renderizar `item.href`; activo si `activePath === href` o `activePath.startsWith(href + "/")`.
8. `app/components/shared/AppShell.tsx`: compone `Sidebar` + `MobileHeader` + `<main>` (props `activePath`, `maxWidth`); refactorizar `app/page.tsx` (`maxWidth={760}`, `activePath="/"`). Manual: `/` visualmente idéntico al de SPEC 01.
9. `app/components/kids/KidCard.tsx`: tarjeta presentacional (Avatar con tone, nombre, subtítulo derivado, pill o chevron, hover `#f2a78e`/`translateY(-2px)`) enlazando a `/kids/{slug}`.
10. `app/components/kids/SearchBox.tsx`: client component con `useState`; input "Buscar niño…", filtro por nombre insensible a mayúsculas, encabezado de sección "SALA SOLES · 8 niños" y grilla de `KidCard` (1 col <lg, 2 col ≥lg).
11. `app/kids/page.tsx`: `AppShell` (`activePath="/kids"`, `maxWidth={880}`), header (eyebrow "GESTIÓN", h1 "Niños", botón "Agregar niño" inerte) y `SearchBox`. Manual: comparación con `ninos.dc.html` a 1280px y 375px.
12. `app/components/kids/`: `AllergyNotes` (banner con AlertIcon, título "Alergias y notas", texto; se renderiza solo si `notes`), `KidInfoCard` (filas nacimiento/sala/ingreso), `ParentList` (tarjeta "PADRES VINCULADOS", filas con Avatar+Pill, link "Vincular otro padre" con PlusIcon). Manual: tsc.
13. `app/kids/[slug]/page.tsx`: `generateStaticParams` desde `kids`, lookup por `params.slug`, `notFound()` si no existe, `AppShell` (`activePath="/kids"`, `maxWidth={820}`), breadcrumb a `/kids`, header (Avatar 84px, nombre, "N años · Sala Soles", Editar inerte), `AllergyNotes`, `KidInfoCard`, columna derecha (botón oscuro "Resumen del día" con SunIcon, `ParentList`). Manual: `/kids/mateo-fernandez` vs comp; slug inválido → 404. Verificar convención de params tipados en `node_modules/next/dist/docs/` (Next 16).

## Criterios de aceptación

- [x] `/kids` y `/kids/[slug]` renderizan sin errores de consola con `pnpm dev`.
- [x] A ≥1024px `/kids` es idéntico al comp: sidebar con Niños activo (`#FBE3D8`/`#D9583C`), eyebrow "GESTIÓN", título "Niños", botón gradiente "Agregar niño", input de búsqueda, sección "SALA SOLES · 8 niños", grilla de 2 columnas.
- [x] Las 8 tarjetas muestran avatar con inicial y color del comp (Mateo sky, Sofía rose, Benjamín mint, Valentina gold, Tomás violet, Emma rose, Lucas sky, Olivia mint), "N años · X padres vinculados" y pill/chevron correctos (MANÍ Mateo, VINCULAR Valentina, LACTOSA Tomás; chevron el resto).
- [x] Tipear en "Buscar niño…" filtra la grilla por nombre (insensible a mayúsculas); vacío restaura las 8.
- [x] A <1024px la grilla es 1 columna y el drawer abre con Niños activo.
- [x] Clic en una tarjeta navega a `/kids/{slug}` y el sidebar mantiene Niños activo.
- [x] `/kids/mateo-fernandez` es idéntico al comp: volver a Niños, avatar 84px, "Mateo Fernández", "3 años · Sala Soles", Editar, banner de alergias con texto exacto, filas "12 mar 2022"/"Soles"/"feb 2025", botón oscuro "Resumen del día", PADRES VINCULADOS con Lucía ACTIVA y Diego PENDIENTE, link "Vincular otro padre".
- [x] Los otros 7 slugs abren un perfil coherente; el banner de alergias solo aparece cuando el niño tiene `notes`.
- [x] Slug inexistente → 404 de Next (`notFound()`).
- [x] El feed `/` queda visualmente idéntico tras el refactor de AppShell.
- [x] Links fuera de alcance no navegan: Agregar niño, Editar, Resumen del día, Vincular otro padre, Avisos, Mi cuenta (sin 404).
- [x] `pnpm lint`, `pnpm exec tsc --noEmit` y `pnpm build` pasan.
- [x] Estructura: `app/components/shared/` (AppShell, Sidebar, MobileHeader, Avatar, Pill, Badge intacto, nav-items, icons) y `app/components/kids/` (KidCard, SearchBox, AllergyNotes, KidInfoCard, ParentList); datos en `app/data/kids.ts`.
- [x] Solo `SearchBox` y `MobileHeader` son client components; el resto server.

## Decisiones

- **Sí:** `AppShell` compartido con refactor del feed — elimina la duplicación de shell entre 3 páginas.
- **Sí:** nav real parcial (Feed `/`, Niños `/kids`; Avisos y Mi cuenta inertes `#`) — evita 404 y marca el activo por ruta con `startsWith` para cubrir los perfiles.
- **Sí:** búsqueda en vivo client-side — el comp muestra un input real y es trivial.
- **Sí:** mock completo para los 8 niños — todas las tarjetas enlazan a un perfil funcional.
- **Sí:** slug kebab-case + `notFound()` — URLs legibles y degradación limpia.
- **Sí:** `Pill` nueva sin tocar `Badge` — el Badge del feed lleva punto y su tipo está acoplado a `PostType`; no se arriesga el feed.
- **Sí:** `pillLabel` además de `pill` — el modelo original (`danger`/`link`/`null`) no distinguía MANÍ de LACTOSA; el label resuelve el texto visible sin duplicar el tono.
- **Sí:** `Avatar` extendido con paleta — mismo componente, tonos por niño/padre, vía tokens.
- **Sí:** colores nuevos como tokens en `@theme` — consistente con el sistema de SPEC 01.
- **Sí:** `activePath` como prop desde la página (sin `usePathname`) — Sidebar sigue siendo server component; cero estado extra.
- **No:** generalizar `Badge` — tocaría PostCard sin beneficio.
- **No:** agregar/editar niño, vincular padre, resumen del día — cada pantalla tendrá su spec.
- **No:** páginas placeholder para Avisos/Mi cuenta — cada pantalla tendrá su spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual del perfil (único comp: Mateo) | Valores exactos del comp en el mock de Mateo; datos inventados coherentes para el resto; comparación lado a lado |
| Refactor del feed podría romperlo | Criterio explícito de que `/` queda idéntico; refactor acotado a AppShell |
| Params tipados/`generateStaticParams` en Next 16 | Verificar convención en `node_modules/next/dist/docs/` antes de escribir la ruta dinámica |

## Lo que **no** está en este spec

- Agregar/editar niño (`agregar-nino.dc.html`).
- Vincular padre (`vincular-padre.dc.html`).
- Resumen del día (`resumen-dia.dc.html`).
- Avisos, Mi cuenta, login, autenticación, base de datos, API.
- Acciones reales sobre padres (aceptar/revocar invitación).

Cada una de esas, si llega, va en su propio spec.