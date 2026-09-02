-- Helper SECURITY DEFINER: devuelve el role del usuario autenticado.
-- Evita la recursión de RLS igual que get_my_daycare_id().
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Fix: staff/admin deben ver TODOS los usuarios de su daycare (incluidos padres).
-- La política previa chequeaba el role de la FILA (no del usuario actual), lo que
-- impedía a staff/admin ver usuarios con role = 'parent'.
DROP POLICY IF EXISTS "users_select_same_daycare_staff" ON public.users;

CREATE POLICY "users_select_same_daycare_staff"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    daycare_id = public.get_my_daycare_id()
    AND public.get_my_role() IN ('staff', 'admin')
  );
