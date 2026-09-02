-- Enums
CREATE TYPE public.relationship_type  AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Tabla invitations
CREATE TABLE public.invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  invited_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  email         text NOT NULL,
  relationship  public.relationship_type NOT NULL,
  code          text NOT NULL UNIQUE,
  status        public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz NOT NULL,
  accepted_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.invitations IS 'Invitaciones a padres para vincularse a un niño.';

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Tabla parent_children
CREATE TABLE public.parent_children (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  relationship  public.relationship_type NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

COMMENT ON TABLE public.parent_children IS 'Vínculos entre padres y niños.';

ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Políticas RLS — invitations
CREATE POLICY "invitations_select_staff" ON public.invitations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('staff','admin')
      AND u.daycare_id = public.get_my_daycare_id()
  ));

CREATE POLICY "invitations_insert_staff" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('staff','admin'))
    AND EXISTS (
      SELECT 1 FROM public.children c JOIN public.rooms r ON r.id = c.room_id
      WHERE c.id = child_id AND r.daycare_id = public.get_my_daycare_id()
    )
  );

-- Políticas RLS — parent_children
CREATE POLICY "parent_children_select_staff" ON public.parent_children
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('staff','admin')
      AND u.daycare_id = public.get_my_daycare_id()
  ));

CREATE POLICY "parent_children_select_self" ON public.parent_children
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- Sin política INSERT: los vínculos se crean vía la RPC complete_invitation (SECURITY DEFINER).

-- RPC: lee una invitación por código+email (sin sesión). Devuelve datos para /activate y el signup.
CREATE OR REPLACE FUNCTION public.get_invitation_by_code(p_code text, p_email text)
RETURNS TABLE (
  id uuid, child_id uuid, full_name text, email text,
  relationship public.relationship_type, daycare_id uuid,
  child_name text, room_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.id, i.child_id, i.full_name, i.email, i.relationship,
         u.daycare_id, c.full_name, rm.name
  FROM public.invitations i
  JOIN public.users u ON u.id = i.invited_by
  JOIN public.children c ON c.id = i.child_id
  LEFT JOIN public.rooms rm ON rm.id = c.room_id
  WHERE i.code = upper(p_code)
    AND lower(i.email) = lower(p_email)
    AND i.status = 'pending'
    AND i.expires_at > now()
$$;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_code(text, text) TO anon, authenticated;

-- RPC: vincula al padre (auth.uid()) con el niño y marca la invitación como accepted.
CREATE OR REPLACE FUNCTION public.complete_invitation(p_code text, p_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT i.* INTO inv
  FROM public.invitations i
  WHERE i.code = upper(p_code)
    AND lower(i.email) = lower(p_email)
    AND i.status = 'pending'
    AND i.expires_at > now()
  FOR UPDATE;

  IF inv.id IS NULL THEN
    RAISE EXCEPTION 'invitation_not_found';
  END IF;

  INSERT INTO public.parent_children (parent_id, child_id, relationship)
  VALUES (auth.uid(), inv.child_id, inv.relationship)
  ON CONFLICT (parent_id, child_id) DO NOTHING;

  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = inv.id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_invitation(text, text) TO authenticated;
