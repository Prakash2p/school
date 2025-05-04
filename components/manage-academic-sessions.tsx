"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus, Check } from "lucide-react"
import { generateUniqueId } from "@/lib/data"
import type { AcademicSession } from "@/lib/types"

interface ManageAcademicSessionsProps {
  academicSessions: AcademicSession[]
  onAddAcademicSession: (session: AcademicSession) => Promise<void>
  onUpdateAcademicSession: (session: AcademicSession) => Promise<void>
  onDeleteAcademicSession: (id: string) => Promise<void>
  onSetActiveSession: (id: string) => Promise<void>
}

export function ManageAcademicSessions({
  academicSessions,
  onAddAcademicSession,
  onUpdateAcademicSession,
  onDeleteAcademicSession,
  onSetActiveSession,
}: ManageAcademicSessionsProps) {
  const [newSession, setNewSession] = useState<Partial<AcademicSession>>({
    name: "",
    startDate: "",
    endDate: "",
  })
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddSession = async () => {
    if (!newSession.name || !newSession.startDate || !newSession.endDate) {
      alert("Please fill in all fields")
      return
    }

    const session: AcademicSession = {
      id: generateUniqueId(),
      name: newSession.name || "",
      startDate: newSession.startDate || "",
      endDate: newSession.endDate || "",
      isActive: academicSessions.length === 0, // Make active if it's the first session
    }

    await onAddAcademicSession(session)
    setNewSession({ name: "", startDate: "", endDate: "" })
    setIsAdding(false)
  }

  const handleUpdateSession = async () => {
    if (!editingSession) return
    await onUpdateAcademicSession(editingSession)
    setEditingSession(null)
  }

  const handleDeleteSession = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this academic session? This will also delete all schedules associated with this session.",
      )
    ) {
      await onDeleteAcademicSession(id)
    }
  }

  const handleSetActive = async (id: string) => {
    await onSetActiveSession(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-sky-700">Academic Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Current Sessions</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
          </div>

          {isAdding && (
            <div className="bg-gray-50 p-4 rounded-md space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="session-name" className="text-sm font-medium block mb-1">
                    Session Name
                  </label>
                  <Input
                    id="session-name"
                    value={newSession.name || ""}
                    onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    placeholder="e.g. 2082"
                  />
                </div>
                <div>
                  <label htmlFor="start-date" className="text-sm font-medium block mb-1">
                    Start Date
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newSession.startDate || ""}
                    onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="text-sm font-medium block mb-1">
                    End Date
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newSession.endDate || ""}
                    onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSession}>
                  Add Session
                </Button>
              </div>
            </div>
          )}

          {academicSessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {editingSession?.id === session.id ? (
                        <Input
                          value={editingSession.name}
                          onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                        />
                      ) : (
                        session.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === session.id ? (
                        <Input
                          type="date"
                          value={editingSession.startDate}
                          onChange={(e) => setEditingSession({ ...editingSession, startDate: e.target.value })}
                        />
                      ) : (
                        new Date(session.startDate).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell>
                      {editingSession?.id === session.id ? (
                        <Input
                          type="date"
                          value={editingSession.endDate}
                          onChange={(e) => setEditingSession({ ...editingSession, endDate: e.target.value })}
                        />
                      ) : (
                        new Date(session.endDate).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell>
                      {session.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetActive(session.id)}
                          className="text-xs text-gray-500"
                        >
                          Set Active
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingSession?.id === session.id ? (
                        <Button variant="ghost" size="sm" onClick={handleUpdateSession} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSession(session)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            disabled={session.isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">No academic sessions found. Add one to get started.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
