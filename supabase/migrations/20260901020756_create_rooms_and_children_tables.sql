-- Enum
CREATE TYPE public.child_status AS ENUM ('active', 'archived');

-- Tabla rooms
CREATE TABLE public.rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id  uuid NOT NULL REFERENCES public.daycares(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rooms IS 'Salas de la guardería (Soles, Estrellas, Lunas, etc.).';

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Tabla children
CREATE TABLE public.children (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  full_name       text NOT NULL,
  birth_date      date NOT NULL,
  enrolled_at     date NOT NULL DEFAULT CURRENT_DATE,
  medical_notes   text NOT NULL DEFAULT '',
  allergy_tags    text[] NOT NULL DEFAULT '{}',
  photo_consent   boolean NOT NULL DEFAULT true,
  status          public.child_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.children IS 'Niños inscritos en la guardería.';

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Políticas RLS — rooms
CREATE POLICY "rooms_select_same_daycare"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_insert_same_daycare"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_update_same_daycare"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id())
  WITH CHECK (daycare_id = public.get_my_daycare_id());

CREATE POLICY "rooms_delete_same_daycare"
  ON public.rooms
  FOR DELETE
  TO authenticated
  USING (daycare_id = public.get_my_daycare_id());

-- Políticas RLS — children
CREATE POLICY "children_select_same_daycare_staff"
  ON public.children
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = (
          SELECT r.daycare_id FROM public.rooms r WHERE r.id = children.room_id
        )
    )
  );

CREATE POLICY "children_insert_same_daycare"
  ON public.children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  );

CREATE POLICY "children_update_same_daycare"
  ON public.children
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND (
          room_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = children.room_id
              AND r.daycare_id = u.daycare_id
          )
        )
    )
  );

CREATE POLICY "children_delete_same_daycare"
  ON public.children
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND EXISTS (
          SELECT 1 FROM public.rooms r
          WHERE r.id = children.room_id
            AND r.daycare_id = u.daycare_id
        )
    )
  );
