import type {
  Teacher,
  Subject,
  Period,
  Schedule,
  ClassGrade,
  SchoolDay,
  AdminUser,
  Session,
  AcademicSession,
} from "./types"

// Define the structure of our JSON data store
interface JsonDataStore {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  schoolDays: SchoolDay[]
  academicSessions: AcademicSession[]
  admins: AdminUser[]
  sessions: Session[]
}

// Initialize with default data
const initialData: JsonDataStore = {
  teachers: [
    { id: "t1", name: "Dhan Bdr Rokaya" },
    { id: "t2", name: "Deepa Kshetri" },
    { id: "t3", name: "Neha Sunar" },
    { id: "t4", name: "Krishana Niroula" },
    { id: "t5", name: "Prakash Raj Bhatt" },
    { id: "t6", name: "Deepa Kshetri" },
  ],
  subjects: [
    { id: "s1", name: "Mathematics" },
    { id: "s2", name: "Science" },
    { id: "s3", name: "English" },
    { id: "s4", name: "AP" },
    { id: "s5", name: "Computer Science" },
    { id: "s6", name: "Physical Education" },
  ],
  periods: [
    { id: "p1", name: "1st Period", startTime: "08:00", endTime: "09:00", isInterval: false },
    { id: "p2", name: "2nd Period", startTime: "09:10", endTime: "10:10", isInterval: false },
    { id: "p3", name: "Break", startTime: "10:10", endTime: "10:30", isInterval: true },
    { id: "p4", name: "3rd Period", startTime: "10:30", endTime: "11:30", isInterval: false },
    { id: "p5", name: "4th Period", startTime: "11:40", endTime: "12:40", isInterval: false },
    { id: "p6", name: "Lunch", startTime: "12:40", endTime: "13:30", isInterval: true },
    { id: "p7", name: "5th Period", startTime: "13:30", endTime: "14:30", isInterval: false },
    { id: "p8", name: "6th Period", startTime: "14:40", endTime: "15:40", isInterval: false },
  ],
  classGrades: [
    { id: "c1", name: "Class 1" },
    { id: "c2", name: "Class 2" },
    { id: "c3", name: "Class 3" },
    { id: "c4", name: "Class 4" },
    { id: "c5", name: "Class 5" },
    { id: "c6", name: "Class 6" },
  ],
  schedules: [
    // Monday schedules
    {
      id: "s1",
      day: "Monday",
      classId: "c1",
      teacherId: "t1",
      subjectId: "s1",
      periodId: "p1",
      academicSessionId: "as1",
    },
    {
      id: "s2",
      day: "Monday",
      classId: "c2",
      teacherId: "t2",
      subjectId: "s2",
      periodId: "p1",
      academicSessionId: "as1",
    },
    {
      id: "s3",
      day: "Monday",
      classId: "c1",
      teacherId: "t3",
      subjectId: "s3",
      periodId: "p2",
      academicSessionId: "as1",
    },
    {
      id: "s4",
      day: "Monday",
      classId: "c2",
      teacherId: "t1",
      subjectId: "s1",
      periodId: "p2",
      academicSessionId: "as1",
    },
    {
      id: "s5",
      day: "Monday",
      classId: "c1",
      teacherId: "t4",
      subjectId: "s4",
      periodId: "p4",
      academicSessionId: "as1",
    },
    {
      id: "s6",
      day: "Monday",
      classId: "c2",
      teacherId: "t5",
      subjectId: "s5",
      periodId: "p4",
      academicSessionId: "as1",
    },

    // Tuesday schedules
    {
      id: "s7",
      day: "Tuesday",
      classId: "c3",
      teacherId: "t1",
      subjectId: "s1",
      periodId: "p1",
      academicSessionId: "as1",
    },
    {
      id: "s8",
      day: "Tuesday",
      classId: "c4",
      teacherId: "t2",
      subjectId: "s2",
      periodId: "p1",
      academicSessionId: "as1",
    },
    {
      id: "s9",
      day: "Tuesday",
      classId: "c3",
      teacherId: "t3",
      subjectId: "s3",
      periodId: "p2",
      academicSessionId: "as1",
    },
    {
      id: "s10",
      day: "Tuesday",
      classId: "c4",
      teacherId: "t4",
      subjectId: "s4",
      periodId: "p2",
      academicSessionId: "as1",
    },
  ],
  schoolDays: [
    { name: "Sunday", active: true },
    { name: "Monday", active: true },
    { name: "Tuesday", active: true },
    { name: "Wednesday", active: true },
    { name: "Thursday", active: true },
    { name: "Friday", active: true },
    { name: "Saturday", active: false },
  ],
  academicSessions: [
    {
      id: "as1",
      name: "2082",
      startDate: "2082-01-01",
      endDate: "2082-12-31",
      isActive: true,
    },
  ],
  admins: [
    {
      id: "admin1",
      username: "admin",
      passwordHash: "admin123", // In production, use proper hashing
      role: "SuperAdmin",
      name: "System Administrator",
      email: "admin@example.com",
      createdAt: new Date().toISOString(),
    },
  ],
  sessions: [],
}

// In-memory data store
let dataStore: JsonDataStore = { ...initialData }

// Helper function to save data to a JSON file
const saveToFile = async (data: JsonDataStore): Promise<void> => {
  try {
    // In a browser environment, we'll create a downloadable file
    if (typeof window !== "undefined") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "school-scheduler-data.json"
      a.click()
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error("Error saving data to file:", error)
    throw error
  }
}

// Helper function to load data from a JSON file
const loadFromFile = async (jsonString: string): Promise<JsonDataStore> => {
  try {
    const data = JSON.parse(jsonString) as JsonDataStore
    return data
  } catch (error) {
    console.error("Error loading data from file:", error)
    throw error
  }
}

class JsonStorage {
  // Get all data
  async getAllData(): Promise<Omit<JsonDataStore, "admins" | "sessions">> {
    const { admins, sessions, ...rest } = dataStore
    return rest
  }

  // Teacher operations
  async getAllTeachers(): Promise<Teacher[]> {
    return [...dataStore.teachers]
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    return dataStore.teachers.find((t) => t.id === id) || null
  }

  async addTeacher(teacher: Teacher): Promise<void> {
    dataStore.teachers.push(teacher)
  }

  async updateTeacher(teacher: Teacher): Promise<void> {
    const index = dataStore.teachers.findIndex((t) => t.id === teacher.id)
    if (index !== -1) {
      dataStore.teachers[index] = teacher
    } else {
      throw new Error("Teacher not found")
    }
  }

  async deleteTeacher(id: string): Promise<void> {
    dataStore.teachers = dataStore.teachers.filter((t) => t.id !== id)
  }

  // Subject operations
  async getAllSubjects(): Promise<Subject[]> {
    return [...dataStore.subjects]
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    return dataStore.subjects.find((s) => s.id === id) || null
  }

  async addSubject(subject: Subject): Promise<void> {
    dataStore.subjects.push(subject)
  }

  async updateSubject(subject: Subject): Promise<void> {
    const index = dataStore.subjects.findIndex((s) => s.id === subject.id)
    if (index !== -1) {
      dataStore.subjects[index] = subject
    } else {
      throw new Error("Subject not found")
    }
  }

  async deleteSubject(id: string): Promise<void> {
    dataStore.subjects = dataStore.subjects.filter((s) => s.id !== id)
  }

  // Period operations
  async getAllPeriods(): Promise<Period[]> {
    return [...dataStore.periods]
  }

  async getPeriodById(id: string): Promise<Period | null> {
    return dataStore.periods.find((p) => p.id === id) || null
  }

  async addPeriod(period: Period): Promise<void> {
    dataStore.periods.push(period)
  }

  async updatePeriod(period: Period): Promise<void> {
    const index = dataStore.periods.findIndex((p) => p.id === period.id)
    if (index !== -1) {
      dataStore.periods[index] = period
    } else {
      throw new Error("Period not found")
    }
  }

  async deletePeriod(id: string): Promise<void> {
    dataStore.periods = dataStore.periods.filter((p) => p.id !== id)
  }

  // Class operations
  async getAllClassGrades(): Promise<ClassGrade[]> {
    return [...dataStore.classGrades]
  }

  async getClassGradeById(id: string): Promise<ClassGrade | null> {
    return dataStore.classGrades.find((c) => c.id === id) || null
  }

  async addClassGrade(classGrade: ClassGrade): Promise<void> {
    dataStore.classGrades.push(classGrade)
  }

  async updateClassGrade(classGrade: ClassGrade): Promise<void> {
    const index = dataStore.classGrades.findIndex((c) => c.id === classGrade.id)
    if (index !== -1) {
      dataStore.classGrades[index] = classGrade
    } else {
      throw new Error("Class not found")
    }
  }

  async deleteClassGrade(id: string): Promise<void> {
    dataStore.classGrades = dataStore.classGrades.filter((c) => c.id !== id)
  }

  // Schedule operations
  async getAllSchedules(): Promise<Schedule[]> {
    return [...dataStore.schedules]
  }

  async getScheduleById(id: string): Promise<Schedule | null> {
    return dataStore.schedules.find((s) => s.id === id) || null
  }

  async addSchedule(schedule: Schedule): Promise<void> {
    dataStore.schedules.push(schedule)
  }

  async updateSchedule(schedule: Schedule): Promise<void> {
    const index = dataStore.schedules.findIndex((s) => s.id === schedule.id)
    if (index !== -1) {
      dataStore.schedules[index] = schedule
    } else {
      // If schedule not found, add it as a new one
      dataStore.schedules.push(schedule)
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    dataStore.schedules = dataStore.schedules.filter((s) => s.id !== id)
  }

  // School days operations
  async getSchoolDays(): Promise<SchoolDay[]> {
    return [...dataStore.schoolDays]
  }

  async updateSchoolDays(schoolDays: SchoolDay[]): Promise<void> {
    dataStore.schoolDays = [...schoolDays]
  }

  // Academic session operations
  async getAllAcademicSessions(): Promise<AcademicSession[]> {
    return [...dataStore.academicSessions]
  }

  async getAcademicSessionById(id: string): Promise<AcademicSession | null> {
    return dataStore.academicSessions.find((s) => s.id === id) || null
  }

  async addAcademicSession(session: AcademicSession): Promise<void> {
    dataStore.academicSessions.push(session)
  }

  async updateAcademicSession(session: AcademicSession): Promise<void> {
    const index = dataStore.academicSessions.findIndex((s) => s.id === session.id)
    if (index !== -1) {
      dataStore.academicSessions[index] = session
    } else {
      throw new Error("Academic session not found")
    }
  }

  async deleteAcademicSession(id: string): Promise<void> {
    dataStore.academicSessions = dataStore.academicSessions.filter((s) => s.id !== id)
  }

  async setActiveAcademicSession(id: string): Promise<void> {
    dataStore.academicSessions = dataStore.academicSessions.map((session) => ({
      ...session,
      isActive: session.id === id,
    }))
  }

  // Admin operations
  async getAllAdmins(): Promise<AdminUser[]> {
    return [...dataStore.admins]
  }

  async getAdminById(id: string): Promise<AdminUser | null> {
    return dataStore.admins.find((a) => a.id === id) || null
  }

  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    return dataStore.admins.find((a) => a.username === username) || null
  }

  async createAdmin(admin: AdminUser): Promise<void> {
    dataStore.admins.push(admin)
  }

  async updateAdmin(admin: AdminUser): Promise<void> {
    const index = dataStore.admins.findIndex((a) => a.id === admin.id)
    if (index !== -1) {
      dataStore.admins[index] = admin
    } else {
      throw new Error("Admin not found")
    }
  }

  async deleteAdmin(id: string): Promise<void> {
    dataStore.admins = dataStore.admins.filter((a) => a.id !== id)
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    const admin = dataStore.admins.find((a) => a.id === id)
    if (admin) {
      admin.lastLogin = new Date().toISOString()
    }
  }

  // Session operations
  async createSession(session: Session): Promise<void> {
    dataStore.sessions.push(session)
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    return dataStore.sessions.find((s) => s.token === token) || null
  }

  async deleteSession(id: string): Promise<void> {
    dataStore.sessions = dataStore.sessions.filter((s) => s.id !== id)
  }

  // Export and import operations
  async exportToJsonFile(): Promise<void> {
    await saveToFile(dataStore)
  }

  async importFromJsonFile(jsonString: string): Promise<void> {
    const newData = await loadFromFile(jsonString)
    dataStore = newData
  }

  // Reset to initial data
  async resetToInitialData(): Promise<void> {
    dataStore = { ...initialData }
  }
}

export const jsonStorage = new JsonStorage()
