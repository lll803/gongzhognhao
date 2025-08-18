import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardStats } from '@/components/dashboard-stats'
import { RecentArticles } from '@/components/recent-articles'
import { HotItems } from '@/components/hot-items'
import { QuickActions } from '@/components/quick-actions'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">系统概览</h1>
          <p className="text-muted-foreground mt-1">
            欢迎使用公众号内容管理系统，高效管理您的内容创作和发布流程
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <DashboardStats />
          </Suspense>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RecentArticles />
            </Suspense>
          </div>
          
          <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <HotItems />
            </Suspense>
          </div>
        </div>

        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-36 w-full" />}>
            <QuickActions />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 