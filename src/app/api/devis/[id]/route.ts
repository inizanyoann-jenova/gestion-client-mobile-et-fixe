import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DevisUpdateSchema } from '@/lib/validations/finance'
import { computeTotaux, computeTotalHtLigne } from '@/lib/utils/finance-totaux'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret), projet:projets(id, titre)')
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

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'brouillon') {
    return NextResponse.json({ error: 'Seul un devis en brouillon peut être modifié' }, { status: 409 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = DevisUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { lignes: lignesInput, ...devisData } = parsed.data
  const totaux = computeTotaux(lignesInput)

  const { data: devis, error: updateError } = await supabase
    .from('devis')
    .update({ ...devisData, ...totaux, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('devis_lignes').delete().eq('devis_id', id)

  if (lignesInput.length > 0) {
    const lignesRows = lignesInput.map((l, i) => ({
      devis_id: id,
      prestation_id: l.prestation_id ?? null,
      libelle: l.libelle,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      total_ht: computeTotalHtLigne(l.quantite, l.prix_unitaire),
      ordre: l.ordre ?? i,
    }))
    await supabase.from('devis_lignes').insert(lignesRows)
  }

  return NextResponse.json(devis)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'brouillon') {
    return NextResponse.json({ error: 'Seul un devis en brouillon peut être supprimé' }, { status: 409 })
  }

  const { error } = await supabase.from('devis').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
