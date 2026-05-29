'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export function PushPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
      if (Notification.permission === 'granted') setSubscribed(true)
    }
  }, [])

  const subscribe = async () => {
    setIsSubscribing(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('Clé VAPID manquante')

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      const p256dhKey = sub.getKey('p256dh')
      const authKey = sub.getKey('auth')
      if (!p256dhKey || !authKey) throw new Error('Clés de souscription manquantes')

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)))
      const auth = btoa(String.fromCharCode(...new Uint8Array(authKey)))

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, p256dh, auth }),
      })

      if (!res.ok) throw new Error('Erreur sauvegarde abonnement')
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSubscribing(false)
    }
  }

  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  if (subscribed) {
    return (
      <p className="text-green-400 text-sm flex items-center gap-1.5">
        <span>✓</span> Notifications push activées
      </p>
    )
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-white text-sm font-medium">Activer les notifications push</p>
        <p className="text-slate-400 text-xs mt-0.5">
          Recevez des rappels même quand l&apos;application est fermée.
        </p>
      </div>
      <button
        onClick={subscribe}
        disabled={isSubscribing || permission === 'denied'}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-sky-400 transition-colors"
      >
        {isSubscribing ? 'Activation…' : 'Activer'}
      </button>
      {permission === 'denied' && (
        <p className="text-red-400 text-xs">
          Notifications bloquées dans le navigateur. Modifiez les paramètres du site.
        </p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
