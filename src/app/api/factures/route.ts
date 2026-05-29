import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FactureCreateSchema, FactureListQuerySchema } from '@/lib/validations/finance'
import { computeTotaux, computeTotalHtLigne } from '@/lib/utils/finance-totaux'
import { nextNumero, facturePrefix } from '@/lib/utils/numero'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = FactureListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { client_id, projet_id, statut, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('factures')
    .select('*, client:clients(id, nom)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (client_id) query = query.eq('client_id', client_id)
  if (projet_id) query = query.eq('projet_id', projet_id)
  if (statut) query = query.eq('statut', statut)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ factures: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = FactureCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const year = new Date().getFullYear()
  const prefix = facturePrefix(year)

  const { data: lastFacture } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = nextNumero(prefix, lastFacture?.numero ?? null)
  const { lignes: lignesInput, ...factureData } = parsed.data
  const totaux = computeTotaux(lignesInput)

  const { data: facture, error: factureError } = await supabase
    .from('factures')
    .insert({ ...factureData, numero, ...totaux })
    .select()
    .single()

  if (factureError) return NextResponse.json({ error: factureError.message }, { status: 500 })

  if (lignesInput.length > 0) {
    const lignesRows = lignesInput.map((l, i) => ({
      facture_id: facture.id,
      libelle: l.libelle,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      taux_tva: l.taux_tva,
      total_ht: computeTotalHtLigne(l.quantite, l.prix_unitaire),
      ordre: l.ordre ?? i,
    }))
    const { error: lignesError } = await supabase.from('factures_lignes').insert(lignesRows)
    if (lignesError) return NextResponse.json({ error: lignesError.message }, { status: 500 })
  }

  return NextResponse.json(facture, { status: 201 })
}
