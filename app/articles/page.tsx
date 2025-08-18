import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { ArticleFilters } from '@/components/article-filters'
import { ArticleList } from '@/components/article-list'
import { ArticleActions } from '@/components/article-actions'
import { Skeleton } from '@/components/ui/skeleton'

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">内容管理</h1>
          <p className="text-muted-foreground mt-1">
            管理所有采集和改写的文章，支持分类、标签、搜索等功能
          </p>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <ArticleFilters />
          </Suspense>
          
          <Suspense fallback={<Skeleton className="h-16 w-full" />}>
            <ArticleActions />
          </Suspense>
          
          <Suspense fallback={<Skeleton className="h-[520px] w-full" />}>
            <ArticleList />
          </Suspense>
        </div>
      </main>
    </div>
  )
} 