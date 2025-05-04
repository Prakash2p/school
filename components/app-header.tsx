"use client"

import { useState, useEffect } from "react"
import { DaySelector } from "@/components/day-selector"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogIn, LogOut, Shield, User, UserCog, Clock } from "lucide-react"
import type { AdminUser } from "@/lib/types"

interface AppHeaderProps {
  title: string
  selectedDay: string
  onSelectDay: (day: string) => void
  isAdmin: boolean
  currentUser?: AdminUser
  onLoginClick: () => void
  onLogout: () => void
  onManageAdmins?: () => void
  onManageAccount?: () => void
  availableDays?: string[]
}

export function AppHeader({
  title,
  selectedDay,
  onSelectDay,
  isAdmin,
  currentUser,
  onLoginClick,
  onLogout,
  onManageAdmins,
  onManageAccount,
  availableDays,
}: AppHeaderProps) {
  const [nepalTime, setNepalTime] = useState<string>("")

  // Update Nepal time every second
  useEffect(() => {
    const updateNepalTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }

      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kathmandu",
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }

      const timeString = new Intl.DateTimeFormat("en-US", options).format(new Date())
      const dateString = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date())
      setNepalTime(`${dateString}, ${timeString}`)
    }

    // Update immediately
    updateNepalTime()

    // Then update every second
    const interval = setInterval(updateNepalTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center sm:items-start">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex items-center text-white/90 text-sm mt-1 bg-sky-700/40 px-2 py-1 rounded-md">
              <Clock className="h-4 w-4 mr-1" />
              <span className="font-medium">{nepalTime}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <DaySelector selectedDay={selectedDay} onSelectDay={onSelectDay} availableDays={availableDays} />

            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/30 hover:bg-white/20 text-white">
                    <User className="mr-2 h-4 w-4" />
                    {currentUser?.name || "Admin"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onManageAccount?.()}>
                    <UserCog className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  {currentUser?.role === "SuperAdmin" && (
                    <DropdownMenuItem onClick={() => onManageAdmins?.()}>
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Administrators
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                className="bg-white/10 border-white/30 hover:bg-white/20 text-white"
                onClick={onLoginClick}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
