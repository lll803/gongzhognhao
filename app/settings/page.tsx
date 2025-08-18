import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { AIConfigForm } from '@/components/ai-config-form'
import { ScrapingConfigForm } from '@/components/scraping-config-form'
import { SystemSettings } from '@/components/system-settings'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
          <p className="text-muted-foreground mt-1">
            配置AI接口、采集规则和系统参数
          </p>
        </div>

        <div className="space-y-8">
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <AIConfigForm />
          </Suspense>
          
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <ScrapingConfigForm />
          </Suspense>
          
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <SystemSettings />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 