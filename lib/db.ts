import { Low } from "lowdb"
import { LocalStorage } from "lowdb/browser"
import type { Teacher, Subject, Period, Schedule, ClassGrade, SchoolDay, AdminUser, Session } from "./types"
import { initializeData } from "./data"
import { logScheduleOperation, validateSchedule } from "./debug"
import { jsonStorage } from "./json-storage"

// Define the database schema
type Schema = {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  schoolDays: SchoolDay[]
  lastUpdated: string
  admins: AdminUser[]
  sessions: Session[]
}

// Create a singleton instance of the database
class Database {
  private static instance: Database
  private db: Low<Schema>
  private isInitialized = false

  private constructor() {
    // Initialize with empty data
    const defaultData: Schema = {
      teachers: [],
      subjects: [],
      periods: [],
      schedules: [],
      classGrades: [],
      schoolDays: [
        { name: "Sunday", active: true },
        { name: "Monday", active: true },
        { name: "Tuesday", active: true },
        { name: "Wednesday", active: true },
        { name: "Thursday", active: true },
        { name: "Friday", active: true },
        { name: "Saturday", active: false },
      ],
      lastUpdated: new Date().toISOString(),
      admins: [],
      sessions: [],
    }

    // Create the database instance with a safe adapter
    // Only use LocalStorage in the browser environment
    let adapter
    if (typeof window !== "undefined") {
      adapter = new LocalStorage<Schema>("school-scheduler-db")
    } else {
      // Provide a fallback for SSR - this won't be used for actual data
      // but prevents errors during SSR
      adapter = {
        read: async () => defaultData,
        write: async () => {},
      }
    }

    this.db = new Low<Schema>(adapter, defaultData)
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Skip actual initialization during SSR
    if (typeof window === "undefined") {
      this.isInitialized = true
      return
    }

    try {
      // Load data from localStorage
      await this.db.read()

      // If the database is empty, populate with initial data
      if (!this.db.data.teachers.length) {
        const initialData = initializeData()
        this.db.data = {
          ...initialData,
          schoolDays: [
            { name: "Sunday", active: true },
            { name: "Monday", active: true },
            { name: "Tuesday", active: true },
            { name: "Wednesday", active: true },
            { name: "Thursday", active: true },
            { name: "Friday", active: true },
            { name: "Saturday", active: false },
          ],
          lastUpdated: new Date().toISOString(),
          admins: [],
          sessions: [],
        }
        await this.db.write()
      }

      // Ensure schoolDays exists (for backward compatibility)
      if (!this.db.data.schoolDays) {
        this.db.data.schoolDays = [
          { name: "Sunday", active: true },
          { name: "Monday", active: true },
          { name: "Tuesday", active: true },
          { name: "Wednesday", active: true },
          { name: "Thursday", active: true },
          { name: "Friday", active: true },
          { name: "Saturday", active: false },
        ]
        await this.db.write()
      }

      // Ensure sessions array exists
      if (!this.db.data.sessions) {
        this.db.data.sessions = []
        await this.db.write()
      }

      this.isInitialized = true
    } catch (error) {
      console.error("Failed to initialize database:", error)
      throw error
    }
  }

  // Teachers
  public async getTeachers(): Promise<Teacher[]> {
    await this.initialize()
    return this.db.data.teachers
  }

  public async addTeacher(teacher: Teacher): Promise<void> {
    await this.initialize()
    this.db.data.teachers.push(teacher)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updateTeacher(teacher: Teacher): Promise<void> {
    await this.initialize()
    const index = this.db.data.teachers.findIndex((t) => t.id === teacher.id)
    if (index !== -1) {
      this.db.data.teachers[index] = teacher
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async deleteTeacher(id: string): Promise<void> {
    await this.initialize()
    this.db.data.teachers = this.db.data.teachers.filter((t) => t.id !== id)
    // Also delete any schedules that use this teacher
    this.db.data.schedules = this.db.data.schedules.filter((s) => s.teacherId !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // Subjects
  public async getSubjects(): Promise<Subject[]> {
    await this.initialize()
    return this.db.data.subjects
  }

  public async addSubject(subject: Subject): Promise<void> {
    await this.initialize()
    this.db.data.subjects.push(subject)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updateSubject(subject: Subject): Promise<void> {
    await this.initialize()
    const index = this.db.data.subjects.findIndex((s) => s.id === subject.id)
    if (index !== -1) {
      this.db.data.subjects[index] = subject
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async deleteSubject(id: string): Promise<void> {
    await this.initialize()
    this.db.data.subjects = this.db.data.subjects.filter((s) => s.id !== id)
    // Also delete any schedules that use this subject
    this.db.data.schedules = this.db.data.schedules.filter((s) => s.subjectId !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // Periods
  public async getPeriods(): Promise<Period[]> {
    await this.initialize()
    return this.db.data.periods
  }

  public async addPeriod(period: Period): Promise<void> {
    await this.initialize()
    this.db.data.periods.push(period)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updatePeriod(period: Period): Promise<void> {
    await this.initialize()
    const index = this.db.data.periods.findIndex((p) => p.id === period.id)
    if (index !== -1) {
      this.db.data.periods[index] = period
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async deletePeriod(id: string): Promise<void> {
    await this.initialize()
    this.db.data.periods = this.db.data.periods.filter((p) => p.id !== id)
    // Also delete any schedules that use this period
    this.db.data.schedules = this.db.data.schedules.filter((s) => s.periodId !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // Class Grades
  public async getClassGrades(): Promise<ClassGrade[]> {
    await this.initialize()
    return this.db.data.classGrades
  }

  public async addClassGrade(classGrade: ClassGrade): Promise<void> {
    await this.initialize()
    this.db.data.classGrades.push(classGrade)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updateClassGrade(classGrade: ClassGrade): Promise<void> {
    await this.initialize()
    const index = this.db.data.classGrades.findIndex((c) => c.id === classGrade.id)
    if (index !== -1) {
      this.db.data.classGrades[index] = classGrade
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async deleteClassGrade(id: string): Promise<void> {
    await this.initialize()
    this.db.data.classGrades = this.db.data.classGrades.filter((c) => c.id !== id)
    // Also delete any schedules that use this class
    this.db.data.schedules = this.db.data.schedules.filter((s) => s.classId !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // School Days
  public async getSchoolDays(): Promise<SchoolDay[]> {
    await this.initialize()
    return this.db.data.schoolDays
  }

  public async updateSchoolDays(schoolDays: SchoolDay[]): Promise<void> {
    await this.initialize()
    this.db.data.schoolDays = schoolDays
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // Schedules
  public async getSchedules(): Promise<Schedule[]> {
    await this.initialize()
    return this.db.data.schedules
  }

  public async addSchedule(schedule: Schedule): Promise<void> {
    await this.initialize()

    // Validate the schedule before adding
    if (!validateSchedule(schedule)) {
      logScheduleOperation("Add", schedule, false)
      throw new Error("Invalid schedule data")
    }

    this.db.data.schedules.push(schedule)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()

    // Log successful operation
    logScheduleOperation("Add", schedule)
  }

  // Update the updateSchedule method to handle the case when a schedule isn't found
  public async updateSchedule(schedule: Schedule): Promise<void> {
    await this.initialize()

    // Validate the schedule before updating
    if (!validateSchedule(schedule)) {
      logScheduleOperation("Update", schedule, false)
      throw new Error("Invalid schedule data")
    }

    const index = this.db.data.schedules.findIndex((s) => s.id === schedule.id)

    if (index !== -1) {
      // Schedule found, update it
      this.db.data.schedules[index] = schedule
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()

      // Log successful operation
      logScheduleOperation("Update", schedule)
    } else {
      // Schedule not found, add it as a new schedule instead
      console.warn(`Schedule with ID ${schedule.id} not found. Adding as new schedule.`)
      this.db.data.schedules.push(schedule)
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()

      // Log the operation
      logScheduleOperation("Add (fallback from update)", schedule)
    }
  }

  public async deleteSchedule(id: string): Promise<void> {
    await this.initialize()
    this.db.data.schedules = this.db.data.schedules.filter((s) => s.id !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  // Get all data
  public async getAllData(): Promise<Omit<Schema, "lastUpdated" | "admins" | "sessions">> {
    await this.initialize()
    const { teachers, subjects, periods, schedules, classGrades, schoolDays } = this.db.data
    return { teachers, subjects, periods, schedules, classGrades, schoolDays }
  }

  // Admin methods
  public async getAdminByUsername(username: string): Promise<AdminUser | null> {
    await this.initialize()
    return this.db.data.admins.find((admin) => admin.username === username) || null
  }

  public async getAdminById(id: string): Promise<AdminUser | null> {
    await this.initialize()
    return this.db.data.admins.find((admin) => admin.id === id) || null
  }

  public async createAdmin(admin: AdminUser): Promise<void> {
    await this.initialize()
    this.db.data.admins.push(admin)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updateAdmin(admin: AdminUser): Promise<void> {
    await this.initialize()
    const index = this.db.data.admins.findIndex((a) => a.id === admin.id)
    if (index !== -1) {
      this.db.data.admins[index] = admin
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async deleteAdmin(id: string): Promise<void> {
    await this.initialize()
    this.db.data.admins = this.db.data.admins.filter((admin) => admin.id !== id)
    this.db.data.lastUpdated = new Date().toISOString()
    await this.db.write()
  }

  public async updateAdminLastLogin(id: string): Promise<void> {
    await this.initialize()
    const admin = this.db.data.admins.find((a) => a.id === id)
    if (admin) {
      admin.lastLogin = new Date().toISOString()
      this.db.data.lastUpdated = new Date().toISOString()
      await this.db.write()
    }
  }

  public async getAllAdmins(): Promise<AdminUser[]> {
    await this.initialize()
    return this.db.data.admins.map((admin) => ({
      ...admin,
      passwordHash: "[REDACTED]", // Don't send password hashes
    }))
  }

  // Session methods
  public async createSession(session: Session): Promise<void> {
    await this.initialize()
    this.db.data.sessions.push(session)
    await this.db.write()
  }

  public async getSessionByToken(token: string): Promise<Session | null> {
    await this.initialize()
    return this.db.data.sessions.find((s) => s.token === token) || null
  }

  public async deleteSession(id: string): Promise<void> {
    await this.initialize()
    this.db.data.sessions = this.db.data.sessions.filter((s) => s.id !== id)
    await this.db.write()
  }

  public async deleteAllSessionsByUserId(userId: string): Promise<void> {
    await this.initialize()
    this.db.data.sessions = this.db.data.sessions.filter((s) => s.userId !== userId)
    await this.db.write()
  }
}

// Re-export the JSON storage as db for backward compatibility
export const db = jsonStorage
