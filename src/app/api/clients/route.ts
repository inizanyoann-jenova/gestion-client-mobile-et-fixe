import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sp = request.nextUrl.searchParams
  const search = sp.get('search') ?? ''
  const statut = sp.get('statut') ?? ''
  const secteur = sp.get('secteur') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(sp.get('limit') ?? '20'))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('clients')
    .select('id, nom, statut, secteur', { count: 'exact' })
    .order('nom')
    .range(from, to)

  if (search) query = query.ilike('nom', `%${search}%`)
  if (statut) query = query.eq('statut', statut)
  if (secteur) query = query.eq('secteur', secteur)

  const { data: clients, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ clients: clients ?? [], total: count ?? 0, page })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
