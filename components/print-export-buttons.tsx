"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileText, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { exportToPDF, exportToExcel, printSchedule } from "@/lib/utils"
import type { Teacher, Subject, Period, Schedule, ClassGrade, AcademicSession } from "@/lib/types"

interface PrintExportButtonsProps {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  selectedDay: string
  selectedTeacherId?: string
  selectedClassId?: string
  elementId: string
  fileName?: string
  academicSession?: AcademicSession
}

export function PrintExportButtons({
  teachers,
  subjects,
  periods,
  schedules,
  classGrades,
  selectedDay,
  selectedTeacherId,
  selectedClassId,
  elementId,
  fileName = "schedule",
  academicSession,
}: PrintExportButtonsProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  // Generate a descriptive filename
  const getFileName = () => {
    let name = `${selectedDay}_Schedule`

    if (selectedTeacherId && selectedTeacherId !== "all") {
      const teacher = teachers.find((t) => t.id === selectedTeacherId)
      if (teacher) name += `_${teacher.name.replace(/\s+/g, "_")}`
    }

    if (selectedClassId && selectedClassId !== "all") {
      const classGrade = classGrades.find((c) => c.id === selectedClassId)
      if (classGrade) name += `_${classGrade.name.replace(/\s+/g, "_")}`
    }

    if (academicSession) {
      name += `_${academicSession.name.replace(/\s+/g, "_")}`
    }

    // Add date to filename
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0] // YYYY-MM-DD format
    name += `_${dateStr}`

    return name
  }

  const handlePrint = () => {
    // Prepare the element for printing
    const element = document.getElementById(elementId)
    if (!element) {
      toast({
        title: "Print Error",
        description: "Could not find the schedule to print",
        variant: "destructive",
      })
      return
    }

    // Hide current period indicators before printing
    const currentPeriodIndicators = element.querySelectorAll(".current-period-indicator, .current-period")
    currentPeriodIndicators.forEach((indicator) => {
      if (indicator instanceof HTMLElement) {
        indicator.classList.add("print-hidden")
      }
    })

    // Make sure all overflow containers are visible for printing
    const overflowContainers = element.querySelectorAll(".overflow-x-auto, .overflow-y-auto")
    overflowContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        container.classList.add("print-expanded")
      }
    })

    // Temporarily adjust table styles for better printing
    const tables = element.querySelectorAll("table")
    tables.forEach((table) => {
      table.style.tableLayout = "fixed"
      table.style.width = "100%"
    })

    // Print the schedule with the day in the title
    printSchedule(elementId, `${selectedDay} Schedule${academicSession ? ` - ${academicSession.name}` : ""}`)

    // Remove the temporary class and restore styles after printing
    setTimeout(() => {
      overflowContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.classList.remove("print-expanded")
        }
      })

      // Restore original table styles
      tables.forEach((table) => {
        table.style.tableLayout = ""
      })

      // Restore current period indicators
      currentPeriodIndicators.forEach((indicator) => {
        if (indicator instanceof HTMLElement) {
          indicator.classList.remove("print-hidden")
        }
      })
    }, 1000)
  }

  const handleExportToPDF = async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      // Show loading toast
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF in A4 landscape format...",
      })

      const success = await exportToPDF(elementId, getFileName())

      if (success) {
        toast({
          title: "Export Successful",
          description: `Schedule has been exported to PDF in A4 landscape format`,
        })
      } else {
        throw new Error("Failed to export")
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export as PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      const success = exportToExcel(
        schedules,
        teachers,
        subjects,
        periods,
        classGrades,
        selectedDay,
        getFileName(),
        selectedTeacherId,
        selectedClassId,
        academicSession?.name,
      )
      if (success) {
        toast({
          title: "Export Successful",
          description: `Schedule has been exported to Excel`,
        })
      } else {
        throw new Error("Failed to export")
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export as Excel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
      >
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToPDF}
        disabled={isExporting}
        className="bg-white text-red-600 border-red-200 hover:bg-red-50"
      >
        <FileText className="mr-2 h-4 w-4" />
        PDF (A4 Landscape)
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToExcel}
        disabled={isExporting}
        className="bg-white text-green-600 border-green-200 hover:bg-green-50"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
    </div>
  )
}
