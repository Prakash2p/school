"use client"

import { useState } from "react"
import type { Teacher } from "@/lib/types"
import { generateUniqueId } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ManageTeachersProps {
  teachers: Teacher[]
  onAddTeacher: (teacher: Teacher) => void
  onUpdateTeacher: (teacher: Teacher) => void
  onDeleteTeacher: (teacherId: string) => void
}

export function ManageTeachers({ teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher }: ManageTeachersProps) {
  const { toast } = useToast()
  const [newTeacherName, setNewTeacherName] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [editTeacherName, setEditTeacherName] = useState("")

  const handleAddTeacher = () => {
    if (!newTeacherName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a teacher name",
        variant: "destructive",
      })
      return
    }

    const newTeacher: Teacher = {
      id: generateUniqueId(),
      name: newTeacherName.trim(),
    }

    onAddTeacher(newTeacher)
    setNewTeacherName("")

    toast({
      title: "Success",
      description: "Teacher added successfully",
    })
  }

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setEditTeacherName(teacher.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateTeacher = () => {
    if (!selectedTeacher) return

    if (!editTeacherName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a teacher name",
        variant: "destructive",
      })
      return
    }

    const updatedTeacher: Teacher = {
      ...selectedTeacher,
      name: editTeacherName.trim(),
    }

    onUpdateTeacher(updatedTeacher)
    setIsEditDialogOpen(false)

    toast({
      title: "Success",
      description: "Teacher updated successfully",
    })
  }

  const handleDeleteTeacher = () => {
    if (!selectedTeacher) return

    onDeleteTeacher(selectedTeacher.id)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Success",
      description: "Teacher deleted successfully",
    })
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700">Manage Teachers</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Add New Teacher</label>
              <Input
                type="text"
                placeholder="Teacher name"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTeacher()
                }}
              />
            </div>
            <Button onClick={handleAddTeacher} className="bg-sky-500 hover:bg-sky-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Teachers</h3>
            <div className="border rounded-md divide-y">
              {teachers.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No teachers added yet</div>
              ) : (
                teachers.map((teacher) => (
                  <div key={teacher.id} className="p-3 text-sm flex justify-between items-center">
                    <span>{teacher.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(teacher)}
                        className="text-gray-500 hover:text-sky-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(teacher)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-teacher-name">Teacher Name</Label>
              <Input
                id="edit-teacher-name"
                value={editTeacherName}
                onChange={(e) => setEditTeacherName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeacher}>Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{selectedTeacher?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. Any schedules associated with this teacher will also be deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeacher}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
