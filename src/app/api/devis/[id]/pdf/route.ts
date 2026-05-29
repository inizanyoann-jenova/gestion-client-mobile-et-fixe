import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { DevisFinanceTemplate } from '@/lib/pdf/devis-finance-template'
import React from 'react'
import type { DevisPdfData } from '@/lib/pdf/finance-pdf-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const [devisRes, settingsRes] = await Promise.all([
    supabase
      .from('devis')
      .select('*, lignes:devis_lignes(*), client:clients(id, nom, adresse, siret)')
      .eq('id', id)
      .single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', ['entreprise_nom', 'entreprise_adresse', 'entreprise_telephone', 'entreprise_email', 'entreprise_siret']),
  ])

  if (devisRes.error || !devisRes.data) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  const d = devisRes.data
  const client = d.client as unknown as { nom: string; adresse: string | null; siret: string | null }
  const lignes = (d.lignes as unknown as Array<{
    libelle: string; quantite: number; unite: string
    prix_unitaire: number; taux_tva: number; total_ht: number; ordre: number
  }>).sort((a, b) => a.ordre - b.ordre)

  const pdfData: DevisPdfData = {
    numero: d.numero,
    date_emission: d.date_emission,
    date_validite: d.date_validite,
    client: { nom: client.nom, adresse: client.adresse, siret: client.siret },
    lignes,
    montant_ht: d.montant_ht,
    montant_tva: d.montant_tva,
    montant_ttc: d.montant_ttc,
    notes: d.notes,
    entreprise: {
      nom: settings['entreprise_nom'] ?? 'ATEXIA',
      adresse: settings['entreprise_adresse'] || undefined,
      telephone: settings['entreprise_telephone'] || undefined,
      email: settings['entreprise_email'] || undefined,
      siret: settings['entreprise_siret'] || undefined,
    },
  }

  const buffer = Buffer.from(
    await renderToBuffer(
      React.createElement(DevisFinanceTemplate, { data: pdfData }) as React.ReactElement<React.ComponentProps<typeof Document>>,
    ),
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${d.numero}.pdf"`,
    },
  })
}
