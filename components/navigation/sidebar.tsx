'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
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
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Tasks', href: '/tasks', icon: ListCheck },
]

const automations = [
  { name: 'Keyword Research', href: '/automations/keyword-research', icon: Search, comingSoon: true },
  { name: 'Competitor Monitoring', href: '/automations/competitor-monitoring', icon: TrendingUp, comingSoon: true },
  { name: 'Budget Management', href: '/automations/budget-management', icon: DollarSign, comingSoon: true },
  { name: 'Copywriting', href: '/automations/copywriting', icon: PenTool, comingSoon: true },
  { name: 'Alert Notifications', href: '/automations/alerts', icon: Bell },
]

const accounts = [
  { name: 'All Accounts', href: '/accounts', icon: Bell, comingSoon: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [automationsOpen, setAutomationsOpen] = useState(true)
  const [accountsOpen, setAccountsOpen] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('Beech PPC AI')

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
      <nav className="flex-1 space-y-1 px-3 py-4">
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
            {accounts.map((item) => {
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
      </nav>

      {/* User info (placeholder for now) */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
            CB
          </div>
          <div>
            <p className="text-sm font-medium">Chris Beechey</p>
            <p className="text-xs text-muted">chris@beechppc.com</p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
