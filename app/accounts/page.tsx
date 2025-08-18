import { Suspense } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { AccountList } from '@/components/account-list'
import { AccountForm } from '@/components/account-form'
import { AccountStats } from '@/components/account-stats'
import { Skeleton } from '@/components/ui/skeleton'

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">账号管理</h1>
          <p className="text-muted-foreground mt-1">
            管理多个公众号账号，配置API密钥和发布设置
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <AccountStats />
            </Suspense>
            
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <AccountForm />
            </Suspense>
          </div>
          
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-[520px] w-full" />}>
              <AccountList />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
} 