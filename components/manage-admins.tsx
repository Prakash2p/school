"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Edit2, Trash2, Shield, ShieldAlert, Clock } from "lucide-react"
import type { AdminUser, AdminRole } from "@/lib/types"
import { generateUniqueId } from "@/lib/data"

interface ManageAdminsProps {
  currentUser?: AdminUser // Make currentUser optional
  admins: AdminUser[]
  onAddAdmin: (admin: AdminUser) => Promise<void>
  onUpdateAdmin: (admin: AdminUser) => Promise<void>
  onDeleteAdmin: (adminId: string) => Promise<void>
}

export function ManageAdmins({ currentUser, admins, onAddAdmin, onUpdateAdmin, onDeleteAdmin }: ManageAdminsProps) {
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "Admin" as AdminRole,
  })

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "Admin",
    })
    setSelectedAdmin(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as AdminRole,
    }))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const { username, password, name, email } = formData

    if (!username || !password || !name || !email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return false
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleAddAdmin = async () => {
    if (!validateForm()) {
      return
    }

    // Check if username already exists
    if (admins.some((admin) => admin.username === formData.username)) {
      toast({
        title: "Username Taken",
        description: "This username is already in use",
        variant: "destructive",
      })
      return
    }

    const newAdmin: AdminUser = {
      id: generateUniqueId(),
      username: formData.username,
      passwordHash: formData.password, // Will be hashed by the auth service
      role: formData.role,
      name: formData.name,
      email: formData.email,
      createdAt: new Date().toISOString(),
    }

    try {
      await onAddAdmin(newAdmin)
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Administrator added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add administrator",
        variant: "destructive",
      })
    }
  }

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return

    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const updatedAdmin: AdminUser = {
      ...selectedAdmin,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      ...(formData.password ? { passwordHash: formData.password } : {}),
    }

    try {
      await onUpdateAdmin(updatedAdmin)
      setIsEditDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Administrator updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update administrator",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return

    // Prevent deleting yourself
    if (selectedAdmin.id === currentUser?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      })
      return
    }

    // Prevent deleting the last super admin
    if (selectedAdmin.role === "SuperAdmin") {
      const superAdmins = admins.filter((admin) => admin.role === "SuperAdmin")
      if (superAdmins.length <= 1) {
        toast({
          title: "Error",
          description: "Cannot delete the last super administrator",
          variant: "destructive",
        })
        return
      }
    }

    try {
      await onDeleteAdmin(selectedAdmin.id)
      setIsDeleteDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Administrator deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete administrator",
        variant: "destructive",
      })
    }
  }

  if (!currentUser) {
    return (
      <Card className="border-sky-100">
        <CardHeader className="bg-sky-50 rounded-t-lg">
          <CardTitle className="text-sky-700 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Administrators
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Please log in as an administrator to manage admin accounts.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Manage Administrators
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">Current Administrators</h3>
            {currentUser?.role === "SuperAdmin" && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-sky-500 hover:bg-sky-600">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Administrator
              </Button>
            )}
          </div>

          <div className="border rounded-md divide-y">
            {admins.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{admin.name}</span>
                    {admin.role === "SuperAdmin" ? (
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                    ) : (
                      <Shield className="h-4 w-4 text-sky-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{admin.email}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}
                  </div>
                </div>

                {(currentUser?.role === "SuperAdmin" || currentUser.id === admin.id) && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAdmin(admin)
                        setFormData({
                          ...formData,
                          name: admin.name,
                          email: admin.email,
                          role: admin.role,
                        })
                        setIsEditDialogOpen(true)
                      }}
                      className="text-gray-500 hover:text-sky-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {currentUser?.role === "SuperAdmin" && currentUser.id !== admin.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdmin(admin)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
            <DialogDescription>
              Create a new administrator account. They will be able to manage the schedule system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Administrator</SelectItem>
                  <SelectItem value="SuperAdmin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin}>Add Administrator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
            <DialogDescription>
              Update administrator information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>
            {currentUser?.role === "SuperAdmin" && selectedAdmin?.id !== currentUser.id && (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Administrator</SelectItem>
                    <SelectItem value="SuperAdmin">Super Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin}>Update Administrator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Administrator</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete administrator "{selectedAdmin?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
