-- Enums
CREATE TYPE public.user_role   AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active');

-- Tabla users
CREATE TABLE public.users (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id             uuid NOT NULL REFERENCES public.daycares(id) ON DELETE CASCADE,
  role                   public.user_role NOT NULL,
  status                 public.user_status NOT NULL DEFAULT 'active',
  full_name              text NOT NULL,
  avatar_url             text,
  notify_on_post         boolean NOT NULL DEFAULT true,
  daily_summary_enabled  boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Perfil de aplicación vinculado a Supabase Auth. Padres y staff comparten tabla, diferenciados por role.';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER: devuelve el daycare_id del usuario autenticado.
-- Evita la recursión infinita de RLS: un subselect directo sobre public.users
-- dentro de la política provocaría 'infinite recursion detected in policy'.
CREATE OR REPLACE FUNCTION public.get_my_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT daycare_id FROM public.users WHERE id = auth.uid()
$$;

-- Un usuario ve su propia fila
CREATE POLICY "users_select_self"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Staff y admin ven todos los usuarios de su daycare
CREATE POLICY "users_select_same_daycare_staff"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    role IN ('staff', 'admin')
    AND daycare_id = public.get_my_daycare_id()
  );

-- Función SECURITY DEFINER que crea el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'daycare_id')::uuid,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger AFTER INSERT sobre auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
