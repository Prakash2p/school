"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleGrid } from "@/components/schedule-grid"
import { FilterControls } from "@/components/filter-controls"
import { PrintExportButtons } from "@/components/print-export-buttons"
import { Skeleton } from "@/components/ui/skeleton"
import type { Teacher, Subject, Period, Schedule, ClassGrade, UserRole } from "@/lib/types"

interface ScheduleViewProps {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  selectedDay: string
  userRole: UserRole
  selectedTeacherId: string
  onSelectTeacher: (teacherId: string) => void
  availableDays: string[]
}

export function ScheduleView({
  teachers,
  subjects,
  periods,
  schedules,
  classGrades,
  selectedDay,
  userRole,
  selectedTeacherId,
  onSelectTeacher,
  availableDays,
}: ScheduleViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading for better UX
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedDay, selectedTeacherId, selectedClassId, schedules.length]) // Add schedules.length as a dependency

  // Filter schedules for the selected day
  const daySchedules = useMemo(
    () => schedules.filter((schedule) => schedule.day === selectedDay),
    [schedules, selectedDay],
  )

  // Get display names for selected teacher and class
  const selectedTeacherName = useMemo(
    () => (selectedTeacherId !== "all" ? teachers.find((t) => t.id === selectedTeacherId)?.name : ""),
    [selectedTeacherId, teachers],
  )

  const selectedClassName = useMemo(
    () => (selectedClassId !== "all" ? classGrades.find((c) => c.id === selectedClassId)?.name : ""),
    [selectedClassId, classGrades],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-sky-700">Class Schedule</h1>

        <PrintExportButtons
          teachers={teachers}
          subjects={subjects}
          periods={periods}
          schedules={schedules}
          classGrades={classGrades}
          selectedDay={selectedDay}
          selectedTeacherId={selectedTeacherId}
          selectedClassId={selectedClassId}
          elementId="schedule-grid"
          fileName={`${selectedDay}_schedule`}
        />
      </div>

      <FilterControls
        teachers={teachers}
        classGrades={classGrades}
        selectedTeacherId={selectedTeacherId}
        selectedClassId={selectedClassId}
        onSelectTeacher={onSelectTeacher}
        onSelectClass={setSelectedClassId}
        availableDays={availableDays}
      />

      <Card className="border-sky-100 shadow-sm">
        <CardHeader className="bg-sky-50 rounded-t-lg">
          <CardTitle className="text-sky-700 flex flex-wrap items-center gap-1">
            <span>{selectedDay} Schedule</span>
            {selectedTeacherName && <span className="text-sky-600">- {selectedTeacherName}</span>}
            {selectedClassName && <span className="text-sky-600">- {selectedClassName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 overflow-hidden">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div id="schedule-grid" className="overflow-x-auto">
              <ScheduleGrid
                schedules={daySchedules}
                teachers={teachers}
                subjects={subjects}
                periods={periods}
                classGrades={classGrades}
                selectedTeacherId={selectedTeacherId !== "all" ? selectedTeacherId : undefined}
                selectedClassId={selectedClassId !== "all" ? selectedClassId : undefined}
                selectedDay={selectedDay}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
