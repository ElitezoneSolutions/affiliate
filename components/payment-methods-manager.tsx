'use client'

import { useState, useEffect } from 'react'
import { supabase, PaymentMethod } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PaymentMethodsManagerProps {
  userId: string
  onUpdate?: () => void
}

export function PaymentMethodsManager({ userId, onUpdate }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    type: '' as 'paypal' | 'wise' | 'bank_transfer',
    name: '',
    is_default: false,
    paypal_email: '',
    wise_name: '',
    wise_email: '',
    wise_account_id: '',
    bank_name: '',
    bank_iban: '',
    bank_swift: '',
    bank_account_name: ''
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [userId])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('payout_methods')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      const methods = user.payout_methods || []
      setPaymentMethods(methods)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: '' as 'paypal' | 'wise' | 'bank_transfer',
      name: '',
      is_default: false,
      paypal_email: '',
      wise_name: '',
      wise_email: '',
      wise_account_id: '',
      bank_name: '',
      bank_iban: '',
      bank_swift: '',
      bank_account_name: ''
    })
    setShowAddForm(false)
    setEditingMethod(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validate form data
      if (!formData.type || !formData.name) {
        throw new Error('Please fill in all required fields')
      }

      // Validate payment method specific fields
      if (formData.type === 'paypal' && !formData.paypal_email) {
        throw new Error('PayPal email is required')
      }
      if (formData.type === 'wise' && (!formData.wise_name || !formData.wise_email || !formData.wise_account_id)) {
        throw new Error('All Wise fields are required')
      }
      if (formData.type === 'bank_transfer' && (!formData.bank_name || !formData.bank_iban || !formData.bank_swift || !formData.bank_account_name)) {
        throw new Error('All bank transfer fields are required')
      }

      // Create payment method object
      const newMethod: PaymentMethod = {
        id: editingMethod?.id || `pm_${Date.now()}`,
        type: formData.type,
        name: formData.name,
        is_default: formData.is_default,
        details: {
          [formData.type]: formData.type === 'paypal' ? {
            email: formData.paypal_email
          } : formData.type === 'wise' ? {
            name: formData.wise_name,
            email: formData.wise_email,
            account_id: formData.wise_account_id
          } : {
            name: formData.bank_account_name,
            iban: formData.bank_iban,
            bank_name: formData.bank_name,
            swift: formData.bank_swift
          }
        },
        created_at: editingMethod?.created_at || new Date().toISOString()
      }

      // Update payment methods array
      let updatedMethods: PaymentMethod[]
      
      if (editingMethod) {
        // Update existing method
        updatedMethods = paymentMethods.map(method => 
          method.id === editingMethod.id ? newMethod : method
        )
      } else {
        // Add new method
        updatedMethods = [...paymentMethods, newMethod]
      }

      // If this is set as default, unset others
      if (formData.is_default) {
        updatedMethods = updatedMethods.map(method => ({
          ...method,
          is_default: method.id === newMethod.id
        }))
      }

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          payout_methods: updatedMethods,
          default_payout_method: formData.is_default ? formData.type : undefined
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setPaymentMethods(updatedMethods)
      setSuccess(editingMethod ? 'Payment method updated successfully!' : 'Payment method added successfully!')
      resetForm()
      onUpdate?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      type: method.type,
      name: method.name,
      is_default: method.is_default,
      paypal_email: method.details.paypal?.email || '',
      wise_name: method.details.wise?.name || '',
      wise_email: method.details.wise?.email || '',
      wise_account_id: method.details.wise?.account_id || '',
      bank_name: method.details.bank_transfer?.bank_name || '',
      bank_iban: method.details.bank_transfer?.iban || '',
      bank_swift: method.details.bank_transfer?.swift || '',
      bank_account_name: method.details.bank_transfer?.name || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      setSaving(true)
      setError('')

      const updatedMethods = paymentMethods.filter(method => method.id !== methodId)
      
      // If we're deleting the default method, set another as default
      const deletedMethod = paymentMethods.find(m => m.id === methodId)
      let defaultMethod = deletedMethod?.is_default ? updatedMethods[0]?.type : undefined

      const { error: updateError } = await supabase
        .from('users')
        .update({
          payout_methods: updatedMethods,
          default_payout_method: defaultMethod
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setPaymentMethods(updatedMethods)
      setSuccess('Payment method deleted successfully!')
      onUpdate?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      setSaving(true)
      setError('')

      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        is_default: method.id === methodId
      }))

      const method = paymentMethods.find(m => m.id === methodId)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          payout_methods: updatedMethods,
          default_payout_method: method?.type
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setPaymentMethods(updatedMethods)
      setSuccess('Default payment method updated!')
      onUpdate?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'paypal': return '💳'
      case 'wise': return '🌍'
      case 'bank_transfer': return '🏦'
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodLabel = (type: string) => {
    switch (type) {
      case 'paypal': return 'PayPal'
      case 'wise': return 'Wise'
      case 'bank_transfer': return 'Bank Transfer'
      default: return type
    }
  }

  const renderMethodDetails = (method: PaymentMethod) => {
    switch (method.type) {
      case 'paypal':
        return <span className="text-sm text-gray-600">{method.details.paypal?.email}</span>
      case 'wise':
        return <span className="text-sm text-gray-600">{method.details.wise?.name} ({method.details.wise?.email})</span>
      case 'bank_transfer':
        return <span className="text-sm text-gray-600">{method.details.bank_transfer?.bank_name} - {method.details.bank_transfer?.iban.slice(-4)}</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-sm text-gray-600">Manage your payout methods</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No payment methods added</p>
            <p className="text-sm text-gray-500">Add a payment method to receive payouts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getMethodIcon(method.type)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{method.name}</h4>
                        {method.is_default && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{getMethodLabel(method.type)}</div>
                      {renderMethodDetails(method)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={saving}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(method)}
                      disabled={saving}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</CardTitle>
            <CardDescription>
              {editingMethod ? 'Update your payment method details' : 'Add a new payment method for payouts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Payment Method Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'paypal' | 'wise' | 'bank_transfer') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="wise">Wise</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Method Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., My PayPal, Business Account"
                  />
                </div>
              </div>

              {/* PayPal Fields */}
              {formData.type === 'paypal' && (
                <div>
                  <Label htmlFor="paypal_email">PayPal Email *</Label>
                  <Input
                    id="paypal_email"
                    type="email"
                    value={formData.paypal_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, paypal_email: e.target.value }))}
                    placeholder="your-email@example.com"
                  />
                </div>
              )}

              {/* Wise Fields */}
              {formData.type === 'wise' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wise_name">Full Name *</Label>
                    <Input
                      id="wise_name"
                      value={formData.wise_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, wise_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wise_email">Email *</Label>
                    <Input
                      id="wise_email"
                      type="email"
                      value={formData.wise_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, wise_email: e.target.value }))}
                      placeholder="your-email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wise_account_id">Account ID *</Label>
                    <Input
                      id="wise_account_id"
                      value={formData.wise_account_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, wise_account_id: e.target.value }))}
                      placeholder="123456789"
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer Fields */}
              {formData.type === 'bank_transfer' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_account_name">Account Holder Name *</Label>
                      <Input
                        id="bank_account_name"
                        value={formData.bank_account_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Bank Name *</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="Bank of America"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_iban">IBAN *</Label>
                      <Input
                        id="bank_iban"
                        value={formData.bank_iban}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_iban: e.target.value }))}
                        placeholder="GB29 NWBK 6016 1331 9268 19"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_swift">SWIFT/BIC *</Label>
                      <Input
                        id="bank_swift"
                        value={formData.bank_swift}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_swift: e.target.value }))}
                        placeholder="NWBKGB2L"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_default">Set as default payment method</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : (editingMethod ? 'Update Method' : 'Add Method')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 