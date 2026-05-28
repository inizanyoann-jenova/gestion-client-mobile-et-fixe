import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const { data: taches, error } = await supabase
    .from('taches')
    .select('*, client:clients(nom), projet:projets(titre)')
    .eq('statut', 'a_faire')
    .eq('notification_active', true)
    .gte('date_echeance', today.toISOString())
    .lt('date_echeance', dayAfterTomorrow.toISOString())

  if (error) {
    console.error('[cron/rappels] Erreur Supabase:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const toEmail = user?.email ?? process.env.NOTIF_EMAIL

  if (!toEmail) {
    return NextResponse.json({ error: 'Aucun email destinataire' }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const tache of taches ?? []) {
    if (!tache.notification_email) continue

    const echeance = new Date(tache.date_echeance!)
    const isToday = echeance >= today && echeance < tomorrow

    const dateEcheance = echeance.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
    const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null

    const { error: emailError } = await resend.emails.send({
      from: 'ATEXIA CRM <notifications@atexia.re>',
      to: toEmail,
      subject: isToday
        ? `⏰ Tâche aujourd'hui : ${tache.titre}`
        : `🔔 Rappel demain : ${tache.titre}`,
      html: rappelEmailHtml({
        titreTache: tache.titre,
        dateEcheance,
        clientNom,
        projetTitre,
        isToday,
      }),
    })

    if (emailError) {
      console.error(`[cron/rappels] Email failed for tache ${tache.id}:`, emailError)
      failed++
    } else {
      sent++
    }
  }

  return NextResponse.json({ processed: (taches ?? []).length, sent, failed })
}
