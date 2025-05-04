"use client"

import { days } from "@/lib/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DaySelectorProps {
  selectedDay: string
  onSelectDay: (day: string) => void
  availableDays?: string[]
}

export function DaySelector({ selectedDay, onSelectDay, availableDays }: DaySelectorProps) {
  // Use available days if provided, otherwise use all days
  const displayDays = availableDays || days

  return (
    <div className="w-full sm:w-40 md:w-48">
      <Select value={selectedDay} onValueChange={onSelectDay}>
        <SelectTrigger className="bg-white/20 border-white/30 focus:ring-white text-white h-9">
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent>
          {displayDays.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
