"use client"

import { useState, useEffect } from "react"
import type { Teacher, Subject, Period, Schedule, ClassGrade } from "@/lib/types"
import { generateUniqueId, checkTeacherConflict, checkClassConflict, getTeacherWorkload } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlusCircle, AlertTriangle } from "lucide-react"

interface AddScheduleFormProps {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  classGrades: ClassGrade[]
  schedules: Schedule[]
  selectedDay: string
  onAddSchedule: (schedule: Schedule) => void
}

export function AddScheduleForm({
  teachers,
  subjects,
  periods,
  classGrades,
  schedules,
  selectedDay,
  onAddSchedule,
}: AddScheduleFormProps) {
  const [teacherId, setTeacherId] = useState<string>("")
  const [subjectId, setSubjectId] = useState<string>("")
  const [periodId, setPeriodId] = useState<string>("")
  const [classId, setClassId] = useState<string>("")
  const [teacherConflict, setTeacherConflict] = useState<string | null>(null)
  const [classConflict, setClassConflict] = useState<string | null>(null)
  const [teacherWorkload, setTeacherWorkload] = useState<number>(0)

  // Update teacher workload when teacher changes
  useEffect(() => {
    if (teacherId) {
      setTeacherWorkload(getTeacherWorkload(schedules, teacherId))
    } else {
      setTeacherWorkload(0)
    }
  }, [teacherId, schedules])

  // Check for conflicts when teacher, class, or period changes
  useEffect(() => {
    // Reset conflicts
    setTeacherConflict(null)
    setClassConflict(null)

    if (teacherId && periodId && selectedDay) {
      console.log("Checking for teacher conflicts in AddScheduleForm:", { teacherId, periodId, selectedDay })

      // Check for teacher conflicts
      const { hasConflict: hasTeacherConflict, conflictDetails: teacherConflictDetails } = checkTeacherConflict(
        schedules,
        teacherId,
        periodId,
        selectedDay,
      )

      if (hasTeacherConflict && teacherConflictDetails) {
        const teacher = teachers.find((t) => t.id === teacherId)
        const conflictClass = classGrades.find((c) => c.id === teacherConflictDetails.className)
        const conflictPeriod = periods.find((p) => p.id === teacherConflictDetails.periodName)

        setTeacherConflict(
          `${teacher?.name} is already assigned to ${conflictClass?.name} at ${conflictPeriod?.startTime} - ${conflictPeriod?.endTime} on ${selectedDay}.`,
        )
      }
    }

    if (classId && periodId && selectedDay) {
      // Check for class conflicts
      const { hasConflict: hasClassConflict, conflictDetails: classConflictDetails } = checkClassConflict(
        schedules,
        classId,
        periodId,
        selectedDay,
      )

      if (hasClassConflict && classConflictDetails) {
        const conflictTeacher = teachers.find((t) => t.id === classConflictDetails.teacherName)
        const conflictSubject = subjects.find((s) => s.id === classConflictDetails.subjectName)
        const classGrade = classGrades.find((c) => c.id === classId)

        setClassConflict(
          `${classGrade?.name} already has ${conflictSubject?.name} with ${conflictTeacher?.name} during this period on ${selectedDay}.`,
        )
      }
    }
  }, [teacherId, classId, periodId, selectedDay, schedules, teachers, subjects, periods, classGrades])

  const handleAddSchedule = () => {
    if (!teacherId || !subjectId || !periodId || !classId) {
      alert("Please fill in all fields")
      return
    }

    // Final conflict check before adding
    if (teacherConflict || classConflict) {
      alert("Cannot add schedule due to conflicts. Please resolve them first.")
      return
    }

    const newSchedule: Schedule = {
      id: generateUniqueId(),
      day: selectedDay,
      teacherId,
      subjectId,
      periodId,
      classId,
    }

    console.log("Adding new schedule:", newSchedule)
    onAddSchedule(newSchedule)

    // Reset form
    setTeacherId("")
    setSubjectId("")
    setPeriodId("")
    setClassId("")
  }

  // Filter out interval periods - only show regular teaching periods
  const regularPeriods = periods.filter((p) => !p.isInterval)

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700">Add New Class Schedule</CardTitle>
        <CardDescription>Add a new class to the {selectedDay} schedule</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {(teacherConflict || classConflict) && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {teacherConflict && <div>❌ Teacher conflict: {teacherConflict}</div>}
              {classConflict && <div>❌ Class conflict: {classConflict}</div>}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classGrades.map((classGrade) => (
                  <SelectItem key={classGrade.id} value={classGrade.id}>
                    {classGrade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Period</label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {regularPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name} ({period.startTime} - {period.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Teacher</label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({getTeacherWorkload(schedules, teacher.id)} periods)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teacherId && <p className="text-xs mt-1 text-gray-500">Current workload: {teacherWorkload} periods</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleAddSchedule}
            className="bg-sky-500 hover:bg-sky-600"
            disabled={!teacherId || !subjectId || !periodId || !classId || !!teacherConflict || !!classConflict}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add to Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
