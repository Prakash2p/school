"use client"

import { useState } from "react"
import type { ClassGrade } from "@/lib/types"
import { generateUniqueId } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Edit2, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface ManageClassesProps {
  classGrades: ClassGrade[]
  onAddClassGrade: (classGrade: ClassGrade) => void
  onUpdateClassGrade: (classGrade: ClassGrade) => void
  onDeleteClassGrade: (classGradeId: string) => void
}

export function ManageClasses({
  classGrades,
  onAddClassGrade,
  onUpdateClassGrade,
  onDeleteClassGrade,
}: ManageClassesProps) {
  const { toast } = useToast()
  const [newClassName, setNewClassName] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassGrade | null>(null)
  const [editClassName, setEditClassName] = useState("")

  const handleAddClass = () => {
    if (!newClassName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a class name",
        variant: "destructive",
      })
      return
    }

    const newClass: ClassGrade = {
      id: generateUniqueId(),
      name: newClassName.trim(),
    }

    onAddClassGrade(newClass)
    setNewClassName("")

    toast({
      title: "Success",
      description: "Class added successfully",
    })
  }

  const openEditDialog = (classGrade: ClassGrade) => {
    setSelectedClass(classGrade)
    setEditClassName(classGrade.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (classGrade: ClassGrade) => {
    setSelectedClass(classGrade)
    setIsDeleteDialogOpen(true)
  }

  const handleUpdateClass = () => {
    if (!selectedClass) return

    if (!editClassName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a class name",
        variant: "destructive",
      })
      return
    }

    const updatedClass: ClassGrade = {
      ...selectedClass,
      name: editClassName.trim(),
    }

    onUpdateClassGrade(updatedClass)
    setIsEditDialogOpen(false)

    toast({
      title: "Success",
      description: "Class updated successfully",
    })
  }

  const handleDeleteClass = () => {
    if (!selectedClass) return

    onDeleteClassGrade(selectedClass.id)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Success",
      description: "Class deleted successfully",
    })
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700">Manage Classes</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">Add New Class</label>
              <Input
                type="text"
                placeholder="e.g., Class 1"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddClass()
                }}
              />
            </div>
            <Button onClick={handleAddClass} className="bg-sky-500 hover:bg-sky-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Classes</h3>
            <div className="border rounded-md divide-y">
              {classGrades.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No classes added yet</div>
              ) : (
                classGrades.map((classGrade) => (
                  <div key={classGrade.id} className="p-3 text-sm flex justify-between items-center">
                    <span>{classGrade.name}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(classGrade)}
                        className="text-gray-500 hover:text-sky-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(classGrade)}
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

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">Class Name</Label>
              <Input id="edit-class-name" value={editClassName} onChange={(e) => setEditClassName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClass}>Update Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{selectedClass?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. Any schedules associated with this class will also be deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
