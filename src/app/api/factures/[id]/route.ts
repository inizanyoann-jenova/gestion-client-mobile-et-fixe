import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FactureUpdateSchema } from '@/lib/validations/finance'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('factures')
    .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre), devis:devis(numero)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = FactureUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: existing } = await supabase
    .from('factures')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  if (existing.statut === 'payée') {
    return NextResponse.json({ error: 'Facture déjà payée' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('factures')
    .update({
      statut: 'payée',
      date_paiement: parsed.data.date_paiement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
