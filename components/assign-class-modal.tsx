"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Trash2 } from "lucide-react"
import { generateUniqueId, checkTeacherConflict, checkClassConflict, getTeacherWorkload } from "@/lib/utils"
import type { Teacher, Subject, Period, Schedule, ClassGrade } from "@/lib/types"

interface AssignClassModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  periodId: string
  existingSchedule?: Schedule
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  classGrades: ClassGrade[]
  schedules: Schedule[]
  selectedDay?: string
  onAssign: (schedule: Schedule) => void
  onDelete: (scheduleId: string) => void
}

export function AssignClassModal({
  isOpen,
  onClose,
  classId,
  periodId,
  existingSchedule,
  teachers,
  subjects,
  periods,
  classGrades,
  schedules,
  selectedDay = "Monday",
  onAssign,
  onDelete,
}: AssignClassModalProps) {
  const [teacherId, setTeacherId] = useState<string>(existingSchedule?.teacherId || "")
  const [subjectId, setSubjectId] = useState<string>(existingSchedule?.subjectId || "")
  const [teacherConflict, setTeacherConflict] = useState<string | null>(null)
  const [classConflict, setClassConflict] = useState<string | null>(null)
  const [teacherWorkload, setTeacherWorkload] = useState<number>(0)

  // Get the class and period details
  const classDetails = classGrades.find((c) => c.id === classId)
  const periodDetails = periods.find((p) => p.id === periodId)

  // Reset form when modal opens or existing schedule changes
  useEffect(() => {
    if (isOpen) {
      setTeacherId(existingSchedule?.teacherId || "")
      setSubjectId(existingSchedule?.subjectId || "")

      // Reset conflicts
      setTeacherConflict(null)
      setClassConflict(null)
    }
  }, [isOpen, existingSchedule])

  // Update teacher workload when teacher changes
  useEffect(() => {
    if (teacherId) {
      setTeacherWorkload(getTeacherWorkload(schedules, teacherId))
    } else {
      setTeacherWorkload(0)
    }
  }, [teacherId, schedules])

  // Check for conflicts when teacher or subject changes
  useEffect(() => {
    // Reset conflicts
    setTeacherConflict(null)
    setClassConflict(null)

    if (teacherId && periodId) {
      // Use the selected day or the day from the existing schedule
      const day = selectedDay

      console.log("Checking for conflicts with day:", day)

      // Check for teacher conflicts
      const { hasConflict: hasTeacherConflict, conflictDetails: teacherConflictDetails } = checkTeacherConflict(
        schedules,
        teacherId,
        periodId,
        day,
        existingSchedule?.id,
      )

      if (hasTeacherConflict && teacherConflictDetails) {
        const teacher = teachers.find((t) => t.id === teacherId)
        const conflictClass = classGrades.find((c) => c.id === teacherConflictDetails.className)
        const conflictPeriod = periods.find((p) => p.id === teacherConflictDetails.periodName)

        setTeacherConflict(
          `${teacher?.name} is already assigned to ${conflictClass?.name} at ${conflictPeriod?.startTime} - ${conflictPeriod?.endTime} on ${day}.`,
        )
      }

      // Check for class conflicts
      const { hasConflict: hasClassConflict, conflictDetails: classConflictDetails } = checkClassConflict(
        schedules,
        classId,
        periodId,
        day,
        existingSchedule?.id,
      )

      if (hasClassConflict && classConflictDetails) {
        const conflictTeacher = teachers.find((t) => t.id === classConflictDetails.teacherName)
        const conflictSubject = subjects.find((s) => s.id === classConflictDetails.subjectName)

        setClassConflict(
          `This class already has ${conflictSubject?.name} with ${conflictTeacher?.name} during this period on ${day}.`,
        )
      }
    }
  }, [teacherId, periodId, classId, existingSchedule, schedules, teachers, subjects, periods, classGrades, selectedDay])

  const handleAssign = () => {
    if (!teacherId || !subjectId) {
      alert("Please select both teacher and subject")
      return
    }

    if (teacherConflict) {
      alert("Cannot assign due to teacher conflict")
      return
    }

    if (classConflict) {
      alert("Cannot assign due to class conflict")
      return
    }

    // Always use the selectedDay prop to ensure consistency
    const day = selectedDay

    const schedule: Schedule = {
      id: existingSchedule?.id || generateUniqueId(),
      day: day,
      classId,
      periodId,
      teacherId,
      subjectId,
    }

    console.log("Assigning schedule:", schedule)
    onAssign(schedule)
  }

  const handleDelete = () => {
    if (existingSchedule?.id) {
      onDelete(existingSchedule.id)
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingSchedule ? "Edit Class Assignment" : "Assign New Class"}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-3 bg-sky-50 rounded-md">
            <p className="text-sm font-medium text-sky-700">
              {classDetails?.name} • {periodDetails?.name} ({periodDetails?.startTime} - {periodDetails?.endTime})
            </p>
          </div>

          {teacherConflict && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div>❌ Teacher conflict: {teacherConflict}</div>
              </AlertDescription>
            </Alert>
          )}

          {classConflict && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div>❌ Class conflict: {classConflict}</div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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
        </div>

        <DialogFooter className="flex justify-between">
          {existingSchedule && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!teacherId || !subjectId || !!teacherConflict || !!classConflict}>
              {existingSchedule ? "Update" : "Assign"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
