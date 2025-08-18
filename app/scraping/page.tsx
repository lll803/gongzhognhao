import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Skeleton } from '@/components/ui/skeleton'
import { HotItems } from '@/components/hot-items'

export default function ScrapingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">内容采集</h1>
          <p className="text-muted-foreground mt-1">
            从各大平台采集热门内容，支持微信、知乎、百度等平台
          </p>
        </div>

        <div className="grid gap-6">
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
              <HotItems />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
} 