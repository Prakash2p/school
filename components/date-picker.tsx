"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  onSelect?: (date?: Date) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function DatePicker({
  date,
  onSelect,
  disabled = false,
  className,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  // Update internal state when prop changes
  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleSelect = (day?: Date) => {
    setSelectedDate(day)
    onSelect?.(day)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker mode="single" selected={selectedDate} onSelect={handleSelect} className="border-none" />
      </PopoverContent>
    </Popover>
  )
}
