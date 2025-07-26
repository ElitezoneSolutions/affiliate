'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DashboardNav } from '@/components/dashboard-nav'
import Image from 'next/image'
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Trash2, 
  LogOut, 
  AlertCircle, 
  CheckCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile_image: ''
  })

  // File upload state
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }

    if (user.is_admin) {
      router.replace('/admin/leads')
      return
    }

    // Load user data
    setProfileForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      profile_image: user.profile_image || ''
    })
  }, [user, router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' })
        return
      }

      setSelectedFile(file)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setMessage(null)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  const uploadProfileImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`
    const filePath = `${user?.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let profileImageUrl = profileForm.profile_image

      // Upload new image if selected
      if (selectedFile) {
        setUploading(true)
        profileImageUrl = await uploadProfileImage(selectedFile)
        setUploading(false)
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          profile_image: profileImageUrl
        })
        .eq('id', user?.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Clear selected file
      if (selectedFile) {
        removeSelectedFile()
      }

      // Update local state
      setProfileForm(prev => ({ ...prev, profile_image: profileImageUrl }))

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '')
      if (error) throw error

      await signOut()
      router.push('/')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            <X className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <label htmlFor="profile-upload" className="cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity">
                        {previewUrl ? (
                          <Image
                            src={previewUrl} 
                            alt="Profile Preview" 
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : profileForm.profile_image ? (
                          <Image
                            src={profileForm.profile_image} 
                            alt="Profile" 
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        <Camera className="h-3 w-3 text-gray-600" />
                      </div>
                    </label>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{profileForm.first_name} {profileForm.last_name}</h3>
                    <p className="text-sm text-gray-600">{profileForm.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {user?.is_admin ? 'Admin' : 'Affiliate'}
                    </Badge>
                  </div>
                </div>

                {selectedFile && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-700">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Selected file will be uploaded when you save changes
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
                </div>

                <Button type="submit" disabled={loading || uploading} className="w-full md:w-auto">
                  {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <X className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>• Password must be at least 6 characters long</p>
                  <p>• Use a combination of letters, numbers, and symbols for better security</p>
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account settings and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Sign Out</h3>
                  <p className="text-sm text-gray-600">Sign out of your account</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                <div>
                  <h3 className="font-medium text-red-900">Delete Account</h3>
                  <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <form onSubmit={handleAccountDeletion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password to confirm</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 