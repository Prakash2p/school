export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope)
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err)
        })
    })
  }
}

export function triggerBackgroundSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return registration.sync.register("sync-data")
      })
      .catch((err) => {
        console.error("Background sync failed:", err)
      })
  }
}
