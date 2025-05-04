export type UserRole = "Admin" | "Teacher" | "Student"

export interface Teacher {
  id: string
  name: string
  photo?: string
}

export interface Subject {
  id: string
  name: string
}

export interface Period {
  id: string
  name: string
  startTime: string
  endTime: string
  isInterval: boolean
}

export interface ClassGrade {
  id: string
  name: string
}

export interface Schedule {
  id: string
  day: string
  classId: string
  teacherId: string
  subjectId: string
  periodId: string
  academicSessionId?: string
}

export interface SchoolDay {
  name: string
  active: boolean
}

export interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export type AdminRole = "Admin" | "SuperAdmin"

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  role: AdminRole
  name: string
  email: string
  createdAt: string
  lastLogin?: string
}

export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
}
