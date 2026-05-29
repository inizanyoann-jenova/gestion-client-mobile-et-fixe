// Gestion des notifications push reçues par le navigateur
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'ATEXIA CRM'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/taches' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data.url
      for (const client of clientList) {
        try {
          const clientPath = new URL(client.url).pathname
          const targetPath = new URL(targetUrl, self.location.origin).pathname
          if (clientPath === targetPath && 'focus' in client) {
            return client.focus()
          }
        } catch {
          // URL parsing failed, skip
        }
      }
      return clients.openWindow(event.notification.data.url)
    })
  )
})
