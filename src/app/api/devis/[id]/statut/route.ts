import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DevisStatutSchema } from '@/lib/validations/finance'

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

  const parsed = DevisStatutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: existing } = await supabase
    .from('devis')
    .select('statut')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  if (existing.statut !== 'envoyé') {
    return NextResponse.json({ error: 'Le devis doit être en statut envoyé pour changer de statut' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('devis')
    .update({ statut: parsed.data.statut, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
