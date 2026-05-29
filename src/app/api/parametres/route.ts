import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EntrepriseSchema, PARAMETRES_CLES } from '@/lib/validations/parametres'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('app_settings')
    .select('cle, valeur')
    .in('cle', PARAMETRES_CLES)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings = Object.fromEntries((data ?? []).map((r) => [r.cle, r.valeur ?? '']))
  return NextResponse.json(settings)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = EntrepriseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const upserts = Object.entries(parsed.data)
    .filter(([, v]) => v !== undefined)
    .map(([cle, valeur]) => ({ cle, valeur: valeur ?? null, updated_at: new Date().toISOString() }))

  const { error } = await supabase.from('app_settings').upsert(upserts, { onConflict: 'cle' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
