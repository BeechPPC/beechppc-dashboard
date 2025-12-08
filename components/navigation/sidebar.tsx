'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Zap,
  Search,
  TrendingUp,
  DollarSign,
  PenTool,
  Bell,
  Menu,
  X,
  ListCheck,
  ChevronDown,
  MessageCircle,
  Loader2,
  Building2,
  Calendar,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoogleAdsAccount } from '@/lib/google-ads/types'

const navigation = [
  { name: 'Chat Assistant', href: '/chat', icon: MessageCircle },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/meetings', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Tasks', href: '/tasks', icon: ListCheck },
]

const automations = [
  { name: 'Keyword Research', href: '/automations/keyword-research', icon: Search, comingSoon: false },
  { name: 'Competitor Monitoring', href: '/automations/competitor-monitoring', icon: TrendingUp, comingSoon: true },
  { name: 'Budget Management', href: '/automations/budget-management', icon: DollarSign, comingSoon: true },
  { name: 'Copywriting', href: '/automations/copywriting', icon: PenTool, comingSoon: true },
  { name: 'Alert Notifications', href: '/automations/alerts', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [automationsOpen, setAutomationsOpen] = useState(true)
  const [accountsOpen, setAccountsOpen] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('Beech PPC AI')
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState<string | null>(null)

  // Load branding settings
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl)
          }
          if (data.companyName) {
            setCompanyName(data.companyName)
          }
        }
      } catch (error) {
        console.error('Error loading branding:', error)
      }
    }
    loadBranding()
  }, [])

  // Load accounts from MCC
  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true)
      setAccountsError(null)
      try {
        const response = await fetch('/api/google-ads/accounts')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.accounts) {
            setAccounts(data.accounts)
          } else {
            setAccountsError(data.error || 'Failed to load accounts')
          }
        } else {
          setAccountsError('Failed to fetch accounts')
        }
      } catch (error) {
        console.error('Error loading accounts:', error)
        setAccountsError('Error loading accounts')
      } finally {
        setAccountsLoading(false)
      }
    }
    loadAccounts()
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface border border-border shadow-lg"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-screen w-64 flex-col border-r border-border bg-surface/50 backdrop-blur-sm transition-transform duration-300 z-40",
        "lg:relative lg:translate-x-0",
        mobileMenuOpen ? "fixed translate-x-0" : "fixed -translate-x-full"
      )}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          {logoUrl ? (
            <div className="relative h-8 w-8 rounded-lg overflow-hidden">
              <Image
                src={logoUrl}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-semibold text-lg">{companyName}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-primary-light hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Automations Section */}
        <div className="pt-6">
          <button
            onClick={() => setAutomationsOpen(!automationsOpen)}
            className="w-full px-3 pb-2 flex items-center justify-between group"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted group-hover:text-foreground transition-colors">
              Automations
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted transition-transform duration-200",
                automationsOpen && "rotate-180"
              )}
            />
          </button>
          <div className={cn(
            "space-y-1 overflow-hidden transition-all duration-200",
            automationsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}>
            {automations.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-primary-light hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.comingSoon && (
                    <span className="text-xs bg-primary-dark text-white px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
               {/* Accounts Section */}
               <div className="pt-6">
          <button
            onClick={() => setAccountsOpen(!accountsOpen)}
            className="w-full px-3 pb-2 flex items-center justify-between group"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted group-hover:text-foreground transition-colors">
              Accounts
            </h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted transition-transform duration-200",
                accountsOpen && "rotate-180"
              )}
            />
          </button>
          <div className={cn(
            "space-y-1 overflow-hidden transition-all duration-200",
            accountsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}>
            {/* All Accounts Link */}
            <Link
              href="/accounts"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                pathname === '/accounts'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-primary-light hover:text-foreground'
              )}
            >
              <Users className="h-5 w-5" />
              <span className="flex-1">All Accounts</span>
            </Link>

            {/* Loading State */}
            {accountsLoading && (
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading accounts...</span>
              </div>
            )}

            {/* Error State */}
            {accountsError && !accountsLoading && (
              <div className="px-3 py-2 text-xs text-red-600">
                {accountsError}
              </div>
            )}

            {/* Individual Account Links */}
            {!accountsLoading && !accountsError && accounts.length > 0 && (
              <>
                {accounts.map((account) => {
                  const accountPath = `/accounts/${account.id}`
                  const isActive = pathname === accountPath
              return (
                <Link
                      key={account.id}
                      href={accountPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-primary-light hover:text-foreground'
                  )}
                >
                      <Building2 className="h-5 w-5" />
                      <span className="flex-1 truncate" title={account.name}>
                        {account.name}
                    </span>
                </Link>
              )
            })}
              </>
            )}

            {/* No Accounts State */}
            {!accountsLoading && !accountsError && accounts.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted">
                No accounts found
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* User info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
              {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User'}
            </p>
            <p className="text-xs text-muted truncate">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 hover:bg-primary-light rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
