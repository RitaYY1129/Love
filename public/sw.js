const CACHE_NAME = 'love-diary-v5'
const BASE_URL = new URL(self.registration.scope).pathname
const appUrl = path => `${BASE_URL}${path}`
const APP_SHELL = [
  appUrl(''),
  appUrl('index.html'),
  appUrl('manifest.webmanifest'),
  appUrl('assets/img/icon-192.png'),
  appUrl('assets/img/icon-512.png')
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(appUrl(''), copy))
          return response
        })
        .catch(() => caches.match(appUrl('index.html')).then(response => response || caches.match(appUrl(''))))
    )
    return
  }

  if (new URL(event.request.url).origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkRequest = fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cached)

      return cached || networkRequest
    })
  )
})
