import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('fr-FR')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const annee = searchParams.get('annee') ?? String(new Date().getFullYear())

  const { data: factures, error } = await supabase
    .from('factures')
    .select(
      'numero, date_emission, date_echeance, montant_ht, montant_tva, montant_ttc, statut, type, client:clients(nom)'
    )
    .gte('date_emission', `${annee}-01-01`)
    .lte('date_emission', `${annee}-12-31`)
    .order('date_emission', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (factures ?? []).map((f) => {
    const client = f.client as unknown as { nom: string } | null
    return {
      Numéro: f.numero,
      Client: client?.nom ?? '',
      Type: f.type,
      'Date émission': formatDate(f.date_emission),
      'Date échéance': formatDate(f.date_echeance),
      'Montant HT': Number(f.montant_ht).toFixed(2),
      'TVA (8,5%)': Number(f.montant_tva).toFixed(2),
      'Montant TTC': Number(f.montant_ttc).toFixed(2),
      Statut: f.statut,
    }
  })

  // TVA recap by month
  const tvaByMonth = new Map<string, { ht: number; tva: number; ttc: number }>()
  for (const f of factures ?? []) {
    const mois = f.date_emission.slice(0, 7)
    const prev = tvaByMonth.get(mois) ?? { ht: 0, tva: 0, ttc: 0 }
    tvaByMonth.set(mois, {
      ht: prev.ht + Number(f.montant_ht),
      tva: prev.tva + Number(f.montant_tva),
      ttc: prev.ttc + Number(f.montant_ttc),
    })
  }

  const tvaRows = [...tvaByMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, t]) => ({
      Mois: mois,
      'Total HT': t.ht.toFixed(2),
      'Total TVA': t.tva.toFixed(2),
      'Total TTC': t.ttc.toFixed(2),
    }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Factures')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tvaRows), 'TVA par mois')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="atexia-factures-${annee}.xlsx"`,
    },
  })
}
