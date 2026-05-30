import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'documents'
const prefix = (id: string) => `chantier-photos/${id}/`

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const { data: files } = await supabase.storage.from(BUCKET).list(prefix(id), {
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (!files || files.length === 0) return NextResponse.json({ photos: [] })

  const paths = files.map((f) => `${prefix(id)}${f.name}`)
  const { data: signedUrls } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 3600)

  const photos = (signedUrls ?? []).map((s, i) => ({
    name: files[i]?.name ?? '',
    signedUrl: s.signedUrl,
    path: s.path,
  }))

  return NextResponse.json({ photos })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('photo')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Fichier doit être une image' }, { status: 422 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const storagePath = `${prefix(id)}${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, path: storagePath })
}
