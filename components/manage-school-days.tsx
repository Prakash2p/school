"use client"

import { useState, useEffect } from "react"
import type { SchoolDay } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Sun, Moon, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ManageSchoolDaysProps {
  schoolDays: SchoolDay[]
  onUpdateSchoolDays: (schoolDays: SchoolDay[]) => void
}

export function ManageSchoolDays({ schoolDays, onUpdateSchoolDays }: ManageSchoolDaysProps) {
  const { toast } = useToast()
  const [days, setDays] = useState<SchoolDay[]>(schoolDays)
  const [hasChanges, setHasChanges] = useState(false)
  const [allDaysDisabled, setAllDaysDisabled] = useState(false)

  // Check if all days are disabled
  useEffect(() => {
    const activeCount = days.filter((day) => day.active).length
    setAllDaysDisabled(activeCount === 0)
  }, [days])

  const handleToggleDay = (dayName: string) => {
    const updatedDays = days.map((day) => {
      if (day.name === dayName) {
        return { ...day, active: !day.active }
      }
      return day
    })

    // Check if this would disable all days
    const activeCount = updatedDays.filter((day) => day.active).length
    if (activeCount === 0) {
      toast({
        title: "Warning",
        description: "At least one day must be active",
        variant: "destructive",
      })
      return
    }

    setDays(updatedDays)
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    onUpdateSchoolDays(days)
    setHasChanges(false)

    toast({
      title: "Success",
      description: "School days updated successfully",
    })
  }

  const handleResetChanges = () => {
    setDays(schoolDays)
    setHasChanges(false)
  }

  // Get day icon based on name
  const getDayIcon = (dayName: string) => {
    switch (dayName) {
      case "Sunday":
        return <Sun className="h-5 w-5 text-amber-500" />
      case "Saturday":
        return <Moon className="h-5 w-5 text-indigo-500" />
      default:
        return <Calendar className="h-5 w-5 text-sky-500" />
    }
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700 flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Manage School Days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <p className="text-gray-600">
            Configure which days of the week are school days. Inactive days will not be available for scheduling.
          </p>

          {allDaysDisabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                At least one day must be active. Please enable at least one school day.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {days.map((day) => (
              <div
                key={day.name}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  day.active ? "bg-sky-50/50 border-sky-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getDayIcon(day.name)}
                  <span className={`font-medium ${day.active ? "text-sky-700" : "text-gray-500"}`}>{day.name}</span>
                </div>
                <Switch
                  checked={day.active}
                  onCheckedChange={() => handleToggleDay(day.name)}
                  className={day.active ? "data-[state=checked]:bg-sky-500" : ""}
                />
              </div>
            ))}
          </div>

          {hasChanges && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleResetChanges}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} className="bg-sky-500 hover:bg-sky-600">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
