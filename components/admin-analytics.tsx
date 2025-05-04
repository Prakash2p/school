"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import type { ClassGrade, Period, Schedule, Subject, Teacher } from "@/lib/types"
import { getTeacherWorkload } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, School, Clock, PieChartIcon, BarChartIcon, TrendingUp, Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface AdminAnalyticsProps {
  schedules: Schedule[]
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  classGrades: ClassGrade[]
}

export function AdminAnalytics({ schedules, teachers, subjects, periods, classGrades }: AdminAnalyticsProps) {
  const [chartType, setChartType] = useState<"bar" | "pie" | "line" | "area">("bar")

  // Calculate teacher workload data
  const teacherWorkloadData = useMemo(() => {
    return teachers
      .map((teacher) => ({
        name: teacher.name,
        workload: getTeacherWorkload(schedules, teacher.id),
      }))
      .sort((a, b) => b.workload - a.workload)
      .slice(0, 10) // Top 10 teachers by workload
  }, [teachers, schedules])

  // Calculate subject distribution data
  const subjectDistributionData = useMemo(() => {
    const subjectCounts = new Map<string, number>()

    schedules.forEach((schedule) => {
      const subjectId = schedule.subjectId
      subjectCounts.set(subjectId, (subjectCounts.get(subjectId) || 0) + 1)
    })

    return subjects
      .map((subject) => ({
        name: subject.name,
        value: subjectCounts.get(subject.id) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [schedules, subjects])

  // Calculate class schedule density
  const classScheduleData = useMemo(() => {
    const classScheduleCounts = new Map<string, number>()

    schedules.forEach((schedule) => {
      const classId = schedule.classId
      classScheduleCounts.set(classId, (classScheduleCounts.get(classId) || 0) + 1)
    })

    return classGrades
      .map((classGrade) => ({
        name: classGrade.name,
        count: classScheduleCounts.get(classGrade.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [schedules, classGrades])

  // Calculate day-wise schedule distribution
  const dayWiseData = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dayCounts = new Map<string, number>()

    days.forEach((day) => dayCounts.set(day, 0))

    schedules.forEach((schedule) => {
      dayCounts.set(schedule.day, (dayCounts.get(schedule.day) || 0) + 1)
    })

    return days.map((day) => ({
      name: day,
      count: dayCounts.get(day) || 0,
    }))
  }, [schedules])

  // Calculate period-wise distribution
  const periodWiseData = useMemo(() => {
    const periodCounts = new Map<string, number>()

    schedules.forEach((schedule) => {
      const periodId = schedule.periodId
      periodCounts.set(periodId, (periodCounts.get(periodId) || 0) + 1)
    })

    return periods
      .filter((p) => !p.isInterval) // Only include teaching periods
      .map((period) => ({
        name: period.name,
        count: periodCounts.get(period.id) || 0,
        time: `${period.startTime}-${period.endTime}`,
      }))
      .sort((a, b) => b.count - a.count)
  }, [schedules, periods])

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ]

  // Summary statistics
  const totalClasses = classGrades.length
  const totalTeachers = teachers.length
  const totalSubjects = subjects.length
  const totalPeriods = periods.filter((p) => !p.isInterval).length
  const totalSchedules = schedules.length
  const averageWorkload = totalTeachers > 0 ? (totalSchedules / totalTeachers).toFixed(1) : "0"
  const scheduledPercentage =
    totalPeriods > 0 && totalClasses > 0 ? Math.round((totalSchedules / (totalPeriods * totalClasses * 5)) * 100) : 0

  // Get chart component based on type
  const getTeacherWorkloadChart = () => {
    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={teacherWorkloadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="workload"
              >
                {teacherWorkloadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={teacherWorkloadData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="workload" stroke="#8884d8" name="Periods" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={teacherWorkloadData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="workload" fill="#8884d8" stroke="#8884d8" name="Periods" />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teacherWorkloadData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="workload" fill="#8884d8" name="Periods" />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-sky-100 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <School className="h-4 w-4 text-sky-500" />
                <span>Total Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sky-700">{totalClasses}</div>
              <p className="text-xs text-muted-foreground">Across all grades</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-sky-100 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>Total Teachers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Average workload: {averageWorkload} periods</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-sky-100 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <span>Total Subjects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{totalSubjects}</div>
              <p className="text-xs text-muted-foreground">Across curriculum</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="border-sky-100 hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Schedule Completion</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{scheduledPercentage}%</div>
              <p className="text-xs text-muted-foreground">{totalSchedules} scheduled periods</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="teacher-workload" className="w-full">
        <TabsList className="mb-4 grid grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="teacher-workload" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teacher Workload</span>
            <span className="sm:hidden">Teachers</span>
          </TabsTrigger>
          <TabsTrigger value="subject-distribution" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Subject Distribution</span>
            <span className="sm:hidden">Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="class-schedule" className="flex items-center gap-1">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Class Schedule</span>
            <span className="sm:hidden">Classes</span>
          </TabsTrigger>
          <TabsTrigger value="day-distribution" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Day Distribution</span>
            <span className="sm:hidden">Days</span>
          </TabsTrigger>
        </TabsList>

        <div className="mb-4 flex justify-end">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setChartType("bar")}
              className={`p-1 rounded ${chartType === "bar" ? "bg-white shadow" : "hover:bg-gray-200"}`}
              title="Bar Chart"
            >
              <BarChartIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`p-1 rounded ${chartType === "pie" ? "bg-white shadow" : "hover:bg-gray-200"}`}
              title="Pie Chart"
            >
              <PieChartIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`p-1 rounded ${chartType === "line" ? "bg-white shadow" : "hover:bg-gray-200"}`}
              title="Line Chart"
            >
              <TrendingUp className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`p-1 rounded ${chartType === "area" ? "bg-white shadow" : "hover:bg-gray-200"}`}
              title="Area Chart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <path d="M3 3v18h18" />
                <path d="M3 15h4l3-3 5 5 4-4" />
                <path d="M3 11l5-5 9 9" />
                <path d="M15 6h5v5" />
              </svg>
            </button>
          </div>
        </div>

        <TabsContent value="teacher-workload">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Teacher Workload</CardTitle>
                <CardDescription>Top 10 teachers by number of assigned periods</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">{getTeacherWorkloadChart()}</CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="subject-distribution">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Distribution of subjects across the schedule</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subjectDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="class-schedule">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Class Schedule Density</CardTitle>
                <CardDescription>Number of scheduled periods per class</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classScheduleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Scheduled Periods" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="day-distribution">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardHeader>
                <CardTitle>Day-wise Distribution</CardTitle>
                <CardDescription>Number of classes scheduled per day</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayWiseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ffc658" name="Classes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
