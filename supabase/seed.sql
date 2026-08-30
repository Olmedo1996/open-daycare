INSERT INTO public.daycares (name) VALUES ('Guardería Sala Soles');

-- Insertar directamente en auth.users con pgcrypto.
-- Las columnas string van a '' (y is_super_admin a false) porque GoTrue las
-- escanea como no-nulas al hacer login; si quedan NULL, el signin falla con
-- 500 'Database error querying schema'.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  encrypted_password,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  recovery_token,
  reauthentication_token,
  confirmation_token,
  is_super_admin,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'staff@opendaycare.test',
  now(),
  crypt('staff12345', gen_salt('bf')),
  '', '', '',
  '', '', '',
  '', '',
  '',
  false,
  '{}'::jsonb,
  jsonb_build_object(
    'daycare_id', (SELECT id FROM public.daycares WHERE name = 'Guardería Sala Soles'),
    'role', 'staff',
    'full_name', 'Sofía Staff'
  ),
  now(),
  now()
);

-- La fila en public.users se crea automáticamente vía el trigger on_auth_user_created.
