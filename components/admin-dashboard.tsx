"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleGrid } from "@/components/schedule-grid"
import { AddScheduleForm } from "@/components/add-schedule-form"
import { ManageTeachers } from "@/components/manage-teachers"
import { ManageSubjects } from "@/components/manage-subjects"
import { ManageClasses } from "@/components/manage-classes"
import { ManageSchoolDays } from "@/components/manage-school-days"
import { ManageBreaks } from "@/components/manage-breaks"
import { ManageAcademicSessions } from "@/components/manage-academic-sessions"
import { AdminAnalytics } from "@/components/admin-analytics"
import { ExportTools } from "@/components/export-tools"
import { PrintExportButtons } from "@/components/print-export-buttons"
import { FilterControls } from "@/components/filter-controls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Teacher, Subject, Period, Schedule, ClassGrade, SchoolDay, AcademicSession } from "@/lib/types"
import type { AdminUser } from "@/lib/types"

interface AdminDashboardProps {
  teachers: Teacher[]
  subjects: Subject[]
  periods: Period[]
  schedules: Schedule[]
  classGrades: ClassGrade[]
  schoolDays: SchoolDay[]
  academicSessions: AcademicSession[]
  selectedDay: string
  onAddSchedule: (schedule: Schedule) => void
  onUpdateSchedule: (schedule: Schedule) => void
  onDeleteSchedule: (scheduleId: string) => void
  onAddTeacher: (teacher: Teacher) => void
  onUpdateTeacher: (teacher: Teacher) => void
  onDeleteTeacher: (teacherId: string) => void
  onAddSubject: (subject: Subject) => void
  onUpdateSubject: (subject: Subject) => void
  onDeleteSubject: (subjectId: string) => void
  onAddClassGrade: (classGrade: ClassGrade) => void
  onUpdateClassGrade: (classGrade: ClassGrade) => void
  onDeleteClassGrade: (classGradeId: string) => void
  onAddPeriod: (period: Period) => void
  onUpdatePeriod: (period: Period) => void
  onDeletePeriod: (periodId: string) => void
  onUpdateSchoolDays: (schoolDays: SchoolDay[]) => void
  onAddAcademicSession: (session: AcademicSession) => void
  onUpdateAcademicSession: (session: AcademicSession) => void
  onDeleteAcademicSession: (sessionId: string) => void
  onSetActiveSession: (sessionId: string) => void
  currentUser: AdminUser
  admins: AdminUser[]
  onAddAdmin: (admin: AdminUser) => Promise<void>
  onUpdateAdmin: (admin: AdminUser) => Promise<void>
  onDeleteAdmin: (adminId: string) => Promise<void>
}

export function AdminDashboard({
  teachers,
  subjects,
  periods,
  schedules,
  classGrades,
  schoolDays,
  academicSessions,
  selectedDay,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onAddClassGrade,
  onUpdateClassGrade,
  onDeleteClassGrade,
  onAddPeriod,
  onUpdatePeriod,
  onDeletePeriod,
  onUpdateSchoolDays,
  onAddAcademicSession,
  onUpdateAcademicSession,
  onDeleteAcademicSession,
  onSetActiveSession,
  currentUser,
  admins,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: AdminDashboardProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all")
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    academicSessions.find((s) => s.isActive)?.id || academicSessions[0]?.id || "",
  )

  // Filter schedules for the selected day using useMemo for performance
  const daySchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          schedule.day === selectedDay &&
          (selectedSessionId === "all" || schedule.academicSessionId === selectedSessionId),
      ),
    [schedules, selectedDay, selectedSessionId],
  )

  // Find selected teacher and class names using useMemo
  const selectedTeacherName = useMemo(
    () => (selectedTeacherId !== "all" ? teachers.find((t) => t.id === selectedTeacherId)?.name : undefined),
    [selectedTeacherId, teachers],
  )

  const selectedClassName = useMemo(
    () => (selectedClassId !== "all" ? classGrades.find((c) => c.id === selectedClassId)?.name : undefined),
    [selectedClassId, classGrades],
  )

  // Get active academic session
  const activeSession = useMemo(
    () => academicSessions.find((session) => session.isActive) || academicSessions[0],
    [academicSessions],
  )

  return (
    <div className="space-y-6">
      {/* Academic Session Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Academic Session:</span>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {academicSessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name} {session.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-500">
          {activeSession && (
            <span>
              Current active session: <span className="font-medium text-sky-600">{activeSession.name}</span>
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-sky-50/70">
          <TabsTrigger
            value="view"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            View Schedule
          </TabsTrigger>
          <TabsTrigger
            value="add"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Add Schedule
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Manage Data
          </TabsTrigger>
          <TabsTrigger
            value="breaks"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Manage Period/Breaks
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Academic Sessions
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="data-[state=active]:bg-sky-500 data-[state=active]:text-white transition-colors duration-200"
          >
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-sky-700">Schedule View</h2>

            <PrintExportButtons
              teachers={teachers}
              subjects={subjects}
              periods={periods}
              schedules={schedules}
              classGrades={classGrades}
              selectedDay={selectedDay}
              selectedTeacherId={selectedTeacherId}
              selectedClassId={selectedClassId}
              elementId="admin-schedule-grid"
              fileName={`admin_${selectedDay}_schedule`}
              academicSession={
                selectedSessionId !== "all" ? academicSessions.find((s) => s.id === selectedSessionId) : undefined
              }
            />
          </div>

          <FilterControls
            teachers={teachers}
            classGrades={classGrades}
            selectedTeacherId={selectedTeacherId}
            selectedClassId={selectedClassId}
            onSelectTeacher={setSelectedTeacherId}
            onSelectClass={setSelectedClassId}
          />

          <Card className="border-sky-100 mt-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-sky-50 rounded-t-lg border-b border-sky-100">
              <CardTitle className="text-sky-700 flex flex-wrap items-center gap-1">
                {selectedDay} Schedule
                {selectedTeacherName && <span className="font-medium"> - {selectedTeacherName}</span>}
                {selectedClassName && <span className="font-medium"> - {selectedClassName}</span>}
                {selectedSessionId !== "all" && activeSession && (
                  <span className="font-medium text-sky-600"> - {activeSession.name}</span>
                )}
                <span className="text-sm font-normal ml-2 text-sky-600 opacity-80 hover:opacity-100 transition-opacity">
                  (Click on any cell to assign or edit a class)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div id="admin-schedule-grid">
                <ScheduleGrid
                  schedules={daySchedules}
                  teachers={teachers}
                  subjects={subjects}
                  periods={periods}
                  classGrades={classGrades}
                  selectedTeacherId={selectedTeacherId !== "all" ? selectedTeacherId : undefined}
                  selectedClassId={selectedClassId !== "all" ? selectedClassId : undefined}
                  isAdmin={true}
                  selectedDay={selectedDay}
                  onAddSchedule={onAddSchedule}
                  onUpdateSchedule={onUpdateSchedule}
                  onDeleteSchedule={onDeleteSchedule}
                  academicSessionId={selectedSessionId !== "all" ? selectedSessionId : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <AddScheduleForm
            teachers={teachers}
            subjects={subjects}
            periods={periods}
            classGrades={classGrades}
            schedules={schedules}
            selectedDay={selectedDay}
            onAddSchedule={onAddSchedule}
            academicSessionId={selectedSessionId !== "all" ? selectedSessionId : undefined}
          />
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ManageTeachers
              teachers={teachers}
              onAddTeacher={onAddTeacher}
              onUpdateTeacher={onUpdateTeacher}
              onDeleteTeacher={onDeleteTeacher}
            />
            <ManageSubjects
              subjects={subjects}
              onAddSubject={onAddSubject}
              onUpdateSubject={onUpdateSubject}
              onDeleteSubject={onDeleteSubject}
            />
            <ManageClasses
              classGrades={classGrades}
              onAddClassGrade={onAddClassGrade}
              onUpdateClassGrade={onUpdateClassGrade}
              onDeleteClassGrade={onDeleteClassGrade}
            />
            <ManageSchoolDays schoolDays={schoolDays} onUpdateSchoolDays={onUpdateSchoolDays} />
          </div>
        </TabsContent>

        {/* Tab for managing breaks */}
        <TabsContent value="breaks" className="mt-6">
          <ManageBreaks
            periods={periods}
            onAddPeriod={onAddPeriod}
            onUpdatePeriod={onUpdatePeriod}
            onDeletePeriod={onDeletePeriod}
          />
        </TabsContent>

        {/* Tab for managing academic sessions */}
        <TabsContent value="sessions" className="mt-6">
          <ManageAcademicSessions
            academicSessions={academicSessions}
            onAddAcademicSession={onAddAcademicSession}
            onUpdateAcademicSession={onUpdateAcademicSession}
            onDeleteAcademicSession={onDeleteAcademicSession}
            onSetActiveSession={onSetActiveSession}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics
            teachers={teachers}
            subjects={subjects}
            periods={periods}
            schedules={schedules}
            classGrades={classGrades}
          />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportTools
            teachers={teachers}
            subjects={subjects}
            periods={periods}
            schedules={schedules}
            classGrades={classGrades}
            selectedDay={selectedDay}
            schoolDays={schoolDays}
            academicSessions={academicSessions}
            selectedSessionId={selectedSessionId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
