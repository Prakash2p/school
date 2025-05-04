/**
 * A safe storage adapter for Lowdb that works in both browser and server environments
 */

// Define a generic interface for storage adapters
export interface StorageAdapter<T> {
  read: () => Promise<T | null>
  write: (data: T) => Promise<void>
}

// Browser localStorage adapter
export class BrowserStorage<T> implements StorageAdapter<T> {
  private key: string

  constructor(key: string) {
    this.key = key
  }

  async read(): Promise<T | null> {
    try {
      const data = localStorage.getItem(this.key)
      if (data === null) {
        return null
      }
      return JSON.parse(data) as T
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return null
    }
  }

  async write(data: T): Promise<void> {
    try {
      localStorage.setItem(this.key, JSON.stringify(data))
    } catch (error) {
      console.error("Error writing to localStorage:", error)
    }
  }
}

// Memory storage adapter for SSR/non-browser environments
export class MemoryStorage<T> implements StorageAdapter<T> {
  private data: T | null = null

  async read(): Promise<T | null> {
    return this.data
  }

  async write(data: T): Promise<void> {
    this.data = data
  }
}

// Factory function to create the appropriate storage adapter
export function createStorage<T>(key: string, defaultData: T): StorageAdapter<T> {
  if (typeof window !== "undefined" && window.localStorage) {
    return new BrowserStorage<T>(key)
  }
  return new MemoryStorage<T>()
}
