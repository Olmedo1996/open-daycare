## Why

La app tiene dos roles claramente diferenciados (staff y familia) pero comparten las mismas rutas (`/`, `/kids`). Los diseños de referencia definen 15 pantallas separadas por role con navegación y layout distintos. Separar por URL permite: navegación clara por role, layouts independientes (sidebar staff vs sidebar familia), y un path post-login que refleja el contexto del usuario.

## What Changes

- **BREAKING**: La ruta raíz `/` ya no muestra el feed directamente — redirige a `/staff/feed` o `/family/feed` según el role del usuario.
- Nuevas rutas bajo `/staff/`: `/staff/feed`, `/staff/kids`, `/staff/kids/[id]`.
- Nuevas rutas bajo `/family/`: `/family/feed`, `/family/mis-hijos` (placeholder), `/family/notifications`, `/family/account`.
- Layout de staff con sidebar azul (Feed, Niños, Avisos, Mi cuenta + botón "Nueva publicación").
- Layout de familia con sidebar púrpura (Feed, Mis hijos*, Avisos, Mi cuenta — sin botón de crear).
- Post-login redirige a la sección correcta según role (`staff`/`admin` → `/staff/feed`, `parent` → `/family/feed`).
- Componentes `Sidebar` y `MobileNav` parametrizados con prop `variant`.

## Capabilities

### New Capabilities

- `staff-panel`: Panel de staff — rutas `/staff/*`, sidebar azul, navegación de staff, layout con sidebar colapsable en mobile.
- `family-panel`: Panel de familia — rutas `/family/*`, sidebar púrpura, navegación de familia, layout con sidebar colapsable en mobile.
- `role-based-routing`: Redirección post-login y en raíz `/` según el role del usuario (staff/parent/admin).

### Modified Capabilities

- (ninguna — las specs existentes no cambian de requisito, solo se mueven de ruta)

## Impact

- **Archivos movidos**: `app/page.tsx` → `app/staff/feed/page.tsx`, `app/kids/` → `app/staff/kids/`.
- **Archivos nuevos**: `app/staff/layout.tsx`, `app/family/layout.tsx`, `app/family/feed/page.tsx`, `app/family/mis-hijos/page.tsx`, `app/family/notifications/page.tsx`, `app/family/account/page.tsx`.
- **Archivos modificados**: `app/page.tsx` (redirect), `components/shared/Sidebar.tsx` (parametrizar), `components/shared/MobileNav.tsx` (parametrizar), `app/_data/mock.ts` (paths + nav family), `lib/actions/auth.ts` (query role + redirect).
- **Archivos eliminados**: `app/kids/page.tsx`, `app/kids/[id]/page.tsx` (ya movidos a staff/).
- **Auth flow**: `signInAction` consulta `users.role` y redirige a la ruta correspondiente.
- **Navegación**: Los hrefs de sidebar/nav cambian de `/` a `/staff/feed` y de `/kids` a `/staff/kids`.
