import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushNotification } from '@/lib/notifications/push'
import { z } from 'zod'

const PushSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional().default(''),
  url: z.string().optional().default('/taches'),
})

export async function POST(request: NextRequest) {
  const authClient = await createClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

  const parsed = PushSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  const expired: string[] = []

  for (const sub of subscriptions ?? []) {
    try {
      await sendPushNotification(sub, parsed.data)
      sent++
    } catch (err) {
      const isExpired =
        err instanceof Error &&
        (err.message.includes('410') || err.message.includes('404'))
      if (isExpired) expired.push(sub.endpoint)
    }
  }

  if (expired.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expired)
  }

  return NextResponse.json({ sent, expired: expired.length })
}
