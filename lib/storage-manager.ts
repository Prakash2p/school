/**
 * Manages persistent storage using localStorage with enhanced safety and reliability.
 */

import { debounce } from "lodash"

// Create a simple object with the storage manager methods
// This avoids class instantiation issues that might be causing the export problem
export const storageManager = {
  pendingChanges: false,

  saveData<T>(key: string, data: T): void {
    try {
      if (typeof window !== "undefined") {
        const serialized = JSON.stringify(data)
        localStorage.setItem(key, serialized)
        this.pendingChanges = false
      }
    } catch (error: any) {
      console.error(`Failed to save data for key ${key}:`, error)
    }
  },

  // Add the debouncedSave method
  debouncedSave: debounce(function <T>(key: string, data: T) {
    this.pendingChanges = true
    this.saveData(key, data)
  }, 300),

  loadData<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(key)
        if (item) {
          return JSON.parse(item) as T
        }
      }
    } catch (error: any) {
      console.error(`Failed to load data for key ${key}:`, error)
    }
    return defaultValue
  },

  clearData(key: string): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key)
      }
    } catch (error: any) {
      console.error(`Failed to clear data for key ${key}:`, error)
    }
  },

  isLocalStorageAvailable(): boolean {
    if (typeof window === "undefined") return false

    try {
      const testKey = "__storage_test__"
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (e: any) {
      return false
    }
  },

  // Initialize event listeners
  init() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        if (this.pendingChanges) {
          this.debouncedSave.flush()
        }
      })
    }
    return this
  },
}.init() // Initialize immediately
