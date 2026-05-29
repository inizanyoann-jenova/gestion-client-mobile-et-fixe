import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document } from '@react-pdf/renderer'
import { RapportTemplate } from '@/lib/pdf/rapport-template'
import { DevisTemplate } from '@/lib/pdf/devis-template'
import { buildRapportData, buildDevisData, type LigneDevis } from '@/lib/pdf/pdf-data'
import { z } from 'zod'
import React from 'react'

const GeneratePdfSchema = z.object({
  type: z.enum(['rapport', 'devis']),
  projet_id: z.string().uuid(),
  client_id: z.string().uuid(),
  resume: z.string().max(5000).optional(),
  lignes: z
    .array(
      z.object({
        description: z.string(),
        quantite: z.number().positive(),
        prixUnitaire: z.number().nonnegative(),
      }),
    )
    .optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = GeneratePdfSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, projet_id, client_id, resume, lignes } = parsed.data

  const [clientRes, projetRes, settingsRes] = await Promise.all([
    supabase.from('clients').select('nom, adresse, siret').eq('id', client_id).single(),
    supabase.from('projets').select('titre, type, secteur').eq('id', projet_id).single(),
    supabase
      .from('app_settings')
      .select('cle, valeur')
      .in('cle', [
        'entreprise_nom',
        'entreprise_adresse',
        'entreprise_telephone',
        'entreprise_email',
      ]),
  ])

  if (clientRes.error || projetRes.error) {
    return NextResponse.json({ error: 'Client ou projet introuvable' }, { status: 404 })
  }

  const settings = Object.fromEntries(
    (settingsRes.data ?? []).map((r) => [r.cle, r.valeur ?? '']),
  )
  const entreprise = {
    nom: settings['entreprise_nom'] ?? 'ATEXIA',
    adresse: settings['entreprise_adresse'] || undefined,
    telephone: settings['entreprise_telephone'] || undefined,
    email: settings['entreprise_email'] || undefined,
  }

  let pdfBuffer: Buffer
  let nomFichier: string

  if (type === 'rapport') {
    const data = buildRapportData({
      client: clientRes.data,
      projet: projetRes.data,
      resume: resume ?? '—',
      entreprise,
    })
    pdfBuffer = Buffer.from(
      await renderToBuffer(
        React.createElement(RapportTemplate, { data }) as React.ReactElement<React.ComponentProps<typeof Document>>,
      ),
    )
    nomFichier = `rapport-${data.reference}.pdf`
  } else {
    const data = buildDevisData({
      client: clientRes.data,
      projet: projetRes.data,
      lignes: (lignes ?? []) as LigneDevis[],
      entreprise,
    })
    pdfBuffer = Buffer.from(
      await renderToBuffer(
        React.createElement(DevisTemplate, { data }) as React.ReactElement<React.ComponentProps<typeof Document>>,
      ),
    )
    nomFichier = `devis-${data.reference}.pdf`
  }

  const storagePath = `documents/${user.id}/${nomFichier}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: `Erreur upload Storage: ${uploadError.message}` },
      { status: 500 },
    )
  }

  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert({
      client_id,
      projet_id,
      type,
      nom: nomFichier,
      storage_path: storagePath,
      taille_octets: pdfBuffer.length,
      genere_par_app: true,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json(doc, { status: 201 })
}
