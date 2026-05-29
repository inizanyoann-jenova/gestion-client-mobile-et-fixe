import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  let signedUrl: string | null = null
  if (doc.storage_path) {
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 3600)
    signedUrl = urlData?.signedUrl ?? null
  }

  return NextResponse.json({ ...doc, signed_url: signedUrl })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError || !doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  if (doc.storage_path) {
    await supabase.storage.from('documents').remove([doc.storage_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
