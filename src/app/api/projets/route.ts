import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProjetCreateSchema } from '@/lib/validations/projet'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const sp = request.nextUrl.searchParams
  const search = sp.get('search') ?? ''
  const statut = sp.get('statut') ?? ''
  const secteur = sp.get('secteur') ?? ''
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(sp.get('limit') ?? '10'))
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('projets')
    .select('*, client:clients(id, nom)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('titre', `%${search}%`)
  }
  if (statut) query = query.eq('statut', statut)
  if (secteur) query = query.eq('secteur', secteur)

  const { data: projets, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ projets: projets ?? [], total: count ?? 0, page })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = ProjetCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('projets')
    .insert(parsed.data)
    .select('*, client:clients(id, nom)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
