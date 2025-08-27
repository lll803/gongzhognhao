import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Skeleton } from '@/components/ui/skeleton'
import { HotItems } from '@/components/hot-items'
import { UrlCollector } from '@/components/url-collector'

export default function ScrapingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">内容采集</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            从各大平台采集热门内容，支持微信、知乎、百度等平台
          </p>
        </div>

        <div className="w-full max-w-full mb-8">
          <UrlCollector />
        </div>

        <div className="w-full max-w-full">
          <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
            <HotItems />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 