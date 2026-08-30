'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

export async function signInAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });

  if (error) {
    return { error: 'Email o contraseña incorrectos' };
  }

  redirect('/');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/login');
}
