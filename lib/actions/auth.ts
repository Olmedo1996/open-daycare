'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

export async function getDashboardPath(role: string): Promise<string> {
  if (role === 'staff' || role === 'admin') {
    return '/staff/feed';
  }
  if (role === 'parent') {
    return '/family/feed';
  }
  return '/activate';
}

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/activate');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    redirect('/activate');
  }

  redirect(await getDashboardPath(userProfile.role));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect('/login');
}
