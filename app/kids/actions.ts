'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  revalidatePath('/kids')
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
  revalidatePath('/kids')
  revalidatePath(`/kids/${id}`)
}

export async function deleteChild(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('children').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/kids')
}
