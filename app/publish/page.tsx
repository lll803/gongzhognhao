import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { PublishQueue } from '@/components/publish-queue'
import { PublishHistory } from '@/components/publish-history'
import { AccountSelector } from '@/components/account-selector'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublishPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">发布管理</h1>
          <p className="text-muted-foreground mt-1">
            管理文章发布流程，支持多账号发布和发布状态跟踪
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <AccountSelector />
            </Suspense>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <PublishQueue />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
              <PublishHistory />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
} 