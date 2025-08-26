'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TaskItem {
  id: number
  material_id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  rewritten_content?: string
  created_at: string
  materials?: {
    id: number
    title: string
    source_url?: string
    source_platform?: string
  }
}

const statusConfig = {
  pending: { label: '等待中', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  failed: { label: '失败', color: 'bg-red-100 text-red-800' },
}

export function RewriteResults() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let timer: NodeJS.Timeout | null = null
    
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        
        const res = await fetch('/api/ai/rewrite', { signal: controller.signal })
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const json = await res.json()
        
        if (json?.success) {
          setTasks(json.data || [])
        } else {
          throw new Error(json?.error || '获取改写任务失败')
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('加载改写任务失败:', err)
          setError(err.message)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    load()
    
    // 设置定时刷新
    timer = setInterval(load, 5000)
    
    return () => { 
      controller.abort()
      if (timer) clearInterval(timer)
    }
  }, [])

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return '刚刚'
      if (diffMins < 60) return `${diffMins}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      return `${diffDays}天前`
    } catch {
      return '未知时间'
    }
  }

  const getStatusBadge = (status: TaskItem['status']) => {
    const config = statusConfig[status]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">改写任务</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">改写任务</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-red-600 p-4 text-center">
            <p>加载失败: {error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">改写任务</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">任务 #{task.id}</span>
                {getStatusBadge(task.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(task.created_at)}
              </span>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">素材ID:</span>
                <span className="font-medium">{task.material_id}</span>
                {task.materials?.title && (
                  <span className="text-muted-foreground">
                    ({task.materials.title})
                  </span>
                )}
              </div>
              
              {task.rewritten_content && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <div className="text-xs text-muted-foreground mb-2">改写结果:</div>
                  <div className="text-sm whitespace-pre-wrap line-clamp-3">
                    {task.rewritten_content}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground py-8 text-center">
            <p>暂无改写任务</p>
            <p className="text-xs mt-1">在左侧启动AI改写后，任务将显示在这里</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


