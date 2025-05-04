import { db } from "./db"
import type { AdminUser, Session } from "./types"
import { generateUniqueId } from "./data"
import * as bcrypt from "bcryptjs"

const SALT_ROUNDS = 12
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// In-memory token storage for the current session
let currentToken: string | null = null

export class AuthService {
  private static instance: AuthService

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async hashPassword(password: string): Promise<string> {
    // Skip during SSR
    if (typeof window === "undefined") {
      return password // Just return the password during SSR
    }
    return await bcrypt.hash(password, SALT_ROUNDS)
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  async createSession(userId: string): Promise<Session> {
    // Skip during SSR
    if (typeof window === "undefined") {
      return {
        id: "ssr-placeholder",
        userId,
        token: "ssr-placeholder",
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
    }

    const session: Session = {
      id: generateUniqueId(),
      userId,
      token: generateUniqueId() + generateUniqueId(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
      createdAt: new Date().toISOString(),
    }

    await db.createSession(session)
    return session
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await db.getSessionByToken(token)
    if (!session) return false

    const now = new Date()
    const expiresAt = new Date(session.expiresAt)

    if (now > expiresAt) {
      await db.deleteSession(session.id)
      return false
    }

    return true
  }

  async login(username: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
    const user = await db.getAdminByUsername(username)
    if (!user) return null

    // For demo purposes, allow direct password comparison
    // In production, use proper password hashing
    const isValid = user.passwordHash === password
    if (!isValid) return null

    const session = await this.createSession(user.id)
    await db.updateAdminLastLogin(user.id)

    // Store the token in memory for the current session
    currentToken = session.token

    return {
      user: {
        ...user,
        passwordHash: "[REDACTED]", // Don't send password hash to client
      },
      token: session.token,
    }
  }

  // Save token to memory
  async saveToken(token: string): Promise<void> {
    currentToken = token
  }

  // Get token from memory
  getStoredToken(): string | null {
    return currentToken
  }

  // Clear token from memory
  clearStoredToken(): void {
    currentToken = null
  }

  async logout(token: string): Promise<void> {
    const session = await db.getSessionByToken(token)
    if (session) {
      await db.deleteSession(session.id)
    }
    this.clearStoredToken()
  }

  async validateToken(token: string): Promise<AdminUser | null> {
    const isValid = await this.validateSession(token)
    if (!isValid) return null

    const session = await db.getSessionByToken(token)
    if (!session) return null

    const user = await db.getAdminById(session.userId)
    if (!user) return null

    return {
      ...user,
      passwordHash: "[REDACTED]", // Don't send password hash to client
    }
  }

  async ensureDefaultAdmin(): Promise<void> {
    // Skip during SSR
    if (typeof window === "undefined") {
      return
    }

    // Check if any admin exists
    const admins = await db.getAllAdmins()

    if (admins.length === 0) {
      // Create default admin if none exists
      const defaultAdmin: AdminUser = {
        id: generateUniqueId(),
        username: "admin",
        passwordHash: "admin123", // In production, use proper hashing
        role: "SuperAdmin",
        name: "System Administrator",
        email: "admin@example.com",
        createdAt: new Date().toISOString(),
      }

      await db.createAdmin(defaultAdmin)
    }
  }
}

export const authService = AuthService.getInstance()
