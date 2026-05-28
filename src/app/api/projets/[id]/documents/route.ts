import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DocumentUploadSchema } from '@/lib/validations/document'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: projet_id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('projet_id', projet_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: projet_id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const metaRaw = formData.get('meta')
  let meta: { nom?: string; type?: string; description?: string } = {}
  if (metaRaw && typeof metaRaw === 'string') {
    try { meta = JSON.parse(metaRaw) } catch { /* ignore */ }
  }

  const parsed = DocumentUploadSchema.safeParse({
    nom: meta.nom ?? file.name,
    type: meta.type ?? 'autre',
    description: meta.description ?? null,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `projets/${projet_id}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({
      projet_id,
      nom: parsed.data.nom,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
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
