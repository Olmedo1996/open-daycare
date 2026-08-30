CREATE TABLE public.daycares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.daycares IS 'Entidad raíz: la guardería. Todos los usuarios, salas y niños pertenecen a una daycare.';

ALTER TABLE public.daycares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daycares_select_authenticated"
  ON public.daycares
  FOR SELECT
  TO authenticated
  USING (true);
