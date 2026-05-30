// src/app/api/devis/[id]/envoyer-signature/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('id, numero, statut, montant_ttc, date_validite, client_id')
    .eq('id', id)
    .single()

  if (devisError || !devis) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  if (!['brouillon', 'envoyé'].includes(devis.statut)) {
    return NextResponse.json({ error: 'Ce devis ne peut plus être envoyé pour signature' }, { status: 400 })
  }

  // Get primary contact email, fallback to NOTIF_EMAIL
  const { data: contact } = await supabase
    .from('contacts')
    .select('email')
    .eq('client_id', devis.client_id)
    .eq('est_principal', true)
    .not('email', 'is', null)
    .limit(1)
    .maybeSingle()

  const toEmail: string | undefined = contact?.email ?? process.env.NOTIF_EMAIL
  if (!toEmail) return NextResponse.json({ error: 'Aucun email destinataire configuré' }, { status: 400 })

  const service = createServiceClient()

  const { data: tokenRow, error: tokenError } = await service
    .from('devis_tokens')
    .insert({ devis_id: id })
    .select('token')
    .single()

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: 'Erreur création du lien de signature' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const signUrl = `${appUrl}/devis/${tokenRow.token}`
  const montantTtc = Number(devis.montant_ttc).toFixed(2)

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA <notifications@atexia.re>',
    to: toEmail,
    subject: `Devis ${devis.numero} — Signature électronique`,
    html: `
      <p>Bonjour,</p>
      <p>Veuillez consulter et signer le devis <strong>${devis.numero}</strong> d'un montant TTC de <strong>${montantTtc} €</strong>.</p>
      <p>Valable jusqu'au ${devis.date_validite}.</p>
      <p><a href="${signUrl}" style="background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Consulter et signer le devis</a></p>
      <p style="color:#666;font-size:12px">Ce lien est valable 30 jours. Ne le transmettez pas à des tiers.</p>
    `.trim(),
  })

  if (emailError) {
    return NextResponse.json({ error: `Erreur email : ${emailError.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, token: tokenRow.token })
}
