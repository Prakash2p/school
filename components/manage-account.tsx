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
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { User, Mail, Lock, Shield, Clock } from "lucide-react"
import type { AdminUser } from "@/lib/types"

interface ManageAccountProps {
  currentUser: AdminUser
  onUpdateUser: (user: AdminUser) => Promise<void>
}

export function ManageAccount({ currentUser, onUpdateUser }: ManageAccountProps) {
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    const updatedUser: AdminUser = {
      ...currentUser,
      name: formData.name,
      email: formData.email,
    }

    try {
      await onUpdateUser(updatedUser)
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePassword = async () => {
    // In a real app, we would verify the current password
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    // For demo purposes, we'll just check if current password matches the stored one
    if (passwordData.currentPassword !== currentUser.passwordHash) {
      toast({
        title: "Incorrect Password",
        description: "Your current password is incorrect",
        variant: "destructive",
      })
      return
    }

    const updatedUser: AdminUser = {
      ...currentUser,
      passwordHash: passwordData.newPassword,
    }

    try {
      await onUpdateUser(updatedUser)
      setIsPasswordDialogOpen(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your password",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"

    // Create a date object in Nepal time (UTC+5:45)
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kathmandu",
    }

    return new Intl.DateTimeFormat("en-US", options).format(date) + " (Nepal Time)"
  }

  return (
    <Card className="border-sky-100">
      <CardHeader className="bg-sky-50 rounded-t-lg">
        <CardTitle className="text-sky-700 flex items-center gap-2">
          <User className="h-5 w-5" />
          My Account
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium text-blue-700 mb-2">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Full Name</div>
                  <div className="font-medium">{currentUser.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Email Address</div>
                  <div className="font-medium">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-medium">{currentUser.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Account Created</div>
                  <div className="font-medium">{formatDate(currentUser.createdAt)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Last Login</div>
                  <div className="font-medium">{formatDate(currentUser.lastLogin)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setIsEditDialogOpen(true)} className="bg-sky-500 hover:bg-sky-600">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>

            <Button
              onClick={() => setIsPasswordDialogOpen(true)}
              variant="outline"
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
