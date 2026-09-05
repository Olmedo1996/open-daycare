## 1. Directory Structure & Route Migration

- [ ] 1.1 Create `app/staff/` directory structure with `feed/`, `kids/`, `kids/[id]/` subdirectories
- [ ] 1.2 Create `app/family/` directory structure with `feed/`, `mis-hijos/`, `notifications/`, `account/` subdirectories
- [ ] 1.3 Move `app/kids/page.tsx` content to `app/staff/kids/page.tsx` and verify the page renders at `/staff/kids`
- [ ] 1.4 Move `app/kids/[id]/page.tsx` content to `app/staff/kids/[id]/page.tsx` and verify the page renders at `/staff/kids/[id]`
- [ ] 1.5 Delete original `app/kids/` directory after verifying moves

## 2. Layouts

- [ ] 2.1 Create `app/staff/layout.tsx` that renders staff sidebar + children slot, importing `Sidebar` with `variant="staff"`
- [ ] 2.2 Create `app/family/layout.tsx` that renders family sidebar + children slot, importing `Sidebar` with `variant="family"`
- [ ] 2.3 Verify staff layout renders sidebar on desktop and hamburger on mobile at `/staff/feed`
- [ ] 2.4 Verify family layout renders sidebar on desktop and hamburger on mobile at `/family/feed`

## 3. Component Parameterization

- [ ] 3.1 Add `variant: 'staff' | 'family'` prop to `Sidebar` component in `components/shared/Sidebar.tsx`
- [ ] 3.2 Add `variant: 'staff' | 'family'` prop to `MobileNav` component in `components/shared/MobileNav.tsx`
- [ ] 3.3 Conditionally render "Nueva publicación" button only when `variant === 'staff'`
- [ ] 3.4 Accept `navItems` as a prop (or derive from variant) so sidebar shows correct nav per role
- [ ] 3.5 Verify sidebar renders correctly for both variants

## 4. Mock Data Updates

- [ ] 4.1 Update `navItems` in `app/_data/mock.ts` to use `/staff/feed`, `/staff/kids` paths
- [ ] 4.2 Add `familyNavItems` array with Feed (`/family/feed`), Mis hijos (`#`), Avisos (`/family/notifications`), Mi cuenta (`/family/account`)
- [ ] 4.3 Update `getActiveNav()` to accept a `variant` parameter and return appropriate items
- [ ] 4.4 Add `familySidebarUser` mock data with placeholder name and role

## 5. Role-Based Auth Redirect

- [ ] 5.1 Create helper function `getDashboardPath(role: string): string` in `lib/actions/auth.ts` that maps `staff`/`admin` to `/staff/feed` and `parent` to `/family/feed`
- [ ] 5.2 Update `signInAction` to query `users.role` after login and redirect using `getDashboardPath()`
- [ ] 5.3 Handle edge case: user has no record in `users` table — redirect to `/activate` or show error
- [ ] 5.4 Verify login as staff redirects to `/staff/feed`
- [ ] 5.5 Verify login as parent redirects to `/family/feed`

## 6. Root URL Redirect

- [ ] 6.1 Rewrite `app/page.tsx` as a server component that queries auth state and role
- [ ] 6.2 Redirect unauthenticated users to `/login`
- [ ] 6.3 Redirect staff/admin users to `/staff/feed`
- [ ] 6.4 Redirect parent users to `/family/feed`
- [ ] 6.5 Verify root `/` redirects correctly for each role

## 7. Family Pages (Placeholders)

- [ ] 7.1 Create `app/family/feed/page.tsx` with placeholder content (feed structure to be implemented separately)
- [ ] 7.2 Create `app/family/mis-hijos/page.tsx` with "Próximamente" placeholder message
- [ ] 7.3 Create `app/family/notifications/page.tsx` with placeholder content
- [ ] 7.4 Create `app/family/account/page.tsx` with placeholder content
- [ ] 7.5 Verify all family pages render under the family layout

## 8. Sign Out Update

- [ ] 8.1 Verify `signOutAction` redirects to `/login` (already correct, no change needed)
- [ ] 8.2 Verify logout button works from both staff and family sidebars

## 9. Verification & Cleanup

- [ ] 9.1 Run `npx tsc --noEmit` and verify no type errors
- [ ] 9.2 Run `npm run lint` and verify no lint errors
- [ ] 9.3 Verify all staff routes render correctly: `/staff/feed`, `/staff/kids`, `/staff/kids/[id]`
- [ ] 9.4 Verify all family routes render correctly: `/family/feed`, `/family/mis-hijos`, `/family/notifications`, `/family/account`
- [ ] 9.5 Verify root `/` redirects based on role
- [ ] 9.6 Verify sidebar nav highlights active item correctly for both roles
- [ ] 9.7 Verify mobile responsive behavior (hamburger menu) for both layouts
