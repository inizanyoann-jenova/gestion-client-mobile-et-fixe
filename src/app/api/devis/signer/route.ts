import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushNotification } from '@/lib/notifications/push'
import { z } from 'zod'

const SignerSchema = z.object({
  token: z.string().uuid(),
  signe_par: z.string().min(2).max(200),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const parsed = SignerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { token, signe_par } = parsed.data
  const supabase = createServiceClient()

  const { data: tokenRow, error } = await supabase
    .from('devis_tokens')
    .select('id, devis_id, expires_at, signed_at')
    .eq('token', token)
    .single()

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Lien de signature invalide ou introuvable' }, { status: 404 })
  }

  if (tokenRow.signed_at) {
    return NextResponse.json({ error: 'Ce devis a déjà été signé' }, { status: 409 })
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien de signature a expiré' }, { status: 410 })
  }

  const now = new Date().toISOString()

  await Promise.all([
    supabase
      .from('devis_tokens')
      .update({ signed_at: now, signe_par })
      .eq('id', tokenRow.id),
    supabase
      .from('devis')
      .update({ statut: 'accepté', updated_at: now })
      .eq('id', tokenRow.devis_id),
  ])

  // Push notification au patron
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  for (const sub of subscriptions ?? []) {
    try {
      await sendPushNotification(sub, {
        title: '✅ Devis signé !',
        body: `${signe_par} a accepté le devis.`,
        url: `/finances/devis/${tokenRow.devis_id}`,
      })
    } catch {
      // Ignorer les erreurs de push (subscription expirée, etc.)
    }
  }

  return NextResponse.json({ ok: true })
}
