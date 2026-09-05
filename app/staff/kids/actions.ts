'use server'

import { createClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type CreateInvitationInput = {
  childId: string
  parentName: string
  email: string
  relationship: 'mother' | 'father' | 'guardian'
}

function generateCode(): string {
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export async function createInvitation(input: CreateInvitationInput) {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) throw new Error('No autenticado')

  const { data: child } = await supabase
    .from('children')
    .select('full_name')
    .eq('id', input.childId)
    .single()

  if (!child) throw new Error('Niño no encontrado')

  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const { error: insertError } = await supabase.from('invitations').insert({
      child_id: input.childId,
      invited_by: userId,
      full_name: input.parentName,
      email: input.email,
      relationship: input.relationship,
      code,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (!insertError) {
      const activateUrl = `${origin}/activate?code=${encodeURIComponent(code)}&email=${encodeURIComponent(input.email)}`
      await sendInvitationEmail({
        to: input.email,
        parentName: input.parentName,
        childName: child.full_name,
        code,
        activateUrl,
      })
      revalidatePath('/staff/kids')
      revalidatePath(`/staff/kids/${input.childId}`)
      return
    }

    if (insertError.code === '23505') {
      lastError = insertError
      continue
    }

    throw insertError
  }

  throw lastError ?? new Error('No se pudo generar el código de invitación')
}

export async function createChild(data: {
  full_name: string
  birth_date: string
  room_id: string
  allergy_tags?: string[]
  medical_notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').insert({
    full_name: data.full_name,
    birth_date: data.birth_date,
    room_id: data.room_id || null,
    allergy_tags: data.allergy_tags ?? [],
    medical_notes: data.medical_notes ?? '',
  })
  if (error) throw error
  revalidatePath('/staff/kids')
}

export async function updateChild(
  id: string,
  data: {
    full_name: string
    birth_date: string
    room_id: string
    allergy_tags?: string[]
    medical_notes?: string
  },
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('children')
    .update({
      full_name: data.full_name,
      birth_date: data.birth_date,
      room_id: data.room_id || null,
      allergy_tags: data.allergy_tags ?? [],
      medical_notes: data.medical_notes ?? '',
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/staff/kids')
  revalidatePath(`/staff/kids/${id}`)
}

export async function deleteChild(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/staff/kids')
}
