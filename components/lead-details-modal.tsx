import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lead } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Link as LinkIcon,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react'

const PROGRAMS = [
  'The Smart Acquisition Program',
  'The Acquisition Partnership',
  'The Automation Program'
]

interface LeadDetailsModalProps {
  lead: Lead
  onClose: () => void
  onUpdate?: () => void
}

export function LeadDetailsModal({ lead, onClose, onUpdate }: LeadDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone || '',
    website: lead.website || '',
    program: lead.program,
    lead_note: lead.lead_note || ''
  })

  useEffect(() => {
    // Check if lead was created within last 30 minutes
    const createdAt = new Date(lead.created_at)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    setCanEdit(createdAt > thirtyMinutesAgo && lead.status === 'pending')
  }, [lead])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      const { error } = await supabase
        .from('leads')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          website: editForm.website,
          program: editForm.program,
          lead_note: editForm.lead_note
        })
        .eq('id', lead.id)

      if (error) throw error

      setIsEditing(false)
      if (onUpdate) onUpdate()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Lead Details</h2>
            <div className="flex items-center gap-2">
              {canEdit && !isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Lead
                </Button>
              )}
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Status and Submission Time */}
            <div className="flex items-center justify-between">
              <div>
                {getStatusBadge(lead.status)}
                <p className="text-sm text-gray-600 mt-1">
                  Submitted: {formatDate(lead.created_at)}
                </p>
              </div>
              {lead.price && (
                <div className="text-right">
                  <div className="flex items-center text-green-600 font-bold">
                    <DollarSign className="w-4 h-4" />
                    {lead.price}
                  </div>
                  <p className="text-sm text-gray-600">
                    {lead.paid ? 'Paid' : 'Pending Payment'}
                  </p>
                </div>
              )}
            </div>

            {/* Lead Information */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                {isEditing ? (
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1">{lead.full_name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1">{lead.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                {isEditing ? (
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1">{lead.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Website</label>
                {isEditing ? (
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1">{lead.website || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Program</label>
                {isEditing ? (
                  <Select 
                    value={editForm.program}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, program: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAMS.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1">{lead.program}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Lead Note</label>
                {isEditing ? (
                  <Textarea
                    value={editForm.lead_note}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lead_note: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{lead.lead_note || 'No note provided'}</p>
                )}
              </div>

              {/* Admin Information */}
              {(lead.call_meeting_link || lead.admin_note) && (
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-medium mb-4">Admin Information</h3>
                  
                  {lead.call_meeting_link && (
                    <div className="mb-4">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Meeting Link
                      </label>
                      <a 
                        href={lead.call_meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 block"
                      >
                        {lead.call_meeting_link}
                      </a>
                    </div>
                  )}

                  {lead.admin_note && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Admin Note
                      </label>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                        {lead.admin_note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      full_name: lead.full_name,
                      email: lead.email,
                      phone: lead.phone || '',
                      website: lead.website || '',
                      program: lead.program,
                      lead_note: lead.lead_note || ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 