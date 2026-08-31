# SPEC 09 — Autenticación real (email/password) y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 03 (páginas login/activate) — reutiliza el calco visual de `app/(auth)/login/page.tsx`; SPEC 07 (setup de Supabase y clientes JS en `lib/supabase/`); SPEC 08 (tabla `users` + usuario staff seedeado para pruebas)
> **Fecha:** 2026-08-30
> **Objetivo:** Implementar login real email/password contra Supabase Auth en `/login` con logout en el sidebar, y proteger las rutas del app redirigiendo usuarios sin sesión a `/login` desde `proxy.ts`.

## Scope

**In:**

- Server actions en `lib/actions/auth.ts` usando el server client de `lib/supabase/server.ts`:
  - `signInAction(prevState, formData)`: llama `supabase.auth.signInWithPassword({ email, password })`. Si falla, devuelve estado con mensaje de error. Si funciona, redirige a `/`.
  - `signOutAction()`: llama `supabase.auth.signOut()` y redirige a `/login`.
- Componente cliente `app/(auth)/login/login-form.tsx`:
  - `useActionState` para manejar el estado de error de la action.
  - Inputs `EMAIL` y `CONTRASEÑA` con los mismos estilos del calco de `login.dc.html` (via `name="email"` / `name="password"` en FormData).
  - Mensaje de error `Email o contraseña incorrectos` visible bajo el formulario (color de error) cuando las credenciales son inválidas.
  - Botón `Iniciar sesión` tipo submit con `useFormStatus`: deshabilitado + texto `Ingresando…` durante el submit.
- Actualizar `app/(auth)/login/page.tsx`: reemplaza los inputs/botón sueltos por `<LoginForm />` manteniendo el layout de dos columnas y el resto del calco intacto.
- Protección de rutas en `lib/supabase/proxy.ts` (`updateSession`), después de `getClaims()`:
  - Rutas públicas: `/login`, `/activate`. Resto: protegidas (`/`, `/kids`, `/kids/[id]`).
  - Sin claims + ruta protegida → redirect 307 a `/login`.
  - Con claims + ruta pública → redirect a `/`.
  - Copiar las cookies del `supabaseResponse` al response de redirect si `getClaims()` rotó tokens.
- Logout real en `components/shared/Sidebar.tsx`: el botón `Cerrar sesión` pasa de `<Link href="#">` a `<form action={signOutAction}>` con submit.

**Out of scope (para specs futuras):**

- Activación real de cuenta en `/activate` (requiere tabla `invitations`, que no existe).
- Funcionalidad de `¿Olvidaste tu contraseña?` (reset password).
- Redirección por rol (staff/family) y pantallas de familia.
- Cargar el perfil de `public.users` para mostrar nombre/rol en la UI (sidebar sigue con mock).
- Selección funcional de rol `Personal`/`Familia` (siguen siendo visuales).
- Protección por-página en Server Components (defense-in-depth) — solo `proxy.ts`.
- Auth en API routes / route handlers (no existen aún).

## Data model

No introduce nuevas estructuras de datos permanentes. Reusa las sesiones de Supabase Auth (cookies) y la tabla `users` de SPEC 08.

```ts
// Estado de la server action de login (client-side):
type LoginState = { error: string | null };
```

## Implementation plan

1. **Server actions de auth.** Crear `lib/actions/auth.ts` (`'use server'`): `signInAction` con `signInWithPassword` (error → `{ error: 'Email o contraseña incorrectos' }`; ok → redirect a `/`) y `signOutAction` (signOut + redirect a `/login`). _Prueba: `npx tsc --noEmit` compila._
2. **Formulario cliente.** Crear `app/(auth)/login/login-form.tsx` (`'use client'`): `useActionState(signInAction, { error: null })`, inputs con `name` en FormData, mensaje de error condicional, botón submit con `useFormStatus`. Mismos estilos que el calco actual. _Prueba: render de `/login` idéntico al de hoy._
3. **Integrar el form en la página.** Actualizar `app/(auth)/login/page.tsx`: el panel derecho usa `<LoginForm />` en lugar de los inputs/botón sueltos. _Prueba: login con `staff@opendaycare.test` / `staff12345` redirige a `/`; password incorrecta muestra el error._
4. **Logout en el sidebar.** En `components/shared/Sidebar.tsx`: reemplazar el `<Link href="#">` de `Cerrar sesión` por un `<form action={signOutAction}>`. _Prueba: click cierra sesión y lleva a `/login`._
5. **Protección en `proxy.ts`.** En `lib/supabase/proxy.ts`, tras `await supabase.auth.getClaims()`: leer el resultado, clasificar la ruta (pública vs protegida) y devolver los redirects indicados, preservando cookies. _Prueba: sin sesión `/` → `/login`; con sesión `/login` → `/`._
6. **Verificación end-to-end.** Flujo completo: logout → `/login` → login OK → `/` → recarga mantiene sesión → logout. Ejecutar `npm run lint` y `npx tsc --noEmit`.

## Acceptance criteria

- [ ] El form de `/login` hace submit real a `signInAction` (server action) con email y password.
- [ ] Login con `staff@opendaycare.test` / `staff12345` autentica contra Supabase y redirige a `/`.
- [ ] Login con contraseña incorrecta muestra `Email o contraseña incorrectos` y no redirige.
- [ ] Durante el submit el botón queda deshabilitado con `Ingresando…` (sin doble submit).
- [ ] Sin sesión, navegar a `/` redirige a `/login`.
- [ ] Sin sesión, navegar a `/kids` o `/kids/[id]` redirige a `/login`.
- [ ] Con sesión, navegar a `/login` redirige a `/`.
- [ ] Con sesión, navegar a `/activate` redirige a `/`.
- [ ] Click en `Cerrar sesión` del sidebar elimina la sesión y redirige a `/login`.
- [ ] Tras logout, navegar a `/` redirige a `/login`.
- [ ] Recargar `/` con sesión activa mantiene la sesión (refresh de `getClaims` intacto).
- [ ] Los botones `Personal`/`Familia` siguen siendo puramente visuales.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] Sin errores en consola del navegador durante el flujo completo.

## Decisions

- **Sí:** Login solo en `/login`. La activación real requiere la tabla `invitations` (no existe); merece su propia spec.
- **Sí:** Logout incluido. Cierra el ciclo auth (login → sesión → logout) y el botón ya existe en el sidebar.
- **Sí:** Protección centralizada en `proxy.ts` tras `getClaims()`. Patrón oficial Next.js 16 + Supabase (vía Context7); corre antes de renderizar y evita repetir chequeos por página.
- **Sí:** Server Action para el submit (no browser client). Las cookies se setean server-side y el redirect es atómico.
- **Sí:** Mensaje de error genérico único (`Email o contraseña incorrectos`). No distingue si falló email o password (evita enumeración).
- **Sí:** Estado de loading con `useFormStatus` (deshabilitar + `Ingresando…`).
- **Sí:** Redirección post-login siempre a `/`. Las pantallas de familia no existen aún; por rol va en spec futura.
- **Sí:** Botones `Personal`/`Familia` visuales. El rol real vive en `users.role` (SPEC 08).
- **Sí:** `/activate` también redirige a `/` si hay sesión (mismo tratamiento que `/login`).
- **No:** Param `redirectTo` para volver a la ruta original. Simplifica; se agrega si se necesita.
- **No:** Protección por-página en Server Components. `proxy.ts` es la única capa por ahora.
- **No:** Mostrar datos del perfil (`public.users`) en la UI. Va con la integración del feed con datos reales.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Cookies rotadas por `getClaims()` se pierden al devolver un redirect | Copiar las cookies del `supabaseResponse` al response de redirect (el propio `lib/supabase/proxy.ts` lo advierte en comentarios) |
| Loop de redirects entre `/` y `/login` si la clasificación de rutas falla | Lista explícita de rutas públicas + guard: redirect de autenticado solo si la ruta actual es pública |
| Redirect desde server action en Next 16 cambió de firma | Verificar la firma actual (`redirect({ href, type })` vs `redirect(url)`) en `node_modules/next/dist/docs/` durante la implementación |

## What is **not** in this spec

- Activación real de cuenta en `/activate`.
- Reset de contraseña.
- Redirección por rol y pantallas de familia.
- Datos del perfil real en la UI.
- Selección funcional de rol en el login.
- Protección por-página (server components).

Cada uno de esos, si llega, va en su propia spec.
