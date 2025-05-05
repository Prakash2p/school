"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Toaster } from "@/components/ui/toaster"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { ScheduleView } from "@/components/schedule-view"
import { AdminDashboard } from "@/components/admin-dashboard"
import { LoginForm } from "@/components/login-form"
import { ManageAccount } from "@/components/manage-account"
import { db } from "@/lib/db"
import { authService } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ManageAdmins } from "@/components/manage-admins"
import type {
  Teacher,
  Subject,
  Period,
  Schedule,
  ClassGrade,
  UserRole,
  SchoolDay,
  AdminUser,
  AcademicSession,
} from "@/lib/types"
import { jsonStorage } from "@/lib/json-storage"
// Update the import statement for storageManager
import { storageManager } from "@/lib/storage-manager"

// Import at the top
import { registerServiceWorker } from "@/lib/service-worker"

export default function Home() {
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>("Teacher")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all")
  const [showAdminManager, setShowAdminManager] = useState(false)
  const [showAccountManager, setShowAccountManager] = useState(false)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [classGrades, setClassGrades] = useState<ClassGrade[]>([])
  const [schoolDays, setSchoolDays] = useState<SchoolDay[]>([])
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataVersion, setDataVersion] = useState(0) // Used to trigger re-renders when data changes

  // Add these state variables
  const [hasStorageError, setHasStorageError] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  // Add online/offline status handling
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Get active days from schoolDays
  const activeDays = useMemo(() => schoolDays.filter((day) => day.active).map((day) => day.name), [schoolDays])

  // Get current day of the week
  const getCurrentDay = useCallback(() => {
    // Create a date object with Nepal's timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kathmandu",
      weekday: "long",
    }

    // Get the current day name in Nepal
    const nepalDay = new Intl.DateTimeFormat("en-US", options).format(new Date())

    // Check if the current day is an active school day
    if (activeDays.length > 0) {
      const currentDayInfo = schoolDays.find((d) => d.name === nepalDay)
      if (currentDayInfo && !currentDayInfo.active) {
        // If current day is not active, find the next active day
        if (activeDays.length > 0) {
          return activeDays[0] // Return the first active day
        }
      }
    }

    return nepalDay
  }, [activeDays, schoolDays])

  const [selectedDay, setSelectedDay] = useState<string>("Monday") // Default to Monday initially

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)

        // Skip database operations during SSR
        if (typeof window === "undefined") {
          console.log("Skipping database operations during SSR")
          return
        }

        // Check storage availability
        const storageAvailable = storageManager.isLocalStorageAvailable()
        if (!storageAvailable) {
          setHasStorageError(true)
          console.error("LocalStorage is not available")
          toast({
            title: "Storage Error",
            description: "Unable to access browser storage. Some features may not work properly.",
            variant: "destructive",
          })
        }

        // Ensure default admin exists
        await authService.ensureDefaultAdmin()

        // Load all data from the database
        const data = await db.getAllData()
        const adminsList = await db.getAllAdmins()
        setAdmins(adminsList)

        // Use batch updates to improve performance
        setTeachers(data.teachers)
        setSubjects(data.subjects)
        setPeriods(data.periods)
        setSchedules(data.schedules)
        setClassGrades(data.classGrades)
        setSchoolDays(
          data.schoolDays || [
            { name: "Sunday", active: true },
            { name: "Monday", active: true },
            { name: "Tuesday", active: true },
            { name: "Wednesday", active: true },
            { name: "Thursday", active: true },
            { name: "Friday", active: true },
            { name: "Saturday", active: false },
          ],
        )
        setAcademicSessions(
          data.academicSessions || [
            {
              id: "default-session",
              name: "2082",
              startDate: "2082-01-01",
              endDate: "2082-12-31",
              isActive: true,
            },
          ],
        )
        setDataVersion((prev) => prev + 1) // Increment data version to trigger re-renders

        // Now that we have school days, set the selected day
        setSelectedDay(getCurrentDay())

        // Set first load flag to false after first successful load
        setIsFirstLoad(false)
      } catch (error) {
        console.error("Failed to initialize app:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [toast, getCurrentDay])

  // Add a useEffect to register the service worker
  useEffect(() => {
    if (typeof window !== "undefined") {
      registerServiceWorker()
    }
  }, [])

  // Add this effect to check for stored authentication on page load
  useEffect(() => {
    const checkStoredAuth = async () => {
      const storedToken = authService.getStoredToken()

      if (storedToken) {
        try {
          const user = await authService.validateToken(storedToken)
          if (user) {
            setIsLoggedIn(true)
            setUserRole("Admin")
            setCurrentUser(user)
            setSessionToken(storedToken)
            console.log("Session restored from stored token")
          } else {
            // Token is invalid or expired, clear it
            authService.clearStoredToken()
          }
        } catch (error) {
          console.error("Error validating stored token:", error)
          authService.clearStoredToken()
        }
      }
    }

    checkStoredAuth()
  }, [])

  // Update selected day when school days change
  useEffect(() => {
    if (schoolDays.length > 0) {
      setSelectedDay(getCurrentDay())
    }
  }, [schoolDays, getCurrentDay])

  // Memoize handlers to prevent unnecessary re-renders
  const handleLogin = useCallback(async (username: string, password: string) => {
    try {
      const result = await authService.login(username, password)
      if (result) {
        setIsLoggedIn(true)
        setUserRole("Admin")
        setCurrentUser(result.user)
        setSessionToken(result.token)

        // Save the token for persistence
        await authService.saveToken(result.token)

        setShowLoginForm(false)
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }, [])

  // Modify the handleLogout function to clear the stored token
  const handleLogout = useCallback(async () => {
    if (sessionToken) {
      await authService.logout(sessionToken)
    }
    setIsLoggedIn(false)
    setUserRole("Teacher")
    setCurrentUser(null)
    setSessionToken(null)

    // Clear the stored token
    authService.clearStoredToken()
  }, [sessionToken])

  // Schedule handlers
  const handleAddSchedule = useCallback(
    async (newSchedule: Schedule) => {
      try {
        // Ensure the schedule has all required fields
        if (!newSchedule.day) {
          newSchedule.day = selectedDay
        }

        // If no academic session ID is provided, use the active one
        if (!newSchedule.academicSessionId) {
          const activeSession = academicSessions.find((session) => session.isActive)
          if (activeSession) {
            newSchedule.academicSessionId = activeSession.id
          } else if (academicSessions.length > 0) {
            newSchedule.academicSessionId = academicSessions[0].id
          } else {
            throw new Error("No academic session available")
          }
        }

        await db.addSchedule(newSchedule)
        // Create a new array instead of mutating the existing one
        setSchedules((prev) => [...prev, newSchedule])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Schedule added successfully",
        })
      } catch (error) {
        console.error("Failed to add schedule:", error)
        toast({
          title: "Error",
          description: "Failed to add schedule",
          variant: "destructive",
        })
      }
    },
    [toast, selectedDay, academicSessions],
  )

  const handleUpdateSchedule = useCallback(
    async (updatedSchedule: Schedule) => {
      try {
        // Ensure the schedule has all required fields
        if (!updatedSchedule.day) {
          updatedSchedule.day = selectedDay
        }

        // If no academic session ID is provided, use the active one
        if (!updatedSchedule.academicSessionId) {
          const activeSession = academicSessions.find((session) => session.isActive)
          if (activeSession) {
            updatedSchedule.academicSessionId = activeSession.id
          } else if (academicSessions.length > 0) {
            updatedSchedule.academicSessionId = academicSessions[0].id
          } else {
            throw new Error("No academic session available")
          }
        }

        // Log the schedule being updated for debugging
        console.log("Updating schedule:", updatedSchedule)

        await db.updateSchedule(updatedSchedule)

        // Create a new array with the updated schedule
        setSchedules((prev) => {
          // Check if the schedule exists in the current state
          const exists = prev.some((s) => s.id === updatedSchedule.id)

          if (exists) {
            // Update existing schedule
            return prev.map((schedule) => (schedule.id === updatedSchedule.id ? updatedSchedule : schedule))
          } else {
            // Add as new if it doesn't exist
            return [...prev, updatedSchedule]
          }
        })

        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Schedule updated successfully",
        })
      } catch (error) {
        console.error("Failed to update schedule:", error)
        toast({
          title: "Error",
          description: `Failed to update schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        })
      }
    },
    [toast, selectedDay, academicSessions],
  )

  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      try {
        await db.deleteSchedule(scheduleId)
        setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId))
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Schedule deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete schedule:", error)
        toast({
          title: "Error",
          description: "Failed to delete schedule",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // Teacher handlers
  const handleAddTeacher = useCallback(
    async (newTeacher: Teacher) => {
      try {
        await db.addTeacher(newTeacher)
        setTeachers((prev) => [...prev, newTeacher])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Teacher added successfully",
        })
      } catch (error) {
        console.error("Failed to add teacher:", error)
        toast({
          title: "Error",
          description: "Failed to add teacher",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleUpdateTeacher = useCallback(
    async (updatedTeacher: Teacher) => {
      try {
        await db.updateTeacher(updatedTeacher)
        setTeachers((prev) => prev.map((teacher) => (teacher.id === updatedTeacher.id ? updatedTeacher : teacher)))
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Teacher updated successfully",
        })
      } catch (error) {
        console.error("Failed to update teacher:", error)
        toast({
          title: "Error",
          description: "Failed to update teacher",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDeleteTeacher = useCallback(
    async (teacherId: string) => {
      try {
        // First, check if there are any schedules using this teacher
        const relatedSchedules = schedules.filter((schedule) => schedule.teacherId === teacherId)

        if (relatedSchedules.length > 0) {
          // Delete all related schedules first
          for (const schedule of relatedSchedules) {
            await db.deleteSchedule(schedule.id)
          }

          // Update schedules state
          setSchedules((prev) => prev.filter((schedule) => schedule.teacherId !== teacherId))
        }

        // Now delete the teacher
        await db.deleteTeacher(teacherId)
        setTeachers((prev) => prev.filter((teacher) => teacher.id !== teacherId))
        setDataVersion((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete teacher:", error)
        toast({
          title: "Error",
          description: "Failed to delete teacher",
          variant: "destructive",
        })
      }
    },
    [schedules, toast],
  )

  // Subject handlers
  const handleAddSubject = useCallback(
    async (newSubject: Subject) => {
      try {
        await db.addSubject(newSubject)
        setSubjects((prev) => [...prev, newSubject])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Subject added successfully",
        })
      } catch (error) {
        console.error("Failed to add subject:", error)
        toast({
          title: "Error",
          description: "Failed to add subject",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleUpdateSubject = useCallback(
    async (updatedSubject: Subject) => {
      try {
        await db.updateSubject(updatedSubject)
        setSubjects((prev) => prev.map((subject) => (subject.id === updatedSubject.id ? updatedSubject : subject)))
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Subject updated successfully",
        })
      } catch (error) {
        console.error("Failed to update subject:", error)
        toast({
          title: "Error",
          description: "Failed to update subject",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDeleteSubject = useCallback(
    async (subjectId: string) => {
      try {
        // First, check if there are any schedules using this subject
        const relatedSchedules = schedules.filter((schedule) => schedule.subjectId === subjectId)

        if (relatedSchedules.length > 0) {
          // Delete all related schedules first
          for (const schedule of relatedSchedules) {
            await db.deleteSchedule(schedule.id)
          }

          // Update schedules state
          setSchedules((prev) => prev.filter((schedule) => schedule.subjectId !== subjectId))
        }

        // Now delete the subject
        await db.deleteSubject(subjectId)
        setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId))
        setDataVersion((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Subject deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete subject:", error)
        toast({
          title: "Error",
          description: "Failed to delete subject",
          variant: "destructive",
        })
      }
    },
    [schedules, toast],
  )

  // Class handlers
  const handleAddClassGrade = useCallback(
    async (newClass: ClassGrade) => {
      try {
        await db.addClassGrade(newClass)
        setClassGrades((prev) => [...prev, newClass])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Class added successfully",
        })
      } catch (error) {
        console.error("Failed to add class:", error)
        toast({
          title: "Error",
          description: "Failed to add class",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleUpdateClassGrade = useCallback(
    async (updatedClass: ClassGrade) => {
      try {
        await db.updateClassGrade(updatedClass)
        setClassGrades((prev) =>
          prev.map((classGrade) => (classGrade.id === updatedClass.id ? updatedClass : classGrade)),
        )
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Class updated successfully",
        })
      } catch (error) {
        console.error("Failed to update class:", error)
        toast({
          title: "Error",
          description: "Failed to update class",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDeleteClassGrade = useCallback(
    async (classId: string) => {
      try {
        // First, check if there are any schedules using this class
        const relatedSchedules = schedules.filter((schedule) => schedule.classId === classId)

        if (relatedSchedules.length > 0) {
          // Delete all related schedules first
          for (const schedule of relatedSchedules) {
            await db.deleteSchedule(schedule.id)
          }

          // Update schedules state
          setSchedules((prev) => prev.filter((schedule) => schedule.classId !== classId))
        }

        // Now delete the class
        await db.deleteClassGrade(classId)
        setClassGrades((prev) => prev.filter((classGrade) => classGrade.id !== classId))
        setDataVersion((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Class deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete class:", error)
        toast({
          title: "Error",
          description: "Failed to delete class",
          variant: "destructive",
        })
      }
    },
    [schedules, toast],
  )

  // Period handlers
  const handleAddPeriod = useCallback(
    async (newPeriod: Period) => {
      try {
        await db.addPeriod(newPeriod)
        setPeriods((prev) => [...prev, newPeriod])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: `${newPeriod.isInterval ? "Break" : "Period"} added successfully`,
        })
      } catch (error) {
        console.error("Failed to add period:", error)
        toast({
          title: "Error",
          description: `Failed to add ${newPeriod.isInterval ? "break" : "period"}`,
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleUpdatePeriod = useCallback(
    async (updatedPeriod: Period) => {
      try {
        await db.updatePeriod(updatedPeriod)
        setPeriods((prev) => prev.map((period) => (period.id === updatedPeriod.id ? updatedPeriod : period)))
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: `${updatedPeriod.isInterval ? "Break" : "Period"} updated successfully`,
        })
      } catch (error) {
        console.error("Failed to update period:", error)
        toast({
          title: "Error",
          description: `Failed to update ${updatedPeriod.isInterval ? "break" : "period"}`,
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDeletePeriod = useCallback(
    async (periodId: string) => {
      try {
        // First, check if there are any schedules using this period
        const relatedSchedules = schedules.filter((schedule) => schedule.periodId === periodId)

        if (relatedSchedules.length > 0) {
          // Delete all related schedules first
          for (const schedule of relatedSchedules) {
            await db.deleteSchedule(schedule.id)
          }

          // Update schedules state
          setSchedules((prev) => prev.filter((schedule) => schedule.periodId !== periodId))
        }

        // Now delete the period
        await db.deletePeriod(periodId)
        setPeriods((prev) => prev.filter((period) => period.id !== periodId))
        setDataVersion((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Period/Break deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete period:", error)
        toast({
          title: "Error",
          description: "Failed to delete period/break",
          variant: "destructive",
        })
      }
    },
    [schedules, toast],
  )

  // School Days handler
  const handleUpdateSchoolDays = useCallback(
    async (updatedSchoolDays: SchoolDay[]) => {
      try {
        await db.updateSchoolDays(updatedSchoolDays)
        setSchoolDays(updatedSchoolDays)
        setDataVersion((prev) => prev + 1)

        // Check if the currently selected day is still active
        const currentDayInfo = updatedSchoolDays.find((d) => d.name === selectedDay)
        if (currentDayInfo && !currentDayInfo.active) {
          // If current day is not active, find the next active day
          const activeDays = updatedSchoolDays.filter((d) => d.active).map((d) => d.name)
          if (activeDays.length > 0) {
            setSelectedDay(activeDays[0]) // Set to the first active day
          }
        }

        toast({
          title: "Success",
          description: "School days updated successfully",
        })
      } catch (error) {
        console.error("Failed to update school days:", error)
        toast({
          title: "Error",
          description: "Failed to update school days",
          variant: "destructive",
        })
      }
    },
    [selectedDay, toast],
  )

  // Academic Session handlers
  const handleAddAcademicSession = useCallback(
    async (session: AcademicSession) => {
      try {
        await db.addAcademicSession(session)
        setAcademicSessions((prev) => [...prev, session])
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Academic session added successfully",
        })
      } catch (error) {
        console.error("Failed to add academic session:", error)
        toast({
          title: "Error",
          description: "Failed to add academic session",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleUpdateAcademicSession = useCallback(
    async (session: AcademicSession) => {
      try {
        await db.updateAcademicSession(session)
        setAcademicSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)))
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Academic session updated successfully",
        })
      } catch (error) {
        console.error("Failed to update academic session:", error)
        toast({
          title: "Error",
          description: "Failed to update academic session",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDeleteAcademicSession = useCallback(
    async (sessionId: string) => {
      try {
        await db.deleteAcademicSession(sessionId)
        setAcademicSessions((prev) => prev.filter((s) => s.id !== sessionId))

        // Also delete any schedules that use this session
        const relatedSchedules = schedules.filter((schedule) => schedule.academicSessionId === sessionId)
        if (relatedSchedules.length > 0) {
          setSchedules((prev) => prev.filter((schedule) => schedule.academicSessionId !== sessionId))
        }

        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Academic session deleted successfully",
        })
      } catch (error) {
        console.error("Failed to delete academic session:", error)
        toast({
          title: "Error",
          description: "Failed to delete academic session",
          variant: "destructive",
        })
      }
    },
    [schedules, toast],
  )

  const handleSetActiveSession = useCallback(
    async (sessionId: string) => {
      try {
        await db.setActiveAcademicSession(sessionId)
        setAcademicSessions((prev) =>
          prev.map((session) => ({
            ...session,
            isActive: session.id === sessionId,
          })),
        )
        setDataVersion((prev) => prev + 1)
        toast({
          title: "Success",
          description: "Active academic session changed successfully",
        })
      } catch (error) {
        console.error("Failed to set active academic session:", error)
        toast({
          title: "Error",
          description: "Failed to set active academic session",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleAddAdmin = async (admin: AdminUser) => {
    try {
      await db.createAdmin(admin)
      setAdmins((prev) => [...prev, admin])
      toast({
        title: "Success",
        description: "Administrator added successfully",
      })
    } catch (error) {
      console.error("Failed to add admin:", error)
      toast({
        title: "Error",
        description: "Failed to add administrator",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAdmin = async (admin: AdminUser) => {
    try {
      await db.updateAdmin(admin)
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? admin : a)))
      if (currentUser?.id === admin.id) {
        setCurrentUser(admin)
      }
      toast({
        title: "Success",
        description: "Administrator updated successfully",
      })
    } catch (error) {
      console.error("Failed to update admin:", error)
      toast({
        title: "Error",
        description: "Failed to update administrator",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await db.deleteAdmin(adminId)
      setAdmins((prev) => prev.filter((a) => a.id !== adminId))
      toast({
        title: "Success",
        description: "Administrator deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete admin:", error)
      toast({
        title: "Error",
        description: "Failed to delete administrator",
        variant: "destructive",
      })
    }
  }

  // Export data to JSON file
  const handleExportData = useCallback(async () => {
    try {
      await jsonStorage.exportToJsonFile()
      toast({
        title: "Success",
        description: "Data exported to JSON file successfully",
      })
    } catch (error) {
      console.error("Failed to export data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }, [toast])

  // Import data from JSON file
  const handleImportData = useCallback(
    async (jsonData: string) => {
      try {
        await jsonStorage.importFromJsonFile(jsonData)

        // Reload all data
        const data = await db.getAllData()
        const adminsList = await db.getAllAdmins()

        setTeachers(data.teachers)
        setSubjects(data.subjects)
        setPeriods(data.periods)
        setSchedules(data.schedules)
        setClassGrades(data.classGrades)
        setSchoolDays(data.schoolDays)
        setAcademicSessions(data.academicSessions)
        setAdmins(adminsList)

        setDataVersion((prev) => prev + 1)

        toast({
          title: "Success",
          description: "Data imported from JSON file successfully",
        })
      } catch (error) {
        console.error("Failed to import data:", error)
        toast({
          title: "Error",
          description: "Failed to import data. Invalid JSON format.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sky-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showLoginForm && <LoginForm onLogin={handleLogin} onCancel={() => setShowLoginForm(false)} />}

      <AppHeader
        title="School Schedule Manager"
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        isAdmin={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginForm(true)}
        onLogout={handleLogout}
        onManageAdmins={() => setShowAdminManager(true)}
        onManageAccount={() => setShowAccountManager(true)}
        availableDays={activeDays}
      />

      {/* Add an offline warning banner (place it right after the header in the JSX) */}
      {!isOnline && (
        <div className="bg-amber-50 border-b border-amber-200 p-2 text-center text-amber-800">
          <p className="text-sm font-medium">
            You're currently offline. Changes will be saved and synchronized when you're back online.
          </p>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-6">
        {isLoggedIn && userRole === "Admin" ? (
          <AdminDashboard
            teachers={teachers}
            subjects={subjects}
            periods={periods}
            schedules={schedules}
            classGrades={classGrades}
            schoolDays={schoolDays}
            academicSessions={academicSessions}
            selectedDay={selectedDay}
            onAddSchedule={handleAddSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddClassGrade={handleAddClassGrade}
            onUpdateClassGrade={handleUpdateClassGrade}
            onDeleteClassGrade={handleDeleteClassGrade}
            onAddPeriod={handleAddPeriod}
            onUpdatePeriod={handleUpdatePeriod}
            onDeletePeriod={handleDeletePeriod}
            onUpdateSchoolDays={handleUpdateSchoolDays}
            onAddAcademicSession={handleAddAcademicSession}
            onUpdateAcademicSession={handleUpdateAcademicSession}
            onDeleteAcademicSession={handleDeleteAcademicSession}
            onSetActiveSession={handleSetActiveSession}
            currentUser={currentUser}
            admins={admins}
            onAddAdmin={handleAddAdmin}
            onUpdateAdmin={handleUpdateAdmin}
            onDeleteAdmin={handleDeleteAdmin}
          />
        ) : (
          <ScheduleView
            teachers={teachers}
            subjects={subjects}
            periods={periods}
            schedules={schedules}
            classGrades={classGrades}
            selectedDay={selectedDay}
            userRole={userRole}
            selectedTeacherId={selectedTeacherId}
            onSelectTeacher={setSelectedTeacherId}
            availableDays={activeDays}
          />
        )}
      </main>

      <AppFooter />
      <Toaster />

      {/* Admin Management Modal */}
      {showAdminManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sky-700">Manage Administrators</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdminManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ManageAdmins
                currentUser={currentUser}
                admins={admins}
                onAddAdmin={handleAddAdmin}
                onUpdateAdmin={handleUpdateAdmin}
                onDeleteAdmin={handleDeleteAdmin}
              />
            </div>
          </div>
        </div>
      )}

      {/* Account Management Modal */}
      {showAccountManager && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sky-700">My Account</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccountManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ManageAccount currentUser={currentUser} onUpdateUser={handleUpdateAdmin} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
