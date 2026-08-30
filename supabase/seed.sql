INSERT INTO public.daycares (name) VALUES ('Guardería Sala Soles');

-- Insertar directamente en auth.users con pgcrypto
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff@opendaycare.test',
  now(),
  crypt('staff12345', gen_salt('bf')),
  '{}'::jsonb,
  jsonb_build_object(
    'daycare_id', (SELECT id FROM public.daycares WHERE name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Sofía Staff'
  ),
  now(),
  now(),
  ''
);

-- La fila en public.users se crea automáticamente vía el trigger on_auth_user_created.
