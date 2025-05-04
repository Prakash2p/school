"use client"

import type { Teacher, Subject, Period, Schedule, ClassGrade } from "@/lib/types"
import { useMemo } from "react"

interface SchedulePreviewProps {
  schedules: Schedule[]
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  classGrades: ClassGrade[]
}

export function SchedulePreview({ schedules, teachers, subjects, periods, classGrades }: SchedulePreviewProps) {
  // Create maps for faster lookups
  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers])

  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])

  const periodMap = useMemo(() => new Map(periods.map((period) => [period.id, period])), [periods])

  const classMap = useMemo(() => new Map(classGrades.map((classGrade) => [classGrade.id, classGrade])), [classGrades])

  // Sort periods by start time
  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime)), [periods])

  // Create a matrix representation of the schedule
  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, Schedule>> = {}

    // Initialize matrix with empty cells
    classGrades.forEach((classGrade) => {
      matrix[classGrade.id] = {}
    })

    // Fill in the matrix with schedule data
    schedules.forEach((schedule) => {
      if (!matrix[schedule.classId]) {
        matrix[schedule.classId] = {}
      }
      matrix[schedule.classId][schedule.periodId] = schedule
    })

    return matrix
  }, [schedules, classGrades])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50">Class</th>
            {sortedPeriods.map((period) => (
              <th key={period.id} className={`border p-2 ${period.isInterval ? "bg-amber-50" : "bg-gray-50"}`}>
                <div className="font-medium">{period.name}</div>
                <div className="text-xs text-gray-500">
                  {period.startTime} - {period.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {classGrades.map((classGrade) => (
            <tr key={classGrade.id}>
              <td className="border p-2 font-medium bg-gray-50">{classGrade.name}</td>
              {sortedPeriods.map((period) => {
                const schedule = scheduleMatrix[classGrade.id]?.[period.id]

                if (period.isInterval) {
                  return (
                    <td key={period.id} className="border p-2 bg-amber-50/50">
                      <div className="text-amber-800 font-medium text-center">{period.name}</div>
                    </td>
                  )
                }

                if (schedule) {
                  const teacher = teacherMap.get(schedule.teacherId)
                  const subject = subjectMap.get(schedule.subjectId)

                  return (
                    <td key={period.id} className="border p-2">
                      <div className="font-medium text-sky-700">{subject?.name}</div>
                      <div className="text-sm text-gray-600">{teacher?.name}</div>
                    </td>
                  )
                }

                return (
                  <td key={period.id} className="border p-2">
                    <div className="text-gray-400 text-sm italic">No class</div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
