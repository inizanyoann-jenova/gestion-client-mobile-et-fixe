import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rappelEmailHtml } from '@/lib/email/rappel-template'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const SendEmailSchema = z.object({
  tacheId: z.string().uuid(),
  isToday: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = SendEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data: tache, error: tacheError } = await supabase
    .from('taches')
    .select('*, client:clients(nom), projet:projets(titre)')
    .eq('id', parsed.data.tacheId)
    .single()

  if (tacheError || !tache) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  const dateEcheance = tache.date_echeance
    ? new Date(tache.date_echeance).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : 'Non définie'

  const clientNom = (tache.client as { nom: string } | null)?.nom ?? null
  const projetTitre = (tache.projet as { titre: string } | null)?.titre ?? null

  const { error: emailError } = await resend.emails.send({
    from: 'ATEXIA CRM <notifications@atexia.re>',
    to: user.email!,
    subject: parsed.data.isToday
      ? `⏰ Tâche aujourd'hui : ${tache.titre}`
      : `🔔 Rappel demain : ${tache.titre}`,
    html: rappelEmailHtml({
      titreTache: tache.titre,
      dateEcheance,
      clientNom,
      projetTitre,
      isToday: parsed.data.isToday,
    }),
  })

  if (emailError) {
    return NextResponse.json({ error: emailError.message }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
