// Service Worker for SARC Scheduler
const CACHE_NAME = "sarc-scheduler-cache-v1"
const OFFLINE_URL = "/offline.html"

const urlsToCache = ["/", "/offline.html", "/globals.css", "/favicon.ico"]

// Install event - cache basic assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache")
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  // Skip certain URLs that should never be cached
  if (event.request.url.includes("/api/")) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((fetchResponse) => {
          // Check if we received a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
            return fetchResponse
          }

          // Clone the response
          const responseToCache = fetchResponse.clone()

          // Add the response to the cache for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return fetchResponse
        })
        .catch((error) => {
          // For HTML navigation requests, serve the offline page
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match(OFFLINE_URL)
          }

          // Otherwise just fail
          console.error("Fetch error:", error)
          throw error
        })
    }),
  )
})

// Listen for sync events to handle background syncing
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Code to sync data from indexedDB to the server when online
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_COMPLETED",
    })
  })
}
