-- Enum
CREATE TYPE public.post_type AS ENUM (
  'meal', 'nap', 'activity', 'achievement', 'photo', 'announcement'
);

-- Tabla posts
CREATE TABLE public.posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id       uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  type          public.post_type NOT NULL,
  title         text,
  body          text NOT NULL,
  is_public     boolean NOT NULL DEFAULT true,
  published_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.posts IS 'Publicaciones del staff (comidas, siestas, actividades, fotos, anuncios).';

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Tabla post_children
CREATE TABLE public.post_children (
  post_id   uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  child_id  uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

COMMENT ON TABLE public.post_children IS 'Relación entre publicaciones y niños asociados.';

ALTER TABLE public.post_children ENABLE ROW LEVEL SECURITY;

-- Tabla post_photos
CREATE TABLE public.post_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url         text NOT NULL,
  width       int,
  height      int,
  position    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.post_photos IS 'Fotos adjuntas a publicaciones.';

ALTER TABLE public.post_photos ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_room_id ON public.posts(room_id);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_post_children_child_id ON public.post_children(child_id);

-- Trigger: auto-update updated_at en posts
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Políticas RLS — posts
-- Staff puede ver todos los posts públicos + privados de su daycare
CREATE POLICY "posts_select_staff"
  ON public.posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

-- Padres ven posts públicos de su daycare + posts de sus hijos (privados incluidos)
CREATE POLICY "posts_select_parent"
  ON public.posts
  FOR SELECT TO authenticated
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'parent'
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

CREATE POLICY "posts_select_parent_children"
  ON public.posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'parent'
        AND u.daycare_id = public.get_my_daycare_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.post_children pc
      JOIN public.parent_children par ON par.child_id = pc.child_id
      WHERE pc.post_id = posts.id
        AND par.parent_id = auth.uid()
    )
  );

-- Solo staff puede insertar posts
CREATE POLICY "posts_insert_staff"
  ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

-- Solo autor puede actualizar su post
CREATE POLICY "posts_update_author"
  ON public.posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Solo autor puede eliminar su post
CREATE POLICY "posts_delete_author"
  ON public.posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Políticas RLS — post_children (sin recursión sobre posts)
-- SELECT: staff ve todo de su daycare, padre ve si es su hijo
CREATE POLICY "post_children_select"
  ON public.post_children
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.parent_children pc
      WHERE pc.child_id = post_children.child_id
        AND pc.parent_id = auth.uid()
    )
  );

-- INSERT: solo staff puede vincular niños a posts
CREATE POLICY "post_children_insert"
  ON public.post_children
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

-- DELETE: solo staff puede desvincular niños de posts
CREATE POLICY "post_children_delete"
  ON public.post_children
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

-- Políticas RLS — post_photos (sin recursión sobre posts)
-- SELECT: staff ve todo de su daycare, padre ve si es hijo asociado al post
CREATE POLICY "post_photos_select"
  ON public.post_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.post_children pch
      JOIN public.parent_children pc ON pc.child_id = pch.child_id
      WHERE pch.post_id = post_photos.post_id
        AND pc.parent_id = auth.uid()
    )
  );

-- INSERT: solo staff puede subir fotos
CREATE POLICY "post_photos_insert"
  ON public.post_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );

-- DELETE: solo staff puede eliminar fotos
CREATE POLICY "post_photos_delete"
  ON public.post_photos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id = public.get_my_daycare_id()
    )
  );
