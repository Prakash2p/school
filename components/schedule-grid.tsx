"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import type { ClassGrade, Period, Schedule, Subject, Teacher } from "@/lib/types"
import { PlusCircle, Coffee } from "lucide-react"
import { AssignClassModal } from "./assign-class-modal"

interface ScheduleGridProps {
  schedules: Schedule[]
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  classGrades: ClassGrade[]
  selectedTeacherId?: string
  selectedClassId?: string
  isAdmin?: boolean
  selectedDay?: string
  onAddSchedule?: (schedule: Schedule) => void
  onUpdateSchedule?: (schedule: Schedule) => void
  onDeleteSchedule?: (scheduleId: string) => void
}

export function ScheduleGrid({
  schedules,
  teachers,
  subjects,
  periods,
  classGrades,
  selectedTeacherId,
  selectedClassId,
  isAdmin = false,
  selectedDay = "Monday",
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: ScheduleGridProps) {
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{
    classId: string
    periodId: string
    existingSchedule?: Schedule
  } | null>(null)

  // Check if a period is currently active
  const checkCurrentPeriod = useCallback(() => {
    // Get current time in Nepal
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }

    const nepalTimeString = new Intl.DateTimeFormat("en-US", options).format(new Date())
    // Convert from "14:30" format to "14:30" format (removing any AM/PM if present)
    const currentTime = nepalTimeString.replace(/\s?[AP]M$/i, "")

    // Find the active period
    const activePeriod = periods.find((period) => currentTime >= period.startTime && currentTime <= period.endTime)

    // Set the current period ID
    setCurrentPeriodId(activePeriod?.id || null)
  }, [periods])

  // Check current period every minute
  useEffect(() => {
    checkCurrentPeriod()
    const intervalId = setInterval(checkCurrentPeriod, 60000)
    return () => clearInterval(intervalId)
  }, [checkCurrentPeriod])

  // Add a timer to update the current period indicator more frequently
  useEffect(() => {
    // Check immediately
    checkCurrentPeriod()

    // Then check every 15 seconds for a more responsive experience
    const intervalId = setInterval(checkCurrentPeriod, 15000)
    return () => clearInterval(intervalId)
  }, [checkCurrentPeriod])

  // Add a visual pulse effect for the current period
  const [pulseEffect, setPulseEffect] = useState(false)

  // Create a subtle pulse effect every few seconds
  useEffect(() => {
    if (currentPeriodId) {
      const pulseInterval = setInterval(() => {
        setPulseEffect((prev) => !prev)
      }, 3000)

      return () => clearInterval(pulseInterval)
    }
  }, [currentPeriodId])

  // Create maps for faster lookups
  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers])

  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])

  // Filter schedules based on selected teacher and class
  const filteredSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          (!selectedTeacherId || schedule.teacherId === selectedTeacherId) &&
          (!selectedClassId || schedule.classId === selectedClassId),
      ),
    [schedules, selectedTeacherId, selectedClassId],
  )

  // Sort periods by start time
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime)), [periods])

  // Determine which classes to display
  const displayClasses = useMemo(
    () => (selectedClassId ? classGrades.filter((c) => c.id === selectedClassId) : classGrades),
    [classGrades, selectedClassId],
  )

  // Create a matrix representation of the schedule
  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, Schedule>> = {}

    // Initialize matrix with empty cells
    displayClasses.forEach((classGrade) => {
      matrix[classGrade.id] = {}
    })

    // Fill in the matrix with schedule data
    filteredSchedules.forEach((schedule) => {
      if (!matrix[schedule.classId]) {
        matrix[schedule.classId] = {}
      }
      matrix[schedule.classId][schedule.periodId] = schedule
    })

    return matrix
  }, [filteredSchedules, displayClasses])

  // Handle cell click for assignment
  const handleCellClick = useCallback(
    (classId: string, periodId: string, existingSchedule?: Schedule) => {
      if (!isAdmin) return

      // Don't allow assignment for break/interval periods
      const period = periods.find((p) => p.id === periodId)
      if (period?.isInterval) return

      // Make a deep copy of the existing schedule to avoid reference issues
      const scheduleCopy = existingSchedule ? { ...existingSchedule } : undefined

      setSelectedCell({
        classId,
        periodId,
        existingSchedule: scheduleCopy,
      })
      setIsModalOpen(true)
    },
    [isAdmin, periods],
  )

  // Handle assignment submission
  const handleAssignClass = useCallback(
    (schedule: Schedule) => {
      // Make sure we're using the correct day
      const updatedSchedule = {
        ...schedule,
        day: selectedDay,
      }

      console.log("Handling assignment with schedule:", updatedSchedule)

      if (updatedSchedule.id && onUpdateSchedule) {
        onUpdateSchedule(updatedSchedule)
      } else if (onAddSchedule) {
        onAddSchedule(updatedSchedule)
      }

      setIsModalOpen(false)
      setSelectedCell(null)
    },
    [onAddSchedule, onUpdateSchedule, selectedDay],
  )

  // Handle schedule deletion
  const handleDeleteSchedule = useCallback(
    (scheduleId: string) => {
      onDeleteSchedule?.(scheduleId)
      setIsModalOpen(false)
      setSelectedCell(null)
    },
    [onDeleteSchedule],
  )

  // If no data is available, show a message
  if (sortedPeriods.length === 0 || displayClasses.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No schedule data available. Please add periods and classes first.
      </div>
    )
  }

  return (
    <>
      <div className="schedule-table-container overflow-auto">
        <table className="schedule-table w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 sticky left-0 z-10">Class</th>
              {sortedPeriods.map((period) => {
                const isCurrentPeriod = period.id === currentPeriodId
                const isInterval = period.isInterval

                return (
                  <th
                    key={period.id}
                    className={`
                      border p-2 min-w-[150px]
                      ${
                        isCurrentPeriod
                          ? "bg-gradient-to-b from-green-50 to-green-100 text-green-800 relative"
                          : isInterval
                            ? "bg-amber-50 text-amber-800"
                            : "bg-gray-50"
                      }
                    `}
                  >
                    <div className="font-medium flex items-center justify-center gap-1">
                      {isInterval && <Coffee className="h-4 w-4" aria-hidden="true" />}
                      {period.name}
                      {isCurrentPeriod && (
                        <span className="current-period export-hidden ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {period.startTime} - {period.endTime}
                    </div>
                    {isCurrentPeriod && (
                      <div className="current-period-indicator export-hidden absolute -bottom-1 left-0 w-full h-1 bg-green-500"></div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayClasses.map((classGrade) => (
              <tr key={classGrade.id}>
                <td className="border p-2 font-medium bg-gray-50 sticky left-0 z-10">{classGrade.name}</td>
                {sortedPeriods.map((period) => {
                  const schedule = scheduleMatrix[classGrade.id]?.[period.id]
                  const teacher = schedule ? teacherMap.get(schedule.teacherId) : null
                  const subject = schedule ? subjectMap.get(schedule.subjectId) : null
                  const isCurrentPeriod = period.id === currentPeriodId
                  const isInterval = period.isInterval

                  return (
                    <td
                      key={period.id}
                      className={`
                        border p-2 relative
                        ${isInterval ? "bg-amber-50" : ""}
                        ${isAdmin && !isInterval ? "cursor-pointer hover:bg-sky-50" : ""}
                      `}
                      onClick={isInterval ? undefined : () => handleCellClick(classGrade.id, period.id, schedule)}
                    >
                      {isInterval ? (
                        <div className="text-amber-800 font-medium text-center flex items-center justify-center gap-1">
                          <Coffee className="h-4 w-4" aria-hidden="true" />
                          {period.name}
                        </div>
                      ) : teacher && subject ? (
                        <div
                          className={`
                            transition-all duration-200 p-2 rounded-md -m-2
                            hover:bg-sky-50
                            ${isAdmin ? "group" : ""}
                          `}
                        >
                          <div className="font-medium text-sky-700">{subject.name}</div>
                          <div className="text-sm text-gray-600">{teacher.name}</div>

                          {isAdmin && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="bg-sky-100 hover:bg-sky-200 rounded-full p-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCellClick(classGrade.id, period.id, schedule)
                                }}
                                aria-label="Edit schedule"
                              >
                                <PlusCircle className="h-4 w-4 text-sky-700" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`
                            text-gray-400 text-sm italic ${isAdmin ? "flex justify-between items-center" : ""}
                          `}
                        >
                          <span>No class</span>
                          {isAdmin && !isInterval && (
                            <PlusCircle className="h-4 w-4 text-gray-400 hover:text-sky-600" aria-hidden="true" />
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && selectedCell && (
        <AssignClassModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCell(null)
          }}
          classId={selectedCell.classId}
          periodId={selectedCell.periodId}
          existingSchedule={selectedCell.existingSchedule}
          teachers={teachers}
          subjects={subjects}
          periods={periods}
          classGrades={classGrades}
          schedules={schedules}
          selectedDay={selectedDay}
          onAssign={handleAssignClass}
          onDelete={handleDeleteSchedule}
        />
      )}
    </>
  )
}
