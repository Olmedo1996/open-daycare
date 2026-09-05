## Context

The app currently has a flat route structure: `/` (staff feed), `/kids` (staff kids list), `/kids/[id]` (staff kid profile). Login is shared at `(auth)/login`. The `signInAction` redirects to `/` after successful login. The `Sidebar` and `MobileNav` components are staff-specific with hardcoded nav items and mock data.

The database already distinguishes roles via `users.role` (enum: `staff`, `parent`, `admin`) and links parents to children via `parent_children`. RLS policies are already in place.

## Goals / Non-Goals

**Goals:**

- Separate staff and family experiences into distinct URL namespaces (`/staff/*` and `/family/*`)
- Each role gets its own layout with a sidebar tailored to its navigation needs
- Post-login and root URL redirect to the correct panel based on role
- Reuse existing components (Sidebar, MobileNav) via parameterization rather than duplication

**Non-Goals:**

- Changing RLS policies or database schema (already correct)
- Implementing the actual family feed content (just route structure and layout)
- Adding new Supabase queries for family-specific data beyond what exists
- Implementing the "Mis hijos" feature (placeholder only)

## Decisions

### 1. Route Groups: `(staff)` vs `staff/` directory

**Decision:** Use plain directories `app/staff/` and `app/family/` (not route groups with parentheses).

**Rationale:** Route groups `(staff)` don't appear in the URL. We want `/staff/feed` in the URL, not just `/feed`. Plain directories create the URL segments we need.

**Alternatives considered:**
- Route groups `(staff)` with middleware rewrite — rejected: adds complexity, URLs don't reflect the role
- Parallel routes `@staff` / `@family` — rejected: overkill for this use case, harder to reason about

### 2. Sidebar parameterization vs separate components

**Decision:** Parameterize the existing `Sidebar` and `MobileNav` with a `variant: 'staff' | 'family'` prop.

**Rationale:** The sidebar structure is identical (logo, nav items, user card, logout). Only the nav items, color accent, and "Nueva publicación" button differ. One component with a variant prop is simpler to maintain than two near-identical components.

**Alternatives considered:**
- Two separate components (`StaffSidebar`, `FamilySidebar`) — rejected: duplication of structure, harder to keep in sync
- Single component with children slots — rejected: over-engineered for the differences involved

### 3. Auth redirect implementation

**Decision:** Modify `signInAction` in `lib/actions/auth.ts` to query `users.role` after successful login and `redirect()` to the appropriate path. Create a helper function `getDashboardPath(role)` that maps role to URL.

**Rationale:** Keeping the redirect logic in the server action is idiomatic for Next.js Server Actions. A helper function makes the mapping testable and reusable for the root page redirect.

**Alternatives considered:**
- Middleware-based redirect — rejected: Next.js 16 deprecates middleware in favor of proxy.ts; auth redirect belongs in the action
- Client-side redirect after page load — rejected: causes flash of wrong content

### 4. Root page `/` as redirector

**Decision:** Replace the current feed content in `app/page.tsx` with a server component that queries the user's role and redirects.

**Rationale:** Maintains backward compatibility with bookmarked URLs. Users who visit `/` get seamlessly redirected to their panel.

**Alternatives considered:**
- Remove `/` entirely — rejected: breaks bookmarks, 404 is poor UX
- Keep `/` as a shared landing page — rejected: no shared content exists between roles

### 5. Mock data path updates

**Decision:** Update `app/_data/mock.ts` to use `/staff/*` paths in nav items. Add a separate `familyNavItems` array for the family sidebar.

**Rationale:** Mock data drives the sidebar nav. Paths must match the new route structure. Keeping family nav separate avoids conditional logic in mock data.

### 6. Family nav "Mis hijos" as placeholder

**Decision:** The "Mis hijos" nav item uses `href="#"` and does not navigate. The page at `/family/mis-hijos` renders a placeholder message.

**Rationale:** The feature is not yet implemented. A placeholder maintains the nav structure while making it clear the feature is coming.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Sidebar parameterization adds prop complexity | Keep the variant prop simple: only nav items and boolean for "new post" button. No deep configuration objects. |
| Users with bookmarks to `/` or `/kids` lose their place | The root redirect handles `/`. Old `/kids` paths will 404 — acceptable since the app is pre-launch. |
| Role lookup adds a DB query on every login | Single indexed query on `users.id` (primary key). Negligible performance impact. |
| User exists in auth.users but not in public.users | Redirect to `/activate` or show error. This is an edge case for users who haven't completed onboarding. |
| Family feed content not implemented yet | Only route structure and layout are in scope. Feed content is a separate change. |
