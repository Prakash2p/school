"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, X, Lock, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>
  onCancel: () => void
}

export function LoginForm({ onLogin, onCancel }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState(0)

  useEffect(() => {
    if (attempts >= 5) {
      setIsLocked(true)
      setLockoutTimer(300) // 5 minutes in seconds
    }
  }, [attempts])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLocked && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false)
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isLocked, lockoutTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLocked) {
      setError(`Account locked. Try again in ${Math.ceil(lockoutTimer / 60)} minutes`)
      return
    }

    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setIsSubmitting(true)

    try {
      const success = await onLogin(username, password)
      if (!success) {
        setAttempts((prev) => prev + 1)
        setError(`Invalid username or password. ${5 - attempts} attempts remaining`)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred. Please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md border-sky-100 relative shadow-lg">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>

          <CardHeader className="space-y-1 bg-gradient-to-r from-sky-100 to-blue-50 rounded-t-lg">
            <CardTitle className="text-2xl text-center text-sky-700 font-bold">Administrator Login</CardTitle>
            <CardDescription className="text-center text-sky-600">
              Enter your credentials to access the schedule management system
            </CardDescription>
            <CardDescription className="text-center text-sky-600 font-semibold">
              Default: username "admin" / password "admin123"
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive" className="mb-4 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="username"
                    className={`transition-colors ${isFocused === "username" ? "text-sky-700" : "text-gray-600"}`}
                  >
                    Username
                  </Label>
                  <div
                    className={`flex items-center border rounded-md px-3 transition-all ${
                      isFocused === "username" ? "border-sky-500 ring-1 ring-sky-500 bg-sky-50" : "border-gray-200"
                    }`}
                  >
                    <User className={`h-4 w-4 mr-2 ${isFocused === "username" ? "text-sky-500" : "text-gray-400"}`} />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setIsFocused("username")}
                      onBlur={() => setIsFocused(null)}
                      disabled={isLocked}
                      className="border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="password"
                    className={`transition-colors ${isFocused === "password" ? "text-sky-700" : "text-gray-600"}`}
                  >
                    Password
                  </Label>
                  <div
                    className={`flex items-center border rounded-md px-3 transition-all ${
                      isFocused === "password" ? "border-sky-500 ring-1 ring-sky-500 bg-sky-50" : "border-gray-200"
                    }`}
                  >
                    <Lock className={`h-4 w-4 mr-2 ${isFocused === "password" ? "text-sky-500" : "text-gray-400"}`} />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFocused("password")}
                      onBlur={() => setIsFocused(null)}
                      disabled={isLocked}
                      className="border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter>
            <motion.div
              className="w-full"
              whileHover={{ scale: isLocked ? 1 : 1.01 }}
              whileTap={{ scale: isLocked ? 1 : 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                className={`w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md transition-all ${
                  isSubmitting || isLocked ? "opacity-80" : ""
                }`}
                onClick={handleSubmit}
                disabled={isSubmitting || isLocked}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                    Processing...
                  </div>
                ) : isLocked ? (
                  `Locked (${Math.floor(lockoutTimer / 60)}:${(lockoutTimer % 60).toString().padStart(2, "0")})`
                ) : (
                  "Login"
                )}
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
