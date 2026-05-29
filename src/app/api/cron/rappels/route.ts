import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'
import { relanceFactureEmailHtml } from '@/lib/email/relance-facture-template'
import { sendPushNotification } from '@/lib/notifications/push'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()

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

  const toEmail = process.env.NOTIF_EMAIL
  if (!toEmail) {
    return NextResponse.json({ error: 'NOTIF_EMAIL manquant' }, { status: 500 })
  }

  const { data: pushSubscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  const expiredEndpoints: string[] = []
  let emailSent = 0
  let pushSent = 0

  for (const tache of taches ?? []) {
    const echeance = new Date(tache.date_echeance!)
    const isToday = echeance >= today && echeance < tomorrow
    const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
    const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null
    const pushTitle = isToday ? `⏰ Aujourd'hui : ${tache.titre}` : `🔔 Demain : ${tache.titre}`
    const pushBody = [clientNom, projetTitre].filter(Boolean).join(' — ')

    if (tache.notification_email) {
      const dateEcheance = echeance.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      const { error: emailError } = await resend.emails.send({
        from: 'ATEXIA CRM <notifications@atexia.re>',
        to: toEmail,
        subject: isToday
          ? `⏰ Tâche aujourd'hui : ${tache.titre}`
          : `🔔 Rappel demain : ${tache.titre}`,
        html: rappelEmailHtml({ titreTache: tache.titre, dateEcheance, clientNom, projetTitre, isToday }),
      })
      if (!emailError) emailSent++
    }

    if (tache.notification_push) {
      for (const sub of pushSubscriptions ?? []) {
        try {
          await sendPushNotification(sub, { title: pushTitle, body: pushBody, url: '/taches' })
          pushSent++
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          const isExpired = statusCode === 410 || statusCode === 404
          if (isExpired && !expiredEndpoints.includes(sub.endpoint)) {
            expiredEndpoints.push(sub.endpoint)
          }
        }
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }

  // ─── Finance : mise à jour des statuts et relances ───────────────────────

  const todayStr = today.toISOString().slice(0, 10)

  // 1. Passer en_retard les factures émises dont l'échéance est dépassée
  await supabase
    .from('factures')
    .update({ statut: 'en_retard', updated_at: new Date().toISOString() })
    .eq('statut', 'émise')
    .lt('date_echeance', todayStr)

  // 2. Passer expiré les devis envoyés dont la date_validite est dépassée
  await supabase
    .from('devis')
    .update({ statut: 'expiré', updated_at: new Date().toISOString() })
    .eq('statut', 'envoyé')
    .lt('date_validite', todayStr)

  // 3. Relances factures en retard (J+7 et J+30)
  const j7 = new Date(today)
  j7.setDate(j7.getDate() - 7)
  const j30 = new Date(today)
  j30.setDate(j30.getDate() - 30)

  const j7Str = j7.toISOString().slice(0, 10)
  const j30Str = j30.toISOString().slice(0, 10)

  const { data: facturesRelance } = await supabase
    .from('factures')
    .select('*, client:clients(nom)')
    .eq('statut', 'en_retard')
    .in('date_echeance', [j7Str, j30Str])

  let relancesSent = 0

  for (const facture of facturesRelance ?? []) {
    if (!toEmail) continue
    const joursRetard = facture.date_echeance === j7Str ? 7 : 30
    const clientNom = (facture.client as unknown as { nom: string } | null)?.nom ?? 'Client'
    const { error: relanceError } = await resend.emails.send({
      from: 'ATEXIA CRM <notifications@atexia.re>',
      to: toEmail,
      subject: `${joursRetard === 30 ? '🚨 Relance ferme' : '⚠️ Relance'} — Facture ${facture.numero}`,
      html: relanceFactureEmailHtml({
        numeroFacture: facture.numero,
        montantTtc: Number(facture.montant_ttc),
        dateEcheance: facture.date_echeance,
        clientNom,
        joursRetard,
      }),
    })
    if (!relanceError) relancesSent++
  }

  return NextResponse.json({
    processed: (taches ?? []).length,
    emailSent,
    pushSent,
    expiredCleaned: expiredEndpoints.length,
    relancesSent,
  })
}
