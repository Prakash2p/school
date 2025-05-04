"use client"

import { useState } from "react"
import type { Subject } from "@/lib/types"
import { generateUniqueId } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ManageSubjectsProps {
  subjects: Subject[]
  onAddSubject: (subject: Subject) => void
  onUpdateSubject: (subject: Subject) => void
  onDeleteSubject: (subjectId: string) => void
}

export function ManageSubjects({ subjects, onAddSubject, onUpdateSubject, onDeleteSubject }: ManageSubjectsProps) {
  const { toast } = useToast()
  const [newSubjectName, setNewSubjectName] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [editSubjectName, setEditSubjectName] = useState("")

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a subject name",
        variant: "destructive",
      })
      return
    }

    const newSubject: Subject = {
      id: generateUniqueId(),
      name: newSubjectName.trim(),
    }

    onAddSubject(newSubject)
    setNewSubjectName("")

    toast({
      title: "Success",
      description: "Subject added successfully",
    })
  }

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setEditSubjectName(subject.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateSubject = () => {
    if (!selectedSubject) return

    if (!editSubjectName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a subject name",
        variant: "destructive",
      })
      return
    }

    const updatedSubject: Subject = {
      ...selectedSubject,
      name: editSubjectName.trim(),
    }

    onUpdateSubject(updatedSubject)
    setIsEditDialogOpen(false)

    toast({
      title: "Success",
      description: "Subject updated successfully",
    })
  }

  const handleDeleteSubject = () => {
    if (!selectedSubject) return

    onDeleteSubject(selectedSubject.id)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Success",
      description: "Subject deleted successfully",
    })
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700">Manage Subjects</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Add New Subject</label>
              <Input
                type="text"
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubject()
                }}
              />
            </div>
            <Button onClick={handleAddSubject} className="bg-sky-500 hover:bg-sky-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Subjects</h3>
            <div className="border rounded-md divide-y">
              {subjects.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No subjects added yet</div>
              ) : (
                subjects.map((subject) => (
                  <div key={subject.id} className="p-3 text-sm flex justify-between items-center">
                    <span>{subject.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(subject)}
                        className="text-gray-500 hover:text-sky-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(subject)}
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

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject-name">Subject Name</Label>
              <Input
                id="edit-subject-name"
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSubject}>Update Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{selectedSubject?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. Any schedules associated with this subject will also be deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
