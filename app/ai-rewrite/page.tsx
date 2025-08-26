'use client'

import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { ConfigStatus } from '@/components/config-status'
import { ArticleSelector } from '@/components/article-selector'
import { RewriteForm } from '@/components/rewrite-form'
import { RewriteResults } from '@/components/rewrite-results'
import { Skeleton } from '@/components/ui/skeleton'

export default function AIRewritePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">AI改写</h1>
          <p className="text-muted-foreground mt-1">
            使用AI技术对文章进行智能改写，支持多种风格和自定义提示词
          </p>
        </div>

        <Suspense fallback={<Skeleton className="h-32 w-full mb-6" />}>
          <ConfigStatus />
        </Suspense>

        <div className="grid gap-6 lg:grid-cols-3 max-w-full overflow-x-hidden">
          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <ArticleSelector />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RewriteForm />
            </Suspense>
          </div>
          
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
              <RewriteResults />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
} 