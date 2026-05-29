import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DocumentListQuerySchema, DocumentGlobalUploadSchema } from '@/lib/validations/document'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const parsed = DocumentListQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { type, client_id, page } = parsed.data
  const PER_PAGE = 20
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from('documents')
    .select('*, client:clients(id, nom), projet:projets(id, titre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type) query = query.eq('type', type)
  if (client_id) query = query.eq('client_id', client_id)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ documents: data, total: count ?? 0, page, perPage: PER_PAGE })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const metaRaw = formData.get('meta')
  let meta: { nom?: string; type?: string; description?: string; client_id?: string; projet_id?: string } = {}
  if (metaRaw && typeof metaRaw === 'string') {
    try { meta = JSON.parse(metaRaw) } catch { /* ignore */ }
  }

  const parsed = DocumentGlobalUploadSchema.safeParse({
    nom: meta.nom ?? file.name,
    type: meta.type ?? 'autre',
    description: meta.description ?? null,
    client_id: meta.client_id ?? null,
    projet_id: meta.projet_id ?? null,
  })
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `standalone/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      nom: parsed.data.nom,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      client_id: parsed.data.client_id ?? null,
      projet_id: parsed.data.projet_id ?? null,
      storage_path: storagePath,
      taille_octets: file.size,
      genere_par_app: false,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
