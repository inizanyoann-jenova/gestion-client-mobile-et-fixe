import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { FactureTemplate } from '@/lib/pdf/facture-template'
import React from 'react'
import type { FacturePdfData } from '@/lib/pdf/finance-pdf-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [factureRes, settingsRes] = await Promise.all([
    supabase
      .from('factures')
      .select('*, lignes:factures_lignes(*), client:clients(id, nom, adresse, siret), devis:devis(numero)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret', 'rib_iban', 'rib_bic', 'rib_banque']),
  ])

  if (factureRes.error || !factureRes.data) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  const f = factureRes.data
  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const client = f.client as unknown as { nom: string; adresse: string | null; siret: string | null }
  const devis = f.devis as unknown as { numero: string } | null
  const lignes = (f.lignes as unknown as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: FacturePdfData = {
    numero: f.numero,
    type: f.type as 'facture' | 'acompte' | 'solde',
    date_emission: f.date_emission,
    date_echeance: f.date_echeance,
    devis_numero: devis?.numero ?? null,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: f.montant_ht,
    montant_tva: f.montant_tva,
    montant_ttc: f.montant_ttc,
    pourcentage_acompte: f.pourcentage_acompte,
    notes: f.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
      rib_iban: settings['rib_iban'] || undefined,
      rib_bic: settings['rib_bic'] || undefined,
      rib_banque: settings['rib_banque'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(FactureTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${f.numero}.pdf"`,
    },
  })
}
