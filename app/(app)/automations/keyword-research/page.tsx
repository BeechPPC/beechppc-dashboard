'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Download, FileSpreadsheet, Loader2, Sparkles, TrendingUp, DollarSign, Target } from 'lucide-react'

interface KeywordData {
  keyword: string
  avgMonthlySearches: number
  competition: string
  competitionIndex: number
  lowTopOfPageBid: number
  highTopOfPageBid: number
  theme?: string
  searchIntent?: string
  aiInsights?: string
}

interface KeywordGroup {
  theme: string
  keywords: KeywordData[]
  totalSearchVolume: number
}

export default function KeywordResearchPage() {
  const [seedKeywords, setSeedKeywords] = useState('')
  const [landingPageUrl, setLandingPageUrl] = useState('')
  const [location, setLocation] = useState('2036') // Australia by default
  const [language, setLanguage] = useState('1000') // English by default
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KeywordData[]>([])
  const [groupedResults, setGroupedResults] = useState<KeywordGroup[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleResearch = async () => {
    if (!seedKeywords.trim() && !landingPageUrl.trim()) {
      setError('Please enter seed keywords or a landing page URL')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])
    setGroupedResults([])

    try {
      const response = await fetch('/api/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: seedKeywords.split('\n').filter(k => k.trim()),
          landingPageUrl: landingPageUrl.trim() || undefined,
          location,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch keyword data')
      }

      // Check if we got a message indicating no results
      if (data.message && (!data.keywords || data.keywords.length === 0)) {
        setError(data.message)
        setResults([])
        setGroupedResults([])
        return
      }

      setResults(data.keywords || [])
      setGroupedResults(data.groups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (results.length === 0) return

    const headers = ['Keyword', 'Avg Monthly Searches', 'Competition', 'Competition Index', 'Low Bid', 'High Bid', 'Theme', 'Search Intent', 'AI Insights']
    const rows = results.map(k => [
      k.keyword,
      k.avgMonthlySearches,
      k.competition,
      k.competitionIndex,
      k.lowTopOfPageBid,
      k.highTopOfPageBid,
      k.theme || '',
      k.searchIntent || '',
      k.aiInsights || '',
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `keyword-research-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToGoogleSheets = async () => {
    if (results.length === 0) return

    try {
      const response = await fetch('/api/keyword-research/export-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: results }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export to Google Sheets')
      }

      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to Google Sheets')
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          AI-powered keyword research and discovery using Google Ads Keyword Planner
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Research Keywords</CardTitle>
          <CardDescription>
            Enter seed keywords or a landing page URL to discover keyword opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seedKeywords">Seed Keywords</Label>
            <Textarea
              id="seedKeywords"
              placeholder="Enter keywords (one per line)&#10;e.g. ppc management&#10;google ads agency&#10;paid search services"
              value={seedKeywords}
              onChange={(e) => setSeedKeywords(e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted">Enter one keyword per line</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landingPageUrl">Landing Page URL (Optional)</Label>
            <Input
              id="landingPageUrl"
              type="url"
              placeholder="https://example.com/services/ppc"
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
            />
            <p className="text-xs text-muted">Google will suggest keywords related to this page</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="2036">Australia</option>
                <option value="2840">United States</option>
                <option value="2826">United Kingdom</option>
                <option value="2124">Canada</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="1000">English</option>
                <option value="1001">German</option>
                <option value="1002">French</option>
                <option value="1003">Spanish</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleResearch}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching Keywords...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Start Research
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Total Keywords
                </CardDescription>
                <Search className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Total Search Volume
                </CardDescription>
                <TrendingUp className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(results.reduce((sum, k) => sum + k.avgMonthlySearches, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Avg CPC Range
                </CardDescription>
                <DollarSign className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(results.reduce((sum, k) => sum + k.lowTopOfPageBid, 0) / results.length)} - {formatCurrency(results.reduce((sum, k) => sum + k.highTopOfPageBid, 0) / results.length)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">
                  Keyword Groups
                </CardDescription>
                <Target className="h-4 w-4 text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groupedResults.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={exportToGoogleSheets} variant="outline">
              <FileSpreadsheet className="h-4 w-4" />
              Export to Google Sheets
            </Button>
          </div>

          {/* Grouped Results */}
          {groupedResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Keywords by Theme</h2>
              {groupedResults.map((group, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {group.theme}
                        </CardTitle>
                        <CardDescription>
                          {group.keywords.length} keywords • {formatNumber(group.totalSearchVolume)} total monthly searches
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr className="text-left">
                            <th className="pb-2 font-medium">Keyword</th>
                            <th className="pb-2 font-medium text-right">Searches/mo</th>
                            <th className="pb-2 font-medium">Competition</th>
                            <th className="pb-2 font-medium text-right">CPC Range</th>
                            <th className="pb-2 font-medium">Intent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {group.keywords.map((keyword, kidx) => (
                            <tr key={kidx} className="hover:bg-muted/50">
                              <td className="py-2 font-medium">{keyword.keyword}</td>
                              <td className="py-2 text-right">{formatNumber(keyword.avgMonthlySearches)}</td>
                              <td className="py-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  keyword.competition === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  keyword.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {keyword.competition}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                {formatCurrency(keyword.lowTopOfPageBid)} - {formatCurrency(keyword.highTopOfPageBid)}
                              </td>
                              <td className="py-2 text-xs text-muted">{keyword.searchIntent || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* All Keywords Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Keywords</CardTitle>
              <CardDescription>
                Complete list of discovered keywords with performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-2 font-medium">Keyword</th>
                      <th className="pb-2 font-medium text-right">Searches/mo</th>
                      <th className="pb-2 font-medium">Competition</th>
                      <th className="pb-2 font-medium text-right">CPC Range</th>
                      <th className="pb-2 font-medium">Theme</th>
                      <th className="pb-2 font-medium">Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((keyword, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="py-2 font-medium">{keyword.keyword}</td>
                        <td className="py-2 text-right">{formatNumber(keyword.avgMonthlySearches)}</td>
                        <td className="py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                            keyword.competition === 'HIGH' ? 'bg-red-100 text-red-800' :
                            keyword.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {keyword.competition}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(keyword.lowTopOfPageBid)} - {formatCurrency(keyword.highTopOfPageBid)}
                        </td>
                        <td className="py-2 text-xs text-muted">{keyword.theme || '-'}</td>
                        <td className="py-2 text-xs text-muted">{keyword.searchIntent || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
