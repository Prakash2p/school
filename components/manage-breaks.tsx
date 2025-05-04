"use client"

import { useState } from "react"
import type { Period } from "@/lib/types"
import { generateUniqueId } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Coffee, Clock, Trash2, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

interface ManageBreaksProps {
  periods: Period[]
  onAddPeriod: (period: Period) => void
  onUpdatePeriod: (period: Period) => void
  onDeletePeriod: (periodId: string) => void
}

export function ManageBreaks({ periods, onAddPeriod, onUpdatePeriod, onDeletePeriod }: ManageBreaksProps) {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isInterval, setIsInterval] = useState(true)

  // Filter to show only breaks/intervals
  const breaks = periods.filter((period) => period.isInterval)
  const regularPeriods = periods.filter((period) => !period.isInterval)

  const resetForm = () => {
    setName("")
    setStartTime("")
    setEndTime("")
    setIsInterval(true)
    setSelectedPeriod(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (period: Period) => {
    setSelectedPeriod(period)
    setName(period.name)
    setStartTime(period.startTime)
    setEndTime(period.endTime)
    setIsInterval(period.isInterval)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (period: Period) => {
    setSelectedPeriod(period)
    setIsDeleteDialogOpen(true)
  }

  const handleAddPeriod = () => {
    if (!name || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Check for time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      toast({
        title: "Invalid Time Format",
        description: "Please use HH:MM format (e.g., 09:30)",
        variant: "destructive",
      })
      return
    }

    // Check if start time is before end time
    if (startTime >= endTime) {
      toast({
        title: "Invalid Time Range",
        description: "Start time must be before end time",
        variant: "destructive",
      })
      return
    }

    // Check for overlapping periods
    const hasOverlap = periods.some((period) => {
      // Skip comparing with the period being edited
      if (selectedPeriod && period.id === selectedPeriod.id) return false

      // Check if the new period overlaps with an existing one
      return (
        (startTime >= period.startTime && startTime < period.endTime) ||
        (endTime > period.startTime && endTime <= period.endTime) ||
        (startTime <= period.startTime && endTime >= period.endTime)
      )
    })

    if (hasOverlap) {
      toast({
        title: "Time Overlap",
        description: "This period overlaps with an existing period",
        variant: "destructive",
      })
      return
    }

    const newPeriod: Period = {
      id: generateUniqueId(),
      name,
      startTime,
      endTime,
      isInterval,
    }

    onAddPeriod(newPeriod)
    setIsAddDialogOpen(false)
    resetForm()

    toast({
      title: "Success",
      description: `${isInterval ? "Break" : "Period"} added successfully`,
    })
  }

  const handleUpdatePeriod = () => {
    if (!selectedPeriod) return

    if (!name || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Check for time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      toast({
        title: "Invalid Time Format",
        description: "Please use HH:MM format (e.g., 09:30)",
        variant: "destructive",
      })
      return
    }

    // Check if start time is before end time
    if (startTime >= endTime) {
      toast({
        title: "Invalid Time Range",
        description: "Start time must be before end time",
        variant: "destructive",
      })
      return
    }

    // Check for overlapping periods (excluding the current period)
    const hasOverlap = periods.some((period) => {
      // Skip comparing with the period being edited
      if (period.id === selectedPeriod.id) return false

      // Check if the updated period overlaps with an existing one
      return (
        (startTime >= period.startTime && startTime < period.endTime) ||
        (endTime > period.startTime && endTime <= period.endTime) ||
        (startTime <= period.startTime && endTime >= period.endTime)
      )
    })

    if (hasOverlap) {
      toast({
        title: "Time Overlap",
        description: "This period overlaps with an existing period",
        variant: "destructive",
      })
      return
    }

    const updatedPeriod: Period = {
      ...selectedPeriod,
      name,
      startTime,
      endTime,
      isInterval,
    }

    onUpdatePeriod(updatedPeriod)
    setIsEditDialogOpen(false)
    resetForm()

    toast({
      title: "Success",
      description: `${isInterval ? "Break" : "Period"} updated successfully`,
    })
  }

  const handleDeletePeriod = () => {
    if (!selectedPeriod) return

    onDeletePeriod(selectedPeriod.id)
    setIsDeleteDialogOpen(false)
    resetForm()

    toast({
      title: "Success",
      description: `${selectedPeriod.isInterval ? "Break" : "Period"} deleted successfully`,
    })
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700 flex items-center">
          <Coffee className="mr-2 h-5 w-5" />
          Manage Breaks & Periods
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">Breaks & Intervals</h3>
            <Button onClick={openAddDialog} className="bg-sky-500 hover:bg-sky-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Break/Period
            </Button>
          </div>

          {/* Breaks List */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-600 flex items-center">
              <Coffee className="mr-2 h-4 w-4 text-amber-500" />
              Breaks & Intervals
            </h4>
            <div className="border rounded-md divide-y">
              {breaks.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No breaks added yet</div>
              ) : (
                breaks.map((period) => (
                  <div key={period.id} className="p-3 flex justify-between items-center bg-amber-50/50">
                    <div>
                      <div className="font-medium text-amber-800">{period.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {period.startTime} - {period.endTime}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(period)}
                        className="text-gray-500 hover:text-sky-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(period)}
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

          {/* Regular Periods List */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-600 flex items-center">
              <Clock className="mr-2 h-4 w-4 text-sky-500" />
              Regular Periods
            </h4>
            <div className="border rounded-md divide-y">
              {regularPeriods.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No regular periods added yet</div>
              ) : (
                regularPeriods.map((period) => (
                  <div key={period.id} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{period.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {period.startTime} - {period.endTime}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(period)}
                        className="text-gray-500 hover:text-sky-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(period)}
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

      {/* Add Period/Break Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Period/Break</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lunch Break, 1st Period"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time (HH:MM)</Label>
                <Input
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="e.g., 09:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (HH:MM)</Label>
                <Input
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="e.g., 09:45"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isInterval" checked={isInterval} onCheckedChange={setIsInterval} />
              <Label htmlFor="isInterval">This is a break/interval (not a teaching period)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPeriod}>Add {isInterval ? "Break" : "Period"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Period/Break Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedPeriod?.isInterval ? "Break" : "Period"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time (HH:MM)</Label>
                <Input id="edit-startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">End Time (HH:MM)</Label>
                <Input id="edit-endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-isInterval" checked={isInterval} onCheckedChange={setIsInterval} />
              <Label htmlFor="edit-isInterval">This is a break/interval (not a teaching period)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePeriod}>Update {isInterval ? "Break" : "Period"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedPeriod?.isInterval ? "Break" : "Period"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{selectedPeriod?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. Any schedules associated with this{" "}
              {selectedPeriod?.isInterval ? "break" : "period"} will also be deleted.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePeriod}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
