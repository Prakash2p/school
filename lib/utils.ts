import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Schedule, ClassGrade, Period, Teacher, Subject } from "./types"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueId() {
  return Math.random().toString(36).substring(2, 9)
}

// Improved teacher conflict detection
export function checkTeacherConflict(
  schedules: Schedule[],
  teacherId: string,
  periodId: string,
  day: string,
  currentScheduleId?: string,
): { hasConflict: boolean; conflictDetails?: { scheduleId: string; className: string; periodName: string } } {
  // Log parameters for debugging
  console.log("Checking teacher conflict with params:", { teacherId, periodId, day, currentScheduleId })

  // Find any schedule where:
  // 1. The teacher is the same
  // 2. The period is the same
  // 3. The day is the same
  // 4. It's not the current schedule being edited (if provided)
  const conflictingSchedule = schedules.find((schedule) => {
    const sameTeacher = schedule.teacherId === teacherId
    const samePeriod = schedule.periodId === periodId
    const sameDay = schedule.day === day
    const notCurrentSchedule = currentScheduleId ? schedule.id !== currentScheduleId : true

    // Log potential conflicts for debugging
    if (sameTeacher && samePeriod && sameDay) {
      console.log("Potential conflict found:", schedule, "Current ID:", currentScheduleId)
    }

    return sameTeacher && samePeriod && sameDay && notCurrentSchedule
  })

  if (conflictingSchedule) {
    console.log("Conflict confirmed:", conflictingSchedule)
    return {
      hasConflict: true,
      conflictDetails: {
        scheduleId: conflictingSchedule.id,
        className: conflictingSchedule.classId,
        periodName: conflictingSchedule.periodId,
      },
    }
  }

  return { hasConflict: false }
}

// Check if a class already has a subject scheduled at the same time
export function checkClassConflict(
  schedules: Schedule[],
  classId: string,
  periodId: string,
  day: string,
  currentScheduleId?: string,
): { hasConflict: boolean; conflictDetails?: { scheduleId: string; teacherName: string; subjectName: string } } {
  const conflictingSchedule = schedules.find(
    (schedule) =>
      schedule.classId === classId &&
      schedule.periodId === periodId &&
      schedule.day === day &&
      (currentScheduleId ? schedule.id !== currentScheduleId : true),
  )

  if (conflictingSchedule) {
    return {
      hasConflict: true,
      conflictDetails: {
        scheduleId: conflictingSchedule.id,
        teacherName: conflictingSchedule.teacherId,
        subjectName: conflictingSchedule.subjectId,
      },
    }
  }

  return { hasConflict: false }
}

// Get teacher workload (number of periods assigned)
export function getTeacherWorkload(schedules: Schedule[], teacherId: string): number {
  return schedules.filter((schedule) => schedule.teacherId === teacherId).length
}

// Enhanced exportToPDF function for high-quality A4 landscape exports
export async function exportToPDF(elementId: string, fileName = "schedule"): Promise<boolean> {
  try {
    console.log("Starting PDF export process for element:", elementId)
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`)
    }

    // Create a deep clone to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement
    clone.id = `${elementId}-clone`
    clone.style.position = "absolute"
    clone.style.left = "-9999px"
    clone.style.top = "0"
    clone.style.width = "297mm" // A4 landscape width
    clone.style.backgroundColor = "#ffffff"
    clone.style.padding = "10mm" // 1cm margin
    clone.style.zIndex = "-1000"
    clone.style.fontSize = "10pt" // Standard font size for documents
    clone.style.fontFamily = "Arial, sans-serif" // Use a standard font

    // Add a title to the clone
    const titleDiv = document.createElement("div")
    titleDiv.innerHTML = `<h1 style="text-align: center; color: #0369a1; margin-bottom: 15px; font-size: 18pt; font-weight: bold;">${fileName} - School Schedule</h1>`
    clone.insertBefore(titleDiv, clone.firstChild)

    // Add timestamp
    const timestampDiv = document.createElement("div")
    timestampDiv.innerHTML = `<div style="text-align: right; font-size: 8pt; color: #666; margin-bottom: 10px;">Generated on ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })} (Nepal Time)</div>`
    clone.insertBefore(timestampDiv, clone.firstChild.nextSibling)

    // Remove current period indicators
    const currentPeriodIndicators = clone.querySelectorAll(".current-period-indicator, .current-period")
    currentPeriodIndicators.forEach((indicator) => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator)
      }
    })

    // Fix overflow containers
    const overflowContainers = clone.querySelectorAll(".overflow-x-auto, .overflow-y-auto, .overflow-hidden")
    overflowContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        container.style.overflow = "visible"
        container.style.maxWidth = "none"
        container.style.maxHeight = "none"
      }
    })

    // Optimize tables for A4 landscape paper
    const tables = clone.querySelectorAll("table")
    tables.forEach((table) => {
      if (table instanceof HTMLElement) {
        table.style.width = "100%"
        table.style.borderCollapse = "collapse"
        table.style.tableLayout = "fixed" // Use fixed layout for better control
        table.style.pageBreakInside = "avoid" // Avoid page breaks inside tables
        table.style.fontSize = "9pt" // Slightly smaller font for tables

        // Make sure all cells have appropriate width
        const cells = table.querySelectorAll("th, td")
        cells.forEach((cell) => {
          if (cell instanceof HTMLElement) {
            cell.style.border = "1px solid #000" // Darker borders for better visibility
            cell.style.padding = "4px" // Consistent padding
            cell.style.whiteSpace = "normal" // Allow text wrapping
            cell.style.wordBreak = "break-word" // Break words if needed
            cell.style.verticalAlign = "top" // Align content to top
            cell.style.lineHeight = "1.2" // Tighter line height for more content
          }
        })

        // Set column widths more precisely for landscape orientation
        const headerCells = table.querySelectorAll("th")
        if (headerCells.length > 0) {
          // First column (class names) gets 12% width (narrower for landscape)
          if (headerCells[0] instanceof HTMLElement) {
            headerCells[0].style.width = "12%"
          }

          // Distribute remaining width evenly among period columns
          const periodWidth = headerCells.length > 1 ? `${88 / (headerCells.length - 1)}%` : "88%"
          for (let i = 1; i < headerCells.length; i++) {
            if (headerCells[i] instanceof HTMLElement) {
              headerCells[i].style.width = periodWidth
            }
          }
        }
      }
    })

    // Remove any buttons or non-printable elements
    const nonPrintables = clone.querySelectorAll("button, .print\\:hidden, .export-hidden")
    nonPrintables.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })

    // Add the clone to the document
    document.body.appendChild(clone)

    console.log("Prepared clone for export, capturing with html2canvas...")

    // Capture the element with html2canvas with high quality settings
    const canvas = await html2canvas(clone, {
      scale: 3, // Higher scale for better quality (3x resolution)
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: true, // Enable logging for debugging
      allowTaint: true,
      letterRendering: true, // Improve text rendering
      onclone: (document, clonedElement) => {
        console.log("html2canvas cloning element...")
        // Additional styling for the cloned element in the canvas
        const allElements = clonedElement.querySelectorAll("*")
        allElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            // Ensure all background colors are preserved
            const computedStyle = window.getComputedStyle(el)
            if (computedStyle.backgroundColor && computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
              el.style.backgroundColor = computedStyle.backgroundColor
            }

            // Ensure all text colors are preserved
            if (computedStyle.color) {
              el.style.color = computedStyle.color
            }

            // Ensure all borders are visible
            if (computedStyle.border) {
              el.style.border = computedStyle.border
            }

            // Make sure all content is visible
            if (el.classList.contains("overflow-auto") || el.classList.contains("overflow-hidden")) {
              el.style.overflow = "visible"
            }
          }
        })
      },
    })

    // Remove the clone from the document
    document.body.removeChild(clone)

    console.log("Canvas captured, creating PDF...")

    // Get the image data from the canvas with high quality
    const imgData = canvas.toDataURL("image/jpeg", 1.0)

    // Create a PDF in A4 landscape size
    // A4 landscape dimensions: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: "landscape", // Use landscape for better content visibility
      unit: "mm",
      format: "a4",
    })

    // Calculate dimensions to fit the page with margins
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Set margins (10mm on all sides)
    const margin = 10
    const contentWidth = pdfWidth - margin * 2
    const contentHeight = pdfHeight - margin * 2

    // Calculate aspect ratio of the canvas
    const canvasAspectRatio = canvas.width / canvas.height

    // Calculate dimensions to fit within the content area while maintaining aspect ratio
    let imgWidth = contentWidth
    let imgHeight = imgWidth / canvasAspectRatio

    // If the height exceeds the content area, scale down
    if (imgHeight > contentHeight) {
      imgHeight = contentHeight
      imgWidth = imgHeight * canvasAspectRatio
    }

    // Center the image on the page
    const xOffset = margin + (contentWidth - imgWidth) / 2
    const yOffset = margin + (contentHeight - imgHeight) / 2

    console.log("Adding image to PDF with dimensions:", {
      imgWidth,
      imgHeight,
      xOffset,
      yOffset,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    })

    // Add image to PDF with calculated dimensions
    pdf.addImage(imgData, "JPEG", xOffset, yOffset, imgWidth, imgHeight, undefined, "FAST")

    // Add metadata
    pdf.setProperties({
      title: `${fileName} - School Schedule`,
      subject: "School Schedule",
      creator: "SARC Scheduler",
      author: "SARC Scheduler",
      keywords: "school, schedule, timetable",
    })

    console.log("Saving PDF...")

    // Save PDF
    pdf.save(`${fileName}.pdf`)
    console.log("PDF export completed successfully")

    return true
  } catch (error) {
    console.error("Error exporting to PDF:", error)
    return false
  }
}

// Create a complete schedule table for export
export function createCompleteScheduleTable(
  schedules: Schedule[],
  teachers: Teacher[],
  subjects: Subject[],
  periods: Period[],
  classGrades: ClassGrade[],
  selectedDay: string,
  selectedTeacherId?: string,
  selectedClassId?: string,
  academicSession?: string,
): HTMLTableElement {
  // Create maps for faster lookups
  const teacherMap = new Map<string, Teacher>()
  teachers.forEach((t) => teacherMap.set(t.id, t))

  const subjectMap = new Map<string, Subject>()
  subjects.forEach((s) => subjectMap.set(s.id, s))

  const periodMap = new Map<string, Period>()
  periods.forEach((p) => periodMap.set(p.id, p))

  // Filter schedules based on selected day, teacher, and class
  const filteredSchedules = schedules.filter((schedule) => {
    if (schedule.day !== selectedDay) return false
    if (selectedTeacherId && selectedTeacherId !== "all" && schedule.teacherId !== selectedTeacherId) return false
    if (selectedClassId && selectedClassId !== "all" && schedule.classId !== selectedClassId) return false
    return true
  })

  // Sort all periods by start time - include both regular periods and breaks
  const sortedPeriods = [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Filter classes if a specific class is selected
  const displayClasses =
    selectedClassId && selectedClassId !== "all" ? classGrades.filter((c) => c.id === selectedClassId) : classGrades

  // Create a matrix representation of the schedule
  const scheduleMatrix: Record<string, Record<string, Schedule>> = {}

  // Initialize matrix with empty cells
  displayClasses.forEach((classGrade) => {
    scheduleMatrix[classGrade.id] = {}
  })

  // Fill in the matrix with schedule data
  filteredSchedules.forEach((schedule) => {
    if (!scheduleMatrix[schedule.classId]) {
      scheduleMatrix[schedule.classId] = {}
    }
    scheduleMatrix[schedule.classId][schedule.periodId] = schedule
  })

  // Create the table element
  const table = document.createElement("table")
  table.style.width = "100%"
  table.style.borderCollapse = "collapse"
  table.style.border = "1px solid #ddd"

  // Add title
  const titleRow = document.createElement("tr")
  const titleCell = document.createElement("td")
  titleCell.colSpan = sortedPeriods.length + 1 // +1 for the class column
  titleCell.style.textAlign = "center"
  titleCell.style.padding = "15px"
  titleCell.style.backgroundColor = "#f0f9ff" // light blue background
  titleCell.style.borderBottom = "2px solid #0369a1"

  const title = document.createElement("h1")
  title.textContent = `${selectedDay} School Schedule`
  title.style.margin = "0"
  title.style.fontSize = "24px"
  title.style.fontWeight = "bold"
  title.style.color = "#0369a1" // sky-700

  const subtitle = document.createElement("div")
  if (selectedTeacherId && selectedTeacherId !== "all") {
    const teacher = teacherMap.get(selectedTeacherId)
    if (teacher) {
      subtitle.textContent = `Teacher: ${teacher.name}`
      subtitle.style.fontSize = "16px"
      subtitle.style.color = "#4b5563" // gray-600
      subtitle.style.marginTop = "5px"
    }
  } else if (selectedClassId && selectedClassId !== "all") {
    // Declare classMap here
    const classMap = new Map<string, ClassGrade>()
    classGrades.forEach((c) => classMap.set(c.id, c))
    const classGrade = classMap.get(selectedClassId)
    if (classGrade) {
      subtitle.textContent = `Class: ${classGrade.name}`
      subtitle.style.fontSize = "16px"
      subtitle.style.color = "#4b5563" // gray-600
      subtitle.style.marginTop = "5px"
    }
  }

  // Add academic session info if provided
  if (academicSession) {
    const sessionInfo = document.createElement("div")
    sessionInfo.textContent = `Academic Session: ${academicSession}`
    sessionInfo.style.fontSize = "14px"
    sessionInfo.style.color = "#4b5563" // gray-600
    sessionInfo.style.marginTop = "5px"
    subtitle.appendChild(sessionInfo)
  }

  titleCell.appendChild(title)
  if (subtitle.textContent) {
    titleCell.appendChild(subtitle)
  }
  titleRow.appendChild(titleCell)

  // Create a table caption with generation timestamp
  const timestampRow = document.createElement("tr")
  const timestampCell = document.createElement("td")
  timestampCell.colSpan = sortedPeriods.length + 1
  timestampCell.style.textAlign = "right"
  timestampCell.style.padding = "5px 15px"
  timestampCell.style.fontSize = "12px"
  timestampCell.style.color = "#6b7280" // gray-500
  timestampCell.style.borderBottom = "1px solid #e5e7eb"

  const timestamp = document.createElement("div")
  timestamp.textContent = `Generated on ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })} (Nepal Time)`
  timestampCell.appendChild(timestamp)
  timestampRow.appendChild(timestampCell)

  // Add title and timestamp to table
  const tableHeader = document.createElement("thead")
  tableHeader.appendChild(titleRow)
  tableHeader.appendChild(timestampRow)
  table.appendChild(tableHeader)

  // Create header row
  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")

  // Add class header
  const classHeader = document.createElement("th")
  classHeader.textContent = "Class"
  classHeader.style.border = "1px solid #ddd"
  classHeader.style.padding = "8px"
  classHeader.style.backgroundColor = "#f2f2f2"
  headerRow.appendChild(classHeader)

  // Add period headers - include all periods including breaks
  sortedPeriods.forEach((period) => {
    const periodHeader = document.createElement("th")
    periodHeader.style.border = "1px solid #ddd"
    periodHeader.style.padding = "8px"

    // Style break periods differently
    if (period.isInterval) {
      periodHeader.style.backgroundColor = "#fff8e1" // Light amber color for breaks
    } else {
      periodHeader.style.backgroundColor = "#f2f2f2"
    }

    const periodName = document.createElement("div")
    periodName.textContent = period.name
    periodName.style.fontWeight = "bold"

    // Add special styling for break periods
    if (period.isInterval) {
      periodName.style.color = "#b45309" // Amber text color
    }

    const periodTime = document.createElement("div")
    periodTime.textContent = `${period.startTime} - ${period.endTime}`
    periodTime.style.fontSize = "12px"
    periodTime.style.color = "#666"

    periodHeader.appendChild(periodName)
    periodHeader.appendChild(periodTime)
    headerRow.appendChild(periodHeader)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Create table body
  const tbody = document.createElement("tbody")

  displayClasses.forEach((classGrade) => {
    const row = document.createElement("tr")

    // Add class name cell
    const classCell = document.createElement("td")
    classCell.textContent = classGrade.name
    classCell.style.border = "1px solid #ddd"
    classCell.style.padding = "8px"
    classCell.style.fontWeight = "bold"
    classCell.style.backgroundColor = "#f8f9fa"
    row.appendChild(classCell)

    // Add period cells - include all periods including breaks
    sortedPeriods.forEach((period) => {
      const cell = document.createElement("td")
      cell.style.border = "1px solid #ddd"
      cell.style.padding = "8px"

      // Style break periods differently
      if (period.isInterval) {
        cell.style.backgroundColor = "#fff8e1" // Light amber color for breaks

        const breakDiv = document.createElement("div")
        breakDiv.textContent = period.name
        breakDiv.style.fontWeight = "bold"
        breakDiv.style.color = "#b45309" // Amber text color
        breakDiv.style.textAlign = "center"

        cell.appendChild(breakDiv)
      } else {
        const schedule = scheduleMatrix[classGrade.id]?.[period.id]

        if (schedule) {
          const teacher = teacherMap.get(schedule.teacherId)
          const subject = subjectMap.get(schedule.subjectId)

          const subjectDiv = document.createElement("div")
          subjectDiv.textContent = subject?.name || ""
          subjectDiv.style.fontWeight = "bold"
          subjectDiv.style.color = "#0369a1" // sky-700

          const teacherDiv = document.createElement("div")
          teacherDiv.textContent = teacher?.name || ""
          teacherDiv.style.fontSize = "14px"
          teacherDiv.style.color = "#4b5563" // gray-600

          cell.appendChild(subjectDiv)
          cell.appendChild(teacherDiv)
        } else {
          cell.textContent = "No class"
          cell.style.color = "#9ca3af" // gray-400
          cell.style.fontStyle = "italic"
        }
      }

      row.appendChild(cell)
    })

    tbody.appendChild(row)
  })

  table.appendChild(tbody)

  return table
}

// Export to Excel - Includes all schedule data including breaks
export function exportToExcel(
  schedules: Schedule[],
  teachers: Teacher[],
  subjects: Subject[],
  periods: Period[],
  classGrades: ClassGrade[],
  selectedDay: string,
  fileName = "schedule",
  selectedTeacherId?: string,
  selectedClassId?: string,
  academicSession?: string,
): boolean {
  try {
    // Create maps for faster lookups
    const teacherMap = new Map<string, Teacher>()
    teachers.forEach((t) => teacherMap.set(t.id, t))

    const subjectMap = new Map<string, Subject>()
    subjects.forEach((s) => subjectMap.set(s.id, s))

    const periodMap = new Map<string, Period>()
    periods.forEach((p) => periodMap.set(p.id, p))

    // Filter schedules based on selected day, teacher, and class
    const filteredSchedules = schedules.filter((schedule) => {
      if (schedule.day !== selectedDay) return false
      if (selectedTeacherId && selectedTeacherId !== "all" && schedule.teacherId !== selectedTeacherId) return false
      if (selectedClassId && selectedClassId !== "all" && schedule.classId !== selectedClassId) return false
      return true
    })

    // Sort periods by start time - include ALL periods including breaks
    const sortedPeriods = [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))

    // Filter classes if a specific class is selected
    const displayClasses =
      selectedClassId && selectedClassId !== "all" ? classGrades.filter((c) => c.id === selectedClassId) : classGrades

    // Create header row
    const headerRow = [`${selectedDay} Schedule - Class`]
    sortedPeriods.forEach((period) => {
      headerRow.push(`${period.name} (${period.startTime}-${period.endTime})${period.isInterval ? " - Break" : ""}`)
    })

    // Create data rows
    const data: string[][] = [headerRow]

    displayClasses.forEach((classGrade) => {
      const row = [classGrade.name]

      sortedPeriods.forEach((period) => {
        if (period.isInterval) {
          // For breaks/intervals, add a special label
          row.push(`[${period.name}]`)
        } else {
          const schedule = filteredSchedules.find((s) => s.classId === classGrade.id && s.periodId === period.id)

          if (schedule) {
            const teacher = teacherMap.get(schedule.teacherId)
            const subject = subjectMap.get(schedule.subjectId)
            row.push(`${subject?.name || ""} - ${teacher?.name || ""}`)
          } else {
            row.push("No class")
          }
        }
      })

      data.push(row)
    })

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Class column
    ]

    // Set width for period columns
    for (let i = 1; i < headerRow.length; i++) {
      colWidths.push({ wch: 25 })
    }

    ws["!cols"] = colWidths

    // Create a workbook
    const wb = XLSX.utils.book_new()

    // Add academic session info if provided
    const sheetName = academicSession ? `${selectedDay} (${academicSession})` : selectedDay
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)) // Excel sheet names limited to 31 chars

    // Add teacher workload sheet
    const teacherData = [["Teacher", "Assigned Periods"]]
    teachers.forEach((teacher) => {
      const workload = getTeacherWorkload(schedules, teacher.id)
      teacherData.push([teacher.name, workload.toString()])
    })

    const teacherWs = XLSX.utils.aoa_to_sheet(teacherData)
    XLSX.utils.book_append_sheet(wb, teacherWs, "Teacher Workload")

    // Generate Excel file - Use browser-compatible method
    XLSX.writeFile(wb, `${fileName}.xlsx`, { bookType: "xlsx", type: "binary" })

    return true
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    return false
  }
}

// Update the printSchedule function to ensure content fits on a single page
export function printSchedule(elementId: string, fileName?: string) {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`)
    return
  }

  // Create a print-specific stylesheet if it doesn't exist
  let printStyle = document.getElementById("print-style")
  if (!printStyle) {
    printStyle = document.createElement("style")
    printStyle.id = "print-style"
    document.head.appendChild(printStyle)
  }

  // Set print-specific styles to preserve all styling and layout
  printStyle.innerHTML = `
  @media print {
    /* Reset all print settings */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box !important;
    }
    
    /* Hide everything except the schedule */
    body * {
      visibility: hidden;
    }
    
    /* Show only the schedule and its children */
    #${elementId}, #${elementId} * {
      visibility: visible;
    }
    
    /* Position the schedule at the top of the page */
    #${elementId} {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      padding: 10mm;
      margin: 0;
      box-sizing: border-box;
    }
    
    /* Ensure tables display properly and fit on one page */
    #${elementId} table {
      width: 100% !important;
      height: auto !important;
      border-collapse: collapse !important;
      page-break-inside: avoid !important;
      table-layout: fixed !important;
      font-size: 11pt !important;
    }
    
    /* Style table cells for better fit */
    #${elementId} th, #${elementId} td {
      border: 1px solid #ddd !important;
      padding: 4px !important;
      word-break: break-word !important;
      white-space: normal !important;
      font-size: 10pt !important;
    }
    
    /* Preserve background colors */
    #${elementId} .bg-gray-50 {
      background-color: #f9fafb !important;
    }
    
    #${elementId} .bg-green-50, #${elementId} .bg-green-100 {
      background-color: #ecfdf5 !important;
    }
    
    #${elementId} .bg-amber-50 {
      background-color: #fffbeb !important;
    }
    
    #${elementId} .text-sky-700 {
      color: #0369a1 !important;
    }
    
    #${elementId} .text-gray-600 {
      color: #4b5563 !important;
    }
    
    #${elementId} .text-amber-800 {
      color: #92400e !important;
    }
    
    /* Hide current period indicators */
    .current-period-indicator, .current-period, .export-hidden {
      display: none !important;
    }
    
    /* Add a title to the printed page */
    #${elementId}::before {
      content: "${fileName || "School Schedule"}";
      display: block;
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 10px;
      color: #0369a1;
    }
    
    /* Set page to landscape and fit to page */
    @page {
      size: landscape;
      margin: 0;
    }
    
    /* Fix overflow issues */
    .overflow-x-auto, .overflow-y-auto, .overflow-hidden {
      overflow: visible !important;
      max-width: none !important;
      max-height: none !important;
    }
    
    /* Ensure sticky elements print properly */
    .sticky {
      position: relative !important;
    }
  }
`

  window.print()
}
