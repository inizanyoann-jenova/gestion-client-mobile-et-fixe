import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ConvertirSchema } from '@/lib/validations/finance'
import { nextNumero, facturePrefix } from '@/lib/utils/numero'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = ConvertirSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select('*, lignes:devis_lignes(*)')
    .eq('id', id)
    .single()

  if (devisError || !devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (devis.statut !== 'accepté') {
    return NextResponse.json({ error: 'Le devis doit être accepté pour créer une facture' }, { status: 409 })
  }

  const year = new Date().getFullYear()
  const prefix = facturePrefix(year)

  const { data: lastFacture } = await supabase
    .from('factures')
    .select('numero')
    .like('numero', `${prefix}%`)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  type FactureToCreate = {
    type: 'facture' | 'acompte' | 'solde'
    numero: string
    montant_ht: number
    montant_tva: number
    montant_ttc: number
    pourcentage_acompte: number | null
  }

  const facturesToCreate: FactureToCreate[] = []

  if (parsed.data.mode === 'unique') {
    const numero = nextNumero(prefix, lastFacture?.numero ?? null)
    facturesToCreate.push({
      type: 'facture',
      numero,
      montant_ht: Number(devis.montant_ht),
      montant_tva: Number(devis.montant_tva),
      montant_ttc: Number(devis.montant_ttc),
      pourcentage_acompte: null,
    })
  } else {
    const pct = parsed.data.pourcentage_acompte
    const round2 = (n: number) => Math.round(n * 100) / 100
    const aHt = round2(Number(devis.montant_ht) * pct / 100)
    const aTva = round2(Number(devis.montant_tva) * pct / 100)
    const aTtc = round2(aHt + aTva)
    const sHt = round2(Number(devis.montant_ht) - aHt)
    const sTva = round2(Number(devis.montant_tva) - aTva)
    const sTtc = round2(sHt + sTva)

    const num1 = nextNumero(prefix, lastFacture?.numero ?? null)
    const num2 = nextNumero(prefix, num1)

    facturesToCreate.push(
      { type: 'acompte', numero: num1, montant_ht: aHt, montant_tva: aTva, montant_ttc: aTtc, pourcentage_acompte: pct },
      { type: 'solde', numero: num2, montant_ht: sHt, montant_tva: sTva, montant_ttc: sTtc, pourcentage_acompte: null },
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const echeance = new Date()
  echeance.setDate(echeance.getDate() + 30)
  const dateEcheance = echeance.toISOString().slice(0, 10)

  type LigneSource = {
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }
  const lignesSource = devis.lignes as unknown as LigneSource[]

  const createdFactures = []
  for (const f of facturesToCreate) {
    const { data: facture, error: fErr } = await supabase
      .from('factures')
      .insert({
        numero: f.numero,
        devis_id: id,
        client_id: devis.client_id,
        projet_id: devis.projet_id,
        type: f.type,
        date_emission: today,
        date_echeance: dateEcheance,
        montant_ht: f.montant_ht,
        montant_tva: f.montant_tva,
        montant_ttc: f.montant_ttc,
        pourcentage_acompte: f.pourcentage_acompte,
      })
      .select()
      .single()

    if (fErr || !facture) return NextResponse.json({ error: fErr?.message ?? 'Erreur création facture' }, { status: 500 })

    await supabase.from('factures_lignes').insert(
      lignesSource.map((l) => ({
        facture_id: facture.id,
        libelle: l.libelle,
        quantite: l.quantite,
        unite: l.unite,
        prix_unitaire: l.prix_unitaire,
        taux_tva: l.taux_tva,
        total_ht: l.total_ht,
        ordre: l.ordre,
      })),
    )

    createdFactures.push(facture)
  }

  return NextResponse.json({ factures: createdFactures }, { status: 201 })
}
