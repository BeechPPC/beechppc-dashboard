'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Globe, DollarSign, Users, Mail, MapPin, Clock, Briefcase, Loader2, Edit } from 'lucide-react'
import { ClientDetailsDialog } from '@/components/clients/client-details-dialog'
import { formatCurrency } from '@/lib/utils'

interface ClientDetails {
  businessName: string
  url: string
  monthlyBudget: string
  accountType: 'ecommerce' | 'lead-gen' | ''
  country: string
  contactName: string
  contactEmail: string
  notes: string
  industry: string
  timezone: string
}

interface ClientDetailsSectionProps {
  accountId: string
  accountName: string
  currency: string
}

export function ClientDetailsSection({ accountId, accountName, currency }: ClientDetailsSectionProps) {
  const [details, setDetails] = useState<ClientDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${accountId}/details`)
      if (response.ok) {
        const data = await response.json()
        if (data.details) {
          setDetails(data.details)
        }
      }
    } catch (error) {
      console.error('Error loading client details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  const handleDetailsSaved = () => {
    setDialogOpen(false)
    loadDetails()
  }

  const formatAccountType = (type: string) => {
    if (type === 'ecommerce') return 'E-commerce'
    if (type === 'lead-gen') return 'Lead Generation'
    return 'Not specified'
  }

  const formatTimezone = (tz: string) => {
    if (!tz) return 'Not specified'
    // Extract city name from timezone string (e.g., "America/New_York" -> "New York")
    const parts = tz.split('/')
    return parts[parts.length - 1].replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>
                Business details and contact information
              </CardDescription>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {details ? (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Business Name */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted mb-1">Business Name</p>
                  <p className="font-medium">{details.businessName || accountName}</p>
                </div>
              </div>

              {/* Website URL */}
              {details.url && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Website</p>
                    <a
                      href={details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {details.url}
                    </a>
                  </div>
                </div>
              )}

              {/* Monthly Budget */}
              {details.monthlyBudget && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Monthly Budget</p>
                    <p className="font-medium">
                      {formatCurrency(parseFloat(details.monthlyBudget), currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* Account Type */}
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted mt-0.5" />
                <div>
                  <p className="text-xs text-muted mb-1">Account Type</p>
                  <p className="font-medium">{formatAccountType(details.accountType || '')}</p>
                </div>
              </div>

              {/* Industry */}
              {details.industry && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Industry</p>
                    <p className="font-medium">{details.industry}</p>
                  </div>
                </div>
              )}

              {/* Country */}
              {details.country && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Country</p>
                    <p className="font-medium">{details.country}</p>
                  </div>
                </div>
              )}

              {/* Timezone */}
              {details.timezone && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Timezone</p>
                    <p className="font-medium">{formatTimezone(details.timezone)}</p>
                  </div>
                </div>
              )}

              {/* Contact Name */}
              {details.contactName && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Contact Name</p>
                    <p className="font-medium">{details.contactName}</p>
                  </div>
                </div>
              )}

              {/* Contact Email */}
              {details.contactEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-xs text-muted mb-1">Contact Email</p>
                    <a
                      href={`mailto:${details.contactEmail}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {details.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {/* Notes */}
              {details.notes && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{details.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No client details added yet</p>
              <p className="text-sm mt-1">Click &quot;Edit&quot; to add client information</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDetailsDialog
        open={dialogOpen}
        onClose={handleDetailsSaved}
        accountId={accountId}
        accountName={accountName}
        currency={currency}
      />
    </>
  )
}

