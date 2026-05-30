import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SearchResult } from '@/lib/search/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json({ clients: [], projets: [], contacts: [], devis: [] })
  }

  const [clientsRes, projetsRes, contactsRes, devisRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, nom, adresse')
      .ilike('nom', `%${q}%`)
      .limit(5),
    supabase
      .from('projets')
      .select('id, titre, statut')
      .ilike('titre', `%${q}%`)
      .limit(5),
    supabase
      .from('contacts')
      .select('id, nom, prenom, email, telephone, client_id')
      .or(`nom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('devis')
      .select('id, numero, statut')
      .ilike('numero', `%${q}%`)
      .limit(5),
  ])

  const result: SearchResult = {
    clients: clientsRes.data ?? [],
    projets: projetsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    devis: devisRes.data ?? [],
  }
  return NextResponse.json(result)
}
