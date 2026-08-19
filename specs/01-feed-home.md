# SPEC 01 — Feed como home

> **Estado:** Implementado
> **Depende de:** Ninguna
> **Fecha:** 2026-08-17
> **Objetivo:** Implementar la pantalla Feed de `references/pantallas/feed.dc.html` como home (`/`) responsive, visualmente idéntica al comp en desktop, con datos hardcodeados, sin autenticación ni base de datos.

## Scope

**In:**

- Reemplazar el boilerplate de `app/page.tsx` por el Feed del comp.
- `app/layout.tsx`: Fredoka + Nunito vía `next/font/google` (variables `--font-fredoka` / `--font-nunito`), `lang="es"`, metadata "OpenDayCare".
- `app/globals.css`: limpiar boilerplate (dark mode, tokens Geist) y definir la paleta del comp como tokens en `@theme`.
- Componentes descompuestos en `app/components/` con subcarpetas:
  - `shared/` — comunes a futuras pantallas: `Sidebar`, `MobileHeader` (top bar + drawer), `Avatar`, `Badge`, iconos SVG.
  - `home/` — propios del feed: `Composer` (caja "Compartí un momento…"), `PostCard`.
- Datos de prueba en `app/data/posts.ts` con tipo `Post` y los 3 posts del comp.
- Responsive: breakpoint `lg` (1024px).
  - `≥1024px`: idéntico al comp (sidebar fijo 248px sticky).
  - `<1024px`: top bar con logo y botón hamburguesa; sidebar como drawer overlay (backdrop semitransparente, cierra al tocar backdrop o ícono X). Requiere un client component mínimo para el toggle.
- Links y botones inertes (renderizados pero sin navegación).

**Out of scope (para specs futuros):**

- Autenticación / login funcional.
- Base de datos, persistencia, API routes.
- Pantallas reales: Niños, Avisos, Mi cuenta, crear/editar publicación, detalle, foto.
- Interactividad de likes/comentarios; fecha dinámica del header.
- Diseño mobile dedicado tipo app (bottom nav, etc.) — aquí solo adaptación drawer.

## Modelo de datos

```ts
// app/data/posts.ts
export type PostType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  authorName: string;       // "Mateo" | "Anuncio general"
  timeLabel: string;        // "14:20" tal cual el comp
  type: PostType;           // define badge y colores
  recipientLabel: string;   // "familia de Mateo" | "toda la sala"
  text: string;
  photoLabel?: string;      // "pintando con témperas" (solo post 2)
  likes: number;
  comments: number;
};
```

Convenciones: nomenclatura interna en inglés (tipos, variables, funciones) mientras el copy visible queda en español — la etiqueta del badge se mapea en el componente (`achievement` → "LOGRO", `activity` → "ACTIVIDAD", `announcement` → "ANUNCIO"). La inicial del avatar se deriva de `authorName`; colores por tipo — `achievement` `#CFEBD8`/`#3E9B6C`, `activity` `#C7E7F1`/`#2E89A6`, `announcement` `#CCD8F4`/`#4E72C8`; avatar de niño `#A9D9E8` con texto `#1F7A93`, `announcement` usa icono megáfono.

## Plan de implementación

1. `app/globals.css`: eliminar boilerplate y dark mode; tokens `@theme` con la paleta (`#F6ECDF`, `#FFFDF9`, `#ECE0D0`, `#3F362E`, acentos) y tipografías. Manual: `pnpm dev` compila y el fondo ya es crema.
2. `app/layout.tsx`: registrar fuentes con `next/font`, `lang="es"`, metadata, body con fondo y Nunito. Manual: recargar `/` sin parpadeo de fuentes.
3. `app/data/posts.ts`: crear tipo `Post` y array con los 3 posts del comp. Manual: `pnpm exec tsc --noEmit` pasa.
4. `app/components/shared/`: `Avatar`, `Badge`, iconos SVG, `Sidebar` (248px sticky, logo, botón "Nueva publicación", nav con Feed activo, usuario Caro Giménez; links inertes).
5. `app/components/shared/MobileHeader.tsx`: top bar + drawer overlay con `"use client"` (estado abierto/cerrado); reutiliza los mismos items del sidebar.
6. `app/components/home/`: `Composer` y `PostCard` con props tipadas (footer likes/comentarios/Editar, placeholder de foto).
7. `app/page.tsx`: componer layout (sidebar `hidden lg:flex` + `MobileHeader` `lg:hidden`, main scrolleable de 760px con padding fluido), header de saludo, `Composer`, divisor "PUBLICADO HOY" y lista de `PostCard` desde `posts.ts`. Manual: comparación visual con el comp a 1280px+ y prueba de drawer a 375px.

## Criterios de aceptación

- [x] `/` renderiza sin errores de consola con `pnpm dev`.
- [x] A ≥1024px el layout es idéntico al comp: sidebar 248px sticky, fondo `#FFFDF9`, Feed activo (`#FBE3D8`/`#D9583C`), botón gradiente "Nueva publicación", usuario "Caro Giménez · Maestra · Soles".
- [x] A <1024px se ve top bar con logo y hamburguesa; al tocarla se abre el drawer overlay sobre backdrop semitransparente; tocar backdrop o X cierra.
- [x] No hay scroll horizontal en ningún ancho (probar 320px, 768px, 1280px, 1920px).
- [x] Ningún link/botón navega (sin 404): nav, Nueva publicación, Editar, comentarios, foto, cerrar sesión.
- [x] Header con "GUARDERÍA · SALA SOLES", "Buenas, Caro" (Fredoka 30px) y "12 niños · martes 17 jun" fijo.
- [x] Los 3 posts en orden (logro 14:20, actividad 09:40 con placeholder de foto, anuncio 07:50) con badges y contadores exactos (3/1, 5/2, 8/0).
- [x] Fredoka y Nunito cargan vía `next/font` (sin `<link>` a Google Fonts).
- [x] Estructura: `app/components/shared/` (Sidebar, MobileHeader, Avatar, Badge, iconos) y `app/components/home/` (Composer, PostCard); datos en `app/data/posts.ts`.
- [x] Solo `MobileHeader` es client component; el resto server components.
- [x] `pnpm lint`, `pnpm exec tsc --noEmit` y `pnpm build` pasan.
- [x] No queda rastro del boilerplate de create-next-app.

## Decisiones

- **Sí:** Tailwind v4 con tokens en `@theme` — convención del repo; paleta reutilizable.
- **Sí:** `next/font/google` — self-hosted, sin FOUT ni CDN.
- **Sí:** subcarpetas `app/components/shared/` y `app/components/home/` — shared para elementos comunes a futuras pantallas, home para los propios del feed.
- **Sí:** responsive con drawer hamburguesa bajo `lg` — no hay comp mobile; el drawer conserva el diseño del sidebar sin rediseñar.
- **Sí:** datos en archivo aparte — cuando llegue la DB solo cambia la fuente.
- **Sí:** nomenclatura interna en inglés (`PostType` = `"achievement" | "activity" | "announcement"`) con copy visible en español (badge "LOGRO" etc.) — regla del repo: código limpio en inglés, UI en español.
- **Sí:** todo estático salvo el toggle del drawer (único client component).
- **No:** estilos inline 1:1 — no mantenible.
- **No:** dark mode — paleta clara fija.
- **No:** bottom nav mobile — patrón distinto al comp, rediseño innecesario.
- **No:** páginas placeholder para rutas inexistentes — cada pantalla tendrá su spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fidelidad visual (sombras, letter-spacing, gradientes) | Comparación lado a lado con el `.dc.html` al mismo ancho; valores exactos en el comp |
| Drawer sin comp de referencia | Reutilizar los estilos del sidebar (colores, tipografías, items) dentro del drawer |

## Lo que **no** está en este spec

- Autenticación, base de datos, API.
- Pantallas Niños, Avisos, Mi cuenta, crear/editar publicación, detalle, foto.
- Interactividad y fecha dinámica.
- Diseño mobile dedicado tipo app.
