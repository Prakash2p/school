/**
 * Enhanced persistent storage utilities for the School Scheduler app
 */

import { debounce } from "lodash"

export class PersistentStorageManager {
  private static instance: PersistentStorageManager
  private pendingChanges = false

  private constructor() {
    // Initialize the storage manager
    this.setupStorageSyncListeners()
  }

  public static getInstance(): PersistentStorageManager {
    if (!PersistentStorageManager.instance) {
      PersistentStorageManager.instance = new PersistentStorageManager()
    }
    return PersistentStorageManager.instance
  }

  // Save data to localStorage with error handling and backup
  public saveData<T>(key: string, data: T): boolean {
    try {
      if (typeof window !== "undefined") {
        const serialized = JSON.stringify(data)
        localStorage.setItem(key, serialized)

        // Create a backup in sessionStorage as well
        sessionStorage.setItem(`${key}_backup`, serialized)
        this.pendingChanges = false
        return true
      }
    } catch (error: any) {
      console.error(`Failed to save data for key ${key}:`, error)
      this.handleStorageError()
    }
    return false
  }

  // Debounced save to prevent excessive writes - removed generic type parameter
  public debouncedSave = debounce((key: string, data: any): void => {
    this.pendingChanges = true
    this.saveData(key, data)
  }, 300)

  // Load data from localStorage with fallback strategies
  public loadData<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window !== "undefined") {
        // Try localStorage first
        const item = localStorage.getItem(key)

        if (item) {
          return JSON.parse(item) as T
        }

        // Try backup in sessionStorage
        const backupItem = sessionStorage.getItem(`${key}_backup`)
        if (backupItem) {
          const parsed = JSON.parse(backupItem) as T
          // Restore from backup to localStorage
          this.saveData(key, parsed)
          return parsed
        }
      }
    } catch (error: any) {
      console.error(`Failed to load data for key ${key}:`, error)
      this.handleStorageError()
    }
    return defaultValue
  }

  // Clear specific data from storage
  public clearData(key: string): boolean {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key)
        sessionStorage.removeItem(`${key}_backup`)
        return true
      }
    } catch (error: any) {
      console.error(`Failed to clear data for key ${key}:`, error)
    }
    return false
  }

  // Handle storage events to sync data across tabs
  private setupStorageSyncListeners(): void {
    if (typeof window !== "undefined") {
      // Listen for storage changes from other tabs
      window.addEventListener("storage", (event) => {
        if (event.key && event.key.endsWith("_backup")) {
          // Another tab updated data, sync if we don't have pending changes
          if (!this.pendingChanges) {
            const originalKey = event.key.replace("_backup", "")
            // Only update if we have this key in localStorage
            if (localStorage.getItem(originalKey) !== null) {
              localStorage.setItem(originalKey, event.newValue || "")
            }
          }
        }
      })

      // Save data before the page is unloaded
      window.addEventListener("beforeunload", () => {
        // If we have any debounced saves pending, flush them
        if (this.pendingChanges) {
          this.debouncedSave.flush()
        }
      })
    }
  }

  // Handle storage errors (quota exceeded, etc.)
  private handleStorageError(): void {
    try {
      if (typeof window !== "undefined") {
        // Try to clear non-essential data
        const nonEssentialKeys = ["last_viewed_page", "ui_preferences"]
        nonEssentialKeys.forEach((key) => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            /* ignore */
          }
          try {
            sessionStorage.removeItem(key)
          } catch (e) {
            /* ignore */
          }
        })
      }
    } catch (error: any) {
      console.error("Failed to handle storage error:", error)
    }
  }

  // Check if local storage is available and working
  public isLocalStorageAvailable(): boolean {
    if (typeof window === "undefined") return false

    try {
      const testKey = "__storage_test__"
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }
}

// Export a singleton instance
export const storageManager = PersistentStorageManager.getInstance()
