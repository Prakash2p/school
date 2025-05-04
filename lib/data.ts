import type { Teacher, Subject, Period, Schedule, ClassGrade } from "./types"

export function initializeData() {
  const teachers: Teacher[] = [
    { id: "t1", name: "Dhan Bdr Rokaya" },
    { id: "t2", name: "Deepa Kshetri" },
    { id: "t3", name: "Neha Sunar" },
    { id: "t4", name: "Krishana Niroula" },
    { id: "t5", name: "Prakash Raj Bhatt" },
    { id: "t6", name: "Deepa Kshetri" },
  ]

  const subjects: Subject[] = [
    { id: "s1", name: "Mathematics" },
    { id: "s2", name: "Science" },
    { id: "s3", name: "English" },
    { id: "s4", name: "AP" },
    { id: "s5", name: "Computer Science" },
    { id: "s6", name: "Physical Education" },
  ]

  const periods: Period[] = [
    { id: "p1", name: "1st Period", startTime: "08:00", endTime: "09:00", isInterval: false },
    { id: "p2", name: "2nd Period", startTime: "09:10", endTime: "10:10", isInterval: false },
    { id: "p3", name: "Break", startTime: "10:10", endTime: "10:30", isInterval: true },
    { id: "p4", name: "3rd Period", startTime: "10:30", endTime: "11:30", isInterval: false },
    { id: "p5", name: "4th Period", startTime: "11:40", endTime: "12:40", isInterval: false },
    { id: "p6", name: "Lunch", startTime: "12:40", endTime: "13:30", isInterval: true },
    { id: "p7", name: "5th Period", startTime: "13:30", endTime: "14:30", isInterval: false },
    { id: "p8", name: "6th Period", startTime: "14:40", endTime: "15:40", isInterval: false },
  ]

  const classGrades: ClassGrade[] = [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
    { id: "c3", name: "Class 3" },
    { id: "c4", name: "Class 4" },
    { id: "c5", name: "Class 5" },
    { id: "c6", name: "Class 6" },
  ]

  // Generate some initial schedules
  const schedules: Schedule[] = [
    // Monday schedules
    { id: "s1", day: "Monday", classId: "c1", teacherId: "t1", subjectId: "s1", periodId: "p1" },
    { id: "s2", day: "Monday", classId: "c2", teacherId: "t2", subjectId: "s2", periodId: "p1" },
    { id: "s3", day: "Monday", classId: "c1", teacherId: "t3", subjectId: "s3", periodId: "p2" },
    { id: "s4", day: "Monday", classId: "c2", teacherId: "t1", subjectId: "s1", periodId: "p2" },
    { id: "s5", day: "Monday", classId: "c1", teacherId: "t4", subjectId: "s4", periodId: "p4" },
    { id: "s6", day: "Monday", classId: "c2", teacherId: "t5", subjectId: "s5", periodId: "p4" },

    // Tuesday schedules
    { id: "s7", day: "Tuesday", classId: "c3", teacherId: "t1", subjectId: "s1", periodId: "p1" },
    { id: "s8", day: "Tuesday", classId: "c4", teacherId: "t2", subjectId: "s2", periodId: "p1" },
    { id: "s9", day: "Tuesday", classId: "c3", teacherId: "t3", subjectId: "s3", periodId: "p2" },
    { id: "s10", day: "Tuesday", classId: "c4", teacherId: "t4", subjectId: "s4", periodId: "p2" },
  ]

  return { teachers, subjects, periods, schedules, classGrades }
}

export function loadFromLocalStorage() {
  if (typeof window === "undefined") return null

  const storedData = localStorage.getItem("scheduleData")
  if (storedData) {
    return JSON.parse(storedData)
  }
  return null
}

export function generateUniqueId() {
  return Math.random().toString(36).substring(2, 9)
}

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
