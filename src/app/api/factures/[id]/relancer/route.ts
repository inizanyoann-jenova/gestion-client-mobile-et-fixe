import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { relanceFactureEmailHtml } from '@/lib/email/relance-facture-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: facture, error } = await supabase
    .from('factures')
    .select('numero, montant_ttc, date_echeance, statut, client:clients(nom)')
    .eq('id', id)
    .single()

  if (error || !facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  if (!['émise', 'en_retard'].includes(facture.statut)) {
    return NextResponse.json({ error: 'Relance impossible pour ce statut' }, { status: 422 })
  }

  const toEmail = process.env.NOTIF_EMAIL
  if (!toEmail) return NextResponse.json({ error: 'NOTIF_EMAIL manquant' }, { status: 500 })

  const clientNom = (facture.client as unknown as { nom: string } | null)?.nom ?? 'Client'
  const joursRetard = Math.max(
    0,
    Math.floor((Date.now() - new Date(facture.date_echeance).getTime()) / 86_400_000)
  )

  const html = relanceFactureEmailHtml({
    numeroFacture: facture.numero,
    montantTtc: Number(facture.montant_ttc),
    dateEcheance: new Date(facture.date_echeance).toLocaleDateString('fr-FR'),
    clientNom,
    joursRetard,
  })

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA CRM <notifications@atexia.re>',
    to: toEmail,
    subject: `Relance manuelle — Facture ${facture.numero}`,
    html,
  })

  if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
