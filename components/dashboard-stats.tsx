'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Users,
  Zap,
  Eye,
  Share2
} from 'lucide-react'

interface Stats {
  materials_total: number
  materials_today: number
  ai_tasks_total: number
  ai_tasks_completed: number
  ai_tasks_processing: number
  ai_tasks_completed_24h: number
  rewrite_results_total: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch('/api/stats/overview', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json?.success) setStats(json.data)
        else throw new Error(json?.error || '加载失败')
      } catch (e: any) {
        setError(e?.message || '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { title: '素材总数', value: stats?.materials_total ?? '-', icon: FileText, desc: '累计素材' },
    { title: '今日新增', value: stats?.materials_today ?? '-', icon: TrendingUp, desc: '今日入库' },
    { title: '改写进行中', value: stats?.ai_tasks_processing ?? '-', icon: Clock, desc: '队列中' },
    { title: '改写完成', value: stats?.ai_tasks_completed ?? '-', icon: CheckCircle, desc: '累计完成' },
    { title: '改写总任务', value: stats?.ai_tasks_total ?? '-', icon: Zap, desc: '累计创建' },
    { title: '24小时完成', value: stats?.ai_tasks_completed_24h ?? '-', icon: Eye, desc: '近24小时' },
    { title: '结果总数', value: stats?.rewrite_results_total ?? '-', icon: Share2, desc: '改写结果' },
  ]

  if (isLoading) {
    return (
      <>
        {Array.from({ length: cards.length }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">加载中...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
      </Card>
    )
  }

  return (
    <>
      {cards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{String(stat.value)}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.desc}</div>
          </CardContent>
        </Card>
      ))}
    </>
  )
} 