"use client"

import { useState, useEffect } from "react"
import type { Teacher, ClassGrade } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, School } from "lucide-react"

interface FilterControlsProps {
  teachers: Teacher[]
  classGrades: ClassGrade[]
  selectedTeacherId: string
  selectedClassId: string
  onSelectTeacher: (teacherId: string) => void
  onSelectClass: (classId: string) => void
  availableDays?: string[]
}

export function FilterControls({
  teachers,
  classGrades,
  selectedTeacherId,
  selectedClassId,
  onSelectTeacher,
  onSelectClass,
  availableDays,
}: FilterControlsProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading for better UX
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
        <div className="w-full sm:w-auto">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
        <div className="w-full sm:w-auto">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow">
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center">
          <Users className="h-4 w-4 mr-1 text-sky-500" />
          Filter by Teacher
        </label>
        <Select value={selectedTeacherId} onValueChange={onSelectTeacher}>
          <SelectTrigger className="w-full sm:w-48 border-sky-200 focus:ring-sky-500">
            <SelectValue placeholder="All Teachers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium mb-1 text-gray-700 flex items-center">
          <School className="h-4 w-4 mr-1 text-sky-500" />
          Filter by Class
        </label>
        <Select value={selectedClassId} onValueChange={onSelectClass}>
          <SelectTrigger className="w-full sm:w-48 border-sky-200 focus:ring-sky-500">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classGrades.map((classGrade) => (
              <SelectItem key={classGrade.id} value={classGrade.id}>
                {classGrade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
