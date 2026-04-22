'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateFileName, validateFileSize } from '@/lib/utils'
import type { CreateEventForm, CreateTransactionForm, UpdateBalanceForm } from '@/types'

// ============================================================
// AUTH ACTIONS
// ============================================================

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// EVENT ACTIONS
// ============================================================

export async function createEvent(form: CreateEventForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase.from('events').insert({
    user_id: user.id,
    title: form.title.trim(),
    description: form.description?.trim() || null,
    event_date: form.event_date,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { error: null }
}

export async function toggleEventLock(eventId: string, isLocked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('events')
    .update({ is_locked: isLocked })
    .eq('id', eventId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventId}`)
  return { error: null }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ============================================================
// TRANSACTION ACTIONS
// ============================================================

export async function createTransaction(eventId: string, form: CreateTransactionForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Cek event tidak terkunci
  const { data: event } = await supabase
    .from('events')
    .select('is_locked')
    .eq('id', eventId)
    .single()

  if (event?.is_locked) return { error: 'Event sudah terkunci' }

  let proofUrl: string | null = null

  // Upload gambar jika ada
  if (form.proof_file) {
    if (!validateFileSize(form.proof_file)) {
      return { error: 'Ukuran file melebihi 2MB' }
    }

    const fileName = generateFileName(user.id, form.proof_file)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, form.proof_file, { upsert: false })

    if (uploadError) return { error: `Upload gagal: ${uploadError.message}` }

    const { data: { publicUrl } } = supabase.storage
      .from('proofs')
      .getPublicUrl(uploadData.path)

    proofUrl = publicUrl
  }

  const amount = parseInt(form.amount.replace(/\D/g, ''), 10)
  if (!amount || amount <= 0) return { error: 'Nominal tidak valid' }

  const { error } = await supabase.from('transactions').insert({
    event_id: eventId,
    type: form.type,
    amount,
    description: form.description.trim(),
    transaction_date: form.transaction_date,
    proof_url: proofUrl,
  })

  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

export async function deleteTransaction(transactionId: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) return { error: error.message }
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

// ============================================================
// GLOBAL BALANCE ACTIONS (Admin only)
// ============================================================

export async function updateGlobalBalance(form: UpdateBalanceForm) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Cek admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Hanya admin yang dapat mengubah saldo' }

  const newBalance = parseInt(form.new_balance.replace(/\D/g, ''), 10)
  if (isNaN(newBalance)) return { error: 'Saldo tidak valid' }

  // Ambil saldo lama
  const { data: current } = await supabase
    .from('global_balance')
    .select('total_balance')
    .eq('id', 1)
    .single()

  // Update saldo
  const { error: updateError } = await supabase
    .from('global_balance')
    .update({ total_balance: newBalance })
    .eq('id', 1)

  if (updateError) return { error: updateError.message }

  // Catat audit
  const { error: auditError } = await supabase.from('balance_audit').insert({
    old_balance: current?.total_balance ?? 0,
    new_balance: newBalance,
    reason: form.reason.trim(),
    updated_by: user.id,
  })

  if (auditError) return { error: auditError.message }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard')
  return { error: null }
}
