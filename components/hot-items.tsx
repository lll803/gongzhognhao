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
    <div className="w-full max-w-full overflow-hidden">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl">热门榜单</CardTitle>
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
            className="flex-shrink-0 w-full sm:w-auto"
          >
            {isRefreshing ? '刷新中…' : '刷新全部'}
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* 榜单状态 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boardStatuses.map((board) => (
              <div key={board.hashid} className="flex items-center justify-between p-3 rounded-lg border text-sm min-w-0">
                <span className="truncate flex-1 mr-2 text-xs sm:text-sm">{board.label}</span>
                <div className="flex-shrink-0">
                  {getStatusBadge(board)}
                </div>
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
              <div className="space-y-3">
                {items.map((item) => (
                  <a 
                    key={`${item.hashid}-${item.rank}-${item.url}`} 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block p-4 rounded-xl border hover:bg-accent/5 transition-colors min-w-0 break-words"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
                          {item.rank}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-col gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed break-words">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {TARGET_BOARDS.find(b => b.hashid === item.hashid)?.label || item.hashid}
                            </Badge>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed break-words">{item.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-400">
                          <span className="truncate break-words">
                            {TARGET_BOARDS.find(b => b.hashid === item.hashid)?.label || item.hashid}
                          </span>
                          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
                            <span className="whitespace-nowrap">热度: {item.hot_value.toLocaleString()}</span>
                            <span className="whitespace-nowrap">{formatRelativeTime(item.collected_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}