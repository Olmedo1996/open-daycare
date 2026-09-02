'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type ActivateState = { error: string | null };

export async function activateAccount(
  _prevState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const supabase = await createClient();

  const code = String(formData.get('code') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const { data, error } = await supabase.rpc('get_invitation_by_code', {
    p_code: code,
    p_email: email,
  });

  if (error || !data || data.length === 0) {
    return { error: 'Código o email inválidos, o la invitación venció.' };
  }

  const invitation = data[0];

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'parent',
        daycare_id: invitation.daycare_id,
        full_name: invitation.full_name,
      },
    },
  });

  if (signUpError) {
    const message = signUpError.message.toLowerCase();
    if (message.includes('registered') || message.includes('already')) {
      return { error: 'Este email ya tiene una cuenta. Iniciá sesión.' };
    }
    if (message.includes('password')) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    return { error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
  }

  const { error: completeError } = await supabase.rpc('complete_invitation', {
    p_code: code,
    p_email: email,
  });

  if (completeError) {
    return { error: 'No se pudo completar la vinculación. Intenta de nuevo.' };
  }

  redirect('/login');
}
