import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'

type Params = { params: Promise<{ id: string; contactId: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: client_id, contactId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  if (parsed.data.est_principal) {
    await supabase
      .from('contacts')
      .update({ est_principal: false })
      .eq('client_id', client_id)
      .neq('id', contactId)
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(parsed.data)
    .eq('id', contactId)
    .eq('client_id', client_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { id: client_id, contactId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('client_id', client_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
