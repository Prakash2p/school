"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToPDF, exportToExcel } from "@/lib/utils"
import { FileText, FileSpreadsheet, Calendar, Download, Loader2, CalendarDays } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { Teacher, Subject, Period, Schedule, ClassGrade, SchoolDay, AcademicSession } from "@/lib/types"

interface ExportToolsProps {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  selectedDay: string
  schoolDays?: SchoolDay[] // Make schoolDays optional
  academicSessions?: AcademicSession[] // Make academicSessions optional
  selectedSessionId?: string
}

export function ExportTools({
  teachers,
  subjects,
  periods,
  schedules,
  classGrades,
  selectedDay,
  schoolDays = [], // Provide default empty array
  academicSessions = [], // Provide default empty array
  selectedSessionId = "all",
}: ExportToolsProps) {
  const { toast } = useToast()
  const [exportDay, setExportDay] = useState(selectedDay)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<"pdf" | "excel" | null>(null)
  const [previewVisible, setPreviewVisible] = useState(true)
  const [exportMode, setExportMode] = useState<"single" | "weekly">("single")
  const [exportQuality, setExportQuality] = useState<"standard" | "high">("high") // Default to high quality
  const [exportSessionId, setExportSessionId] = useState(selectedSessionId)

  // Get active days from schoolDays with null check
  const activeDays = useMemo(
    () =>
      schoolDays?.filter((day) => day.active)?.map((day) => day.name) || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ], // Default active days
    [schoolDays],
  )

  // Get active academic session
  const activeSession = useMemo(() => {
    if (exportSessionId && exportSessionId !== "all") {
      return academicSessions.find((session) => session.id === exportSessionId)
    }
    return academicSessions.find((session) => session.isActive)
  }, [academicSessions, exportSessionId])

  // Filter schedules for the selected export day and session
  const daySchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (schedule.day !== exportDay) return false
      if (exportSessionId !== "all" && schedule.academicSessionId !== exportSessionId) return false
      return true
    })
  }, [schedules, exportDay, exportSessionId])

  // Reset export type after completion
  useEffect(() => {
    if (!isExporting) {
      const timer = setTimeout(() => setExportType(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [isExporting])

  // Update export day when selected day changes
  useEffect(() => {
    setExportDay(selectedDay)
  }, [selectedDay])

  // Update export session when selected session changes
  useEffect(() => {
    setExportSessionId(selectedSessionId)
  }, [selectedSessionId])

  if (!teachers?.length || !subjects?.length || !periods?.length || !classGrades?.length) {
    return (
      <Card className="border-sky-100">
        <CardHeader className="bg-sky-50 rounded-t-lg">
          <CardTitle className="text-sky-700 flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No data available for export. Please add teachers, subjects, periods, and classes first.
        </CardContent>
      </Card>
    )
  }

  const handleExportToPDF = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportType("pdf")

    try {
      if (exportMode === "weekly" && !activeDays?.length) {
        throw new Error("No active school days configured")
      }

      // Show loading toast
      toast({
        title: "Preparing PDF Export",
        description: "Creating high-quality A4 landscape PDF. This may take a moment...",
      })

      if (exportMode === "single") {
        // Export single day
        const sessionName = activeSession ? ` - ${activeSession.name}` : ""
        const success = await exportToPDF("export-schedule-grid", `${exportDay}_schedule${sessionName}`)
        if (success) {
          toast({
            title: "Export Successful",
            description: `${exportDay} schedule has been exported to PDF in A4 landscape format`,
          })
        } else {
          throw new Error("Failed to export")
        }
      } else {
        // Export weekly schedule
        toast({
          title: "Preparing Weekly Export",
          description: "Generating PDF for all days. This may take a moment...",
        })

        const container = document.createElement("div")
        container.id = "weekly-export-container"
        container.style.width = "297mm" // A4 landscape width
        container.style.height = "210mm" // A4 landscape height
        container.style.padding = "10mm" // 1cm margin
        container.style.boxSizing = "border-box"
        document.body.appendChild(container)

        // Render weekly schedule
        renderWeeklySchedule(container)

        // Export the container to PDF
        const sessionName = activeSession ? ` - ${activeSession.name}` : ""
        const success = await exportToPDF("weekly-export-container", `Weekly_Schedule${sessionName}`)

        // Remove the temporary container
        document.body.removeChild(container)

        if (success) {
          toast({
            title: "Export Successful",
            description: "Weekly schedule has been exported to PDF in A4 landscape format",
          })
        } else {
          throw new Error("Failed to export weekly schedule")
        }
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export as PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setIsExporting(false), 600)
    }
  }

  const handleExportToExcel = () => {
    if (isExporting) return
    setIsExporting(true)
    setExportType("excel")

    try {
      if (exportMode === "single") {
        // Export single day
        const sessionName = activeSession ? activeSession.name : undefined
        const success = exportToExcel(
          daySchedules,
          teachers,
          subjects,
          periods,
          classGrades,
          exportDay,
          `${exportDay}_schedule${activeSession ? `_${activeSession.name.replace(/\s+/g, "_")}` : ""}`,
          undefined,
          undefined,
          sessionName,
        )
        if (success) {
          toast({
            title: "Export Successful",
            description: `${exportDay} schedule has been exported to Excel`,
          })
        } else {
          throw new Error("Failed to export")
        }
      } else {
        // Export weekly schedule
        const success = exportWeeklyToExcel()
        if (success) {
          toast({
            title: "Export Successful",
            description: "Weekly schedule has been exported to Excel",
          })
        } else {
          throw new Error("Failed to export weekly schedule")
        }
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export as Excel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setIsExporting(false), 600)
    }
  }

  const renderWeeklySchedule = (container: HTMLElement) => {
    if (!activeDays?.length) {
      container.innerHTML = '<p class="text-center text-gray-500 p-4">No active school days configured.</p>'
      return
    }

    // Add a title for the weekly schedule
    const titleElement = document.createElement("h1")
    titleElement.textContent = "Weekly School Schedule"
    titleElement.style.textAlign = "center"
    titleElement.style.marginBottom = "20px"
    titleElement.style.fontSize = "24px"
    titleElement.style.fontWeight = "bold"
    titleElement.style.color = "#0369a1" // sky-700
    container.appendChild(titleElement)

    // Add academic session if available
    if (activeSession) {
      const sessionElement = document.createElement("h2")
      sessionElement.textContent = `Academic Session: ${activeSession.name}`
      sessionElement.style.textAlign = "center"
      sessionElement.style.marginBottom = "15px"
      sessionElement.style.fontSize = "18px"
      sessionElement.style.color = "#0369a1" // sky-700
      container.appendChild(sessionElement)
    }

    // Add generation timestamp
    const timestampElement = document.createElement("p")
    timestampElement.textContent = `Generated on ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })} (Nepal Time)`
    timestampElement.style.textAlign = "right"
    timestampElement.style.fontSize = "12px"
    timestampElement.style.color = "#666"
    timestampElement.style.marginBottom = "20px"
    container.appendChild(timestampElement)

    activeDays.forEach((day) => {
      // Filter schedules for the current day and session
      const daySchedules = schedules.filter((schedule) => {
        if (schedule.day !== day) return false
        if (exportSessionId !== "all" && schedule.academicSessionId !== exportSessionId) return false
        return true
      })

      const dayElement = document.createElement("div")
      dayElement.style.marginBottom = "30px"
      dayElement.style.pageBreakAfter = "always"

      const dayTitle = document.createElement("h2")
      dayTitle.textContent = `${day} Schedule`
      dayTitle.style.fontSize = "20px"
      dayTitle.style.fontWeight = "bold"
      dayTitle.style.color = "#0369a1"
      dayTitle.style.marginBottom = "10px"
      dayTitle.style.borderBottom = "2px solid #e5e7eb"
      dayTitle.style.paddingBottom = "8px"

      dayElement.appendChild(dayTitle)
      dayElement.innerHTML += renderScheduleTable(daySchedules, day)
      container.appendChild(dayElement)
    })
  }

  const renderScheduleTable = (schedules: Schedule[], day?: string) => {
    // Sort periods by start time
    const sortedPeriods = [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))

    let table = `
  <div style="padding: 0; font-family: Arial, sans-serif; width: 100%;">
    <table style="width:100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; margin: 0 auto;">
      <thead>
        <tr>
          <th style="border: 1px solid #000; padding: 6px; background-color: #f2f2f2; font-size: 11px; width: 12%;">Class</th>
          ${sortedPeriods
            .map((period) => {
              const width = `${88 / sortedPeriods.length}%`
              const bgColor = period.isInterval ? "#fff8e1" : "#f2f2f2"
              return `
                <th style="border: 1px solid #000; padding: 6px; background-color: ${bgColor}; font-size: 11px; width: ${width};">
                  <div style="font-weight: bold; ${period.isInterval ? "color: #b45309;" : ""}">${period.name}</div>
                  <div style="font-size: 10px; color: #666;">${period.startTime} - ${period.endTime}</div>
                </th>
              `
            })
            .join("")}
        </tr>
      </thead>
      <tbody>
`

    classGrades.forEach((classGrade) => {
      table += `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #f8f9fa; font-size: 11px;">${classGrade.name}</td>
        ${sortedPeriods
          .map((period) => {
            if (period.isInterval) {
              return `
                <td style="border: 1px solid #000; padding: 6px; background-color: #fff8e1; font-size: 11px;">
                  <div style="font-weight: bold; color: #b45309; text-align: center;">${period.name}</div>
                </td>
              `
            }

            const schedule = schedules.find((s) => s.classId === classGrade.id && s.periodId === period.id)
            if (schedule) {
              const teacher = teachers.find((t) => t.id === schedule.teacherId)
              const subject = subjects.find((s) => s.id === schedule.subjectId)
              return `
                <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">
                  <div style="font-weight: bold; color: #0369a1;">${subject?.name || ""}</div>
                  <div style="font-size: 10px; color: #4b5563;">${teacher?.name || ""}</div>
                </td>
              `
            } else {
              return `
                <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">
                  <div style="color: #9ca3af; font-style: italic;">No class</div>
                </td>
              `
            }
          })
          .join("")}
      </tr>
    `
    })

    table += `
        </tbody>
      </table>
    </div>
  `

    return table
  }

  const exportWeeklyToExcel = () => {
    if (!activeDays?.length) {
      toast({
        title: "Export Failed",
        description: "No active school days configured",
        variant: "destructive",
      })
      return false
    }

    try {
      const XLSX = require("xlsx")
      const wb = XLSX.utils.book_new()

      activeDays.forEach((day) => {
        // Filter schedules for the current day and session
        const daySchedules = schedules.filter((schedule) => {
          if (schedule.day !== day) return false
          if (exportSessionId !== "all" && schedule.academicSessionId !== exportSessionId) return false
          return true
        })

        const ws = createWorksheet(daySchedules, day)
        XLSX.utils.book_append_sheet(wb, ws, day)
      })

      // Add teacher workload sheet
      const teacherData = [["Teacher", "Assigned Periods"]]
      teachers.forEach((teacher) => {
        const workload = schedules.filter((s) => {
          if (s.teacherId !== teacher.id) return false
          if (exportSessionId !== "all" && s.academicSessionId !== exportSessionId) return false
          return true
        }).length
        teacherData.push([teacher.name, workload.toString()])
      })

      const teacherWs = XLSX.utils.aoa_to_sheet(teacherData)
      XLSX.utils.book_append_sheet(wb, teacherWs, "Teacher Workload")

      // Add session info to filename if available
      const sessionName = activeSession ? `_${activeSession.name.replace(/\s+/g, "_")}` : ""

      // Write to file - Use browser-compatible method
      XLSX.writeFile(wb, `Weekly_Schedule${sessionName}.xlsx`, { bookType: "xlsx", type: "binary" })

      return true
    } catch (error) {
      console.error("Error creating Excel file:", error)
      return false
    }
  }

  const createWorksheet = (daySchedules: Schedule[], day: string) => {
    const XLSX = require("xlsx")
    const sortedPeriods = [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))

    const headerRow = [`${day} Schedule - Class`]
    sortedPeriods.forEach((p) => {
      headerRow.push(`${p.name} (${p.startTime}-${p.endTime})${p.isInterval ? " - Break" : ""}`)
    })

    const data = [headerRow]

    classGrades.forEach((classGrade) => {
      const row = [classGrade.name]
      sortedPeriods.forEach((period) => {
        if (period.isInterval) {
          // For breaks/intervals, add a special label
          row.push(`[${period.name}]`)
        } else {
          const schedule = daySchedules.find((s) => s.classId === classGrade.id && s.periodId === period.id)
          if (schedule) {
            const teacher = teachers.find((t) => t.id === schedule.teacherId)
            const subject = subjects.find((s) => s.id === schedule.subjectId)
            row.push(`${subject?.name || ""} - ${teacher?.name || ""}`)
          } else {
            row.push("No class")
          }
        }
      })
      data.push(row)
    })

    return XLSX.utils.aoa_to_sheet(data)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-sky-100 overflow-hidden shadow-md">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center">
              <Download className="mr-2 h-5 w-5 text-sky-600" />
              <CardTitle className="text-sky-700">Export Schedule</CardTitle>
            </div>
            <CardDescription className="text-sky-600">
              Export the schedule in different formats for easy sharing
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="single" onValueChange={(value) => setExportMode(value as "single" | "weekly")}>
              <TabsList className="mb-4 grid grid-cols-2 w-full max-w-md mx-auto">
                <TabsTrigger value="single" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Single Day</span>
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>Weekly Schedule</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                    <div className="w-full sm:w-64">
                      <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-sky-500" />
                        Select Day to Export
                      </label>
                      <Select value={exportDay} onValueChange={setExportDay}>
                        <SelectTrigger className="border-sky-200 focus:ring-sky-500 transition-all hover:border-sky-400">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {academicSessions.length > 0 && (
                      <div className="w-full sm:w-64">
                        <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-sky-500" />
                          Academic Session
                        </label>
                        <Select value={exportSessionId} onValueChange={setExportSessionId}>
                          <SelectTrigger className="border-sky-200 focus:ring-sky-500 transition-all hover:border-sky-400">
                            <SelectValue placeholder="Select session" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sessions</SelectItem>
                            {academicSessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {session.name} {session.isActive && "(Active)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleExportToPDF}
                          disabled={isExporting || daySchedules.length === 0}
                          className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm transition-all ${
                            exportType === "pdf" && isExporting ? "opacity-80" : ""
                          }`}
                        >
                          {exportType === "pdf" && isExporting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Export as PDF (A4 Landscape)
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleExportToExcel}
                          disabled={isExporting || daySchedules.length === 0}
                          className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm transition-all ${
                            exportType === "excel" && isExporting ? "opacity-80" : ""
                          }`}
                        >
                          {exportType === "excel" && isExporting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Export as Excel
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">Preview</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewVisible(!previewVisible)}
                      className="text-sky-600 border-sky-200 hover:bg-sky-50"
                    >
                      {previewVisible ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {previewVisible && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div
                          id="export-schedule-grid"
                          className="bg-white p-4 rounded-lg border border-sky-100 shadow-sm"
                          dangerouslySetInnerHTML={{ __html: renderScheduleTable(daySchedules, exportDay) }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="weekly">
                <div className="space-y-6">
                  {academicSessions.length > 0 && (
                    <div className="w-full sm:w-64 mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-sky-500" />
                        Academic Session
                      </label>
                      <Select value={exportSessionId} onValueChange={setExportSessionId}>
                        <SelectTrigger className="border-sky-200 focus:ring-sky-500 transition-all hover:border-sky-400">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {academicSessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.name} {session.isActive && "(Active)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-medium text-blue-700 flex items-center mb-2">
                      <CalendarDays className="h-5 w-5 mr-2" />
                      Weekly Schedule Export
                    </h3>
                    <p className="text-blue-600 mb-4">
                      Export the complete schedule for all active school days in a single file.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="text-sm text-blue-700">Active days:</div>
                      {activeDays.map((day) => (
                        <span key={day} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {day}
                        </span>
                      ))}
                    </div>

                    {activeSession && (
                      <div className="text-sm text-blue-700 mt-2">
                        Selected session: <span className="font-medium">{activeSession.name}</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleExportToPDF}
                          disabled={isExporting}
                          className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm transition-all ${
                            exportType === "pdf" && isExporting ? "opacity-80" : ""
                          }`}
                        >
                          {exportType === "pdf" && isExporting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              Export Weekly as PDF (A4 Landscape)
                            </>
                          )}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={handleExportToExcel}
                          disabled={isExporting}
                          className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm transition-all ${
                            exportType === "excel" && isExporting ? "opacity-80" : ""
                          }`}
                        >
                          {exportType === "excel" && isExporting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Export Weekly as Excel
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
