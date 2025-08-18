'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  Zap,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: '概览', href: '/', icon: BarChart3 },
  { name: '内容采集', href: '/scraping', icon: Zap },
  { name: 'AI改写', href: '/ai-rewrite', icon: FileText },
  { name: '内容管理', href: '/articles', icon: FileText },
  { name: '发布管理', href: '/publish', icon: FileText },
  { name: '账号管理', href: '/accounts', icon: Users },
  { name: '系统设置', href: '/settings', icon: Settings },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b shadow-md bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900">公众号CMS</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm rounded-full transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow'
                      : 'text-gray-700 hover:bg-accent/10 hover:text-foreground font-medium'
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-2 text-base rounded-full transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow'
                        : 'text-gray-700 hover:bg-accent/10 hover:text-foreground font-medium'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 