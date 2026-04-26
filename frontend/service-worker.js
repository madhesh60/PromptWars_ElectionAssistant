/**
 * service-worker.js
 * Background worker for push notifications and offline caching capabilities.
 */

const CACHE_NAME = 'electo-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/voice.js',
  '/chat.js',
  '/agent.js',
  '/scraper/eci_fetcher.js',
  '/timeline/three_timeline.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      // Don't fail install if cache fails, as this is a simple demo
      return cache
        .addAll(ASSETS_TO_CACHE)
        .catch((err) => console.warn('Cache error (ignored for demo):', err))
    }),
  )
})

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate strategy for the app
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Handle messages from the main thread (e.g., scheduling reminders)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDERS') {
    const { data } = event.data
    console.log('Service Worker received schedule data:', data)

    // In a true push system, we would subscribe to a push service here.
    // For demonstration, we will just show a notification immediately to prove it works.
    // A real implementation requires a backend to send push events at the right time.

    self.registration.showNotification('Electo Reminders Active', {
      body: 'You will be notified 1 day before key election events.',
      icon: 'https://cdn-icons-png.flaticon.com/512/8282/8282119.png', // Example ballot icon
      badge: 'https://cdn-icons-png.flaticon.com/512/8282/8282119.png',
    })
  }
})

// Handle real push events (from a backend server)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Election Alert',
    body: 'An important date is approaching.',
  }
  if (event.data) {
    data = event.data.json()
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/8282/8282119.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})
