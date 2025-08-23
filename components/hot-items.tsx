'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

interface UiHotItem {
  id: number
  hashid: string
  rank: number
  title: string
  description: string | null
  url: string
  thumbnail: string | null
  extra: string | null
  hot_value: number
  collected_at: string
}

interface BoardStatus {
  hashid: string
  label: string
  status: 'idle' | 'refreshing' | 'success' | 'error'
  error?: string
  count?: number
}

const TARGET_BOARDS: Array<{ hashid: string; label: string }> = [
  { hashid: 'WnBe01o371', label: '微信24小时热文榜' },
  { hashid: 'nBe0xxje37', label: '微信生活24小时热文榜' },
  { hashid: 'proPGGOeq6', label: '微信文化24小时热文榜' },
  { hashid: 'Q0orrr0o8B', label: '微信健康24小时热文榜' },
  { hashid: 'm4ejxxyvxE', label: '微信美食24小时热文榜' },
  { hashid: '1VdJ77keLQ', label: '微信情感24小时热文榜' },
]

export function HotItems() {
  const [items, setItems] = useState<UiHotItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [boardStatuses, setBoardStatuses] = useState<BoardStatus[]>(
    TARGET_BOARDS.map(board => ({ ...board, status: 'idle' }))
  )
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)

  function loadItems() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/scraping/tophub/items?limit=60', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setItems(json?.data?.items || [])
      } catch (error) {
        console.error('Failed to load items:', error)
      }
    })
  }

  async function refreshAll() {
    setIsRefreshing(true)
    setBoardStatuses(prev => prev.map(s => ({ ...s, status: 'idle' })))
    
    try {
      for (let i = 0; i < TARGET_BOARDS.length; i++) {
        const board = TARGET_BOARDS[i]
        
        // 更新状态为刷新中
        setBoardStatuses(prev => 
          prev.map(s => s.hashid === board.hashid ? { ...s, status: 'refreshing' } : s)
        )
        
        try {
          const res = await fetch(`/api/scraping/tophub/refresh?hashid=${encodeURIComponent(board.hashid)}`, { 
            method: 'POST' 
          })
          
          if (res.ok) {
            const result = await res.json()
            setBoardStatuses(prev => 
              prev.map(s => s.hashid === board.hashid 
                ? { ...s, status: 'success', count: result.total || 0 }
                : s
              )
            )
          } else {
            throw new Error(`HTTP ${res.status}`)
          }
        } catch (error: any) {
          setBoardStatuses(prev => 
            prev.map(s => s.hashid === board.hashid 
              ? { ...s, status: 'error', error: error?.message || '未知错误' }
              : s
            )
          )
        }
        
        // 小延迟避免后端超时
        if (i < TARGET_BOARDS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // 刷新完成后重新加载数据
      await loadItems()
      setLastRefreshTime(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  function getStatusBadge(status: BoardStatus) {
    switch (status.status) {
      case 'idle':
        return <Badge variant="secondary">待刷新</Badge>
      case 'refreshing':
        return <Badge variant="default">刷新中</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          成功 {status.count ? `(${status.count})` : ''}
        </Badge>
      case 'error':
        return <Badge variant="destructive" title={status.error}>
          失败
        </Badge>
      default:
        return null
    }
  }

  useEffect(() => { loadItems() }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>热门榜单</CardTitle>
          {lastRefreshTime && (
            <p className="text-sm text-muted-foreground mt-1">
              最后刷新: {formatRelativeTime(lastRefreshTime)}
            </p>
          )}
        </div>
        <Button 
          variant="accent" 
          size="sm" 
          onClick={refreshAll} 
          disabled={isPending || isRefreshing}
        >
          {isRefreshing ? '刷新中…' : '刷新全部'}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 榜单状态 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {boardStatuses.map((board) => (
            <div key={board.hashid} className="flex items-center justify-between p-2 rounded-lg border text-sm">
              <span className="truncate">{board.label}</span>
              {getStatusBadge(board)}
            </div>
          ))}
        </div>

        {/* 热榜内容 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">热门内容</h3>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              暂无数据，点击"刷新全部"开始采集
            </div>
          ) : (
            items.map((item) => (
              <a 
                key={`${item.hashid}-${item.rank}-${item.url}`} 
                href={item.url} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center space-x-3 p-4 rounded-xl border hover:bg-accent/5 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
                    {item.rank}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {TARGET_BOARDS.find(b => b.hashid === item.hashid)?.label || item.hashid}
                    </Badge>
                  </div>
                  {item.description ? (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
                  ) : null}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="truncate max-w-[40%]">
                      {TARGET_BOARDS.find(b => b.hashid === item.hashid)?.label || item.hashid}
                    </span>
                    <span>热度: {item.hot_value.toLocaleString()}</span>
                    <span>{formatRelativeTime(item.collected_at)}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}