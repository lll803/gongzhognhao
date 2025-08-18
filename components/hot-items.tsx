'use client'

import { useEffect, useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export function HotItems() {
  const [items, setItems] = useState<UiHotItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  function loadItems() {
    startTransition(async () => {
      const res = await fetch('/api/scraping/tophub/items?limit=60', { cache: 'no-store' })
      const json = await res.json()
      setItems(json?.data?.items || [])
    })
  }

  async function refreshAll() {
    setIsRefreshing(true)
    try {
      const hashids = [
        'WnBe01o371',
        'nBe0xxje37',
        'proPGGOeq6',
        'Q0orrr0o8B',
        'm4ejxxyvxE',
        '1VdJ77keLQ',
      ]
      for (const h of hashids) {
        // sequential to avoid backend timeout
        await fetch(`/api/scraping/tophub/refresh?hashid=${encodeURIComponent(h)}`, { method: 'POST' })
      }
      loadItems()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>热门榜单</CardTitle>
        <Button variant="accent" size="sm" onClick={refreshAll} disabled={isPending || isRefreshing}>
          {isRefreshing ? '刷新中…' : '刷新全部'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无数据</div>
        ) : (
          items.map((item) => (
            <a key={`${item.hashid}-${item.rank}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-4 rounded-xl border hover:bg-accent/5 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
                  {item.rank}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                </div>
                {item.description ? (
                  <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                ) : null}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate max-w-[40%]">{item.hashid}</span>
                  <span>热度: {item.hot_value.toLocaleString()}</span>
                  <span>{formatRelativeTime(item.collected_at)}</span>
                </div>
              </div>
            </a>
          ))
        )}
      </CardContent>
    </Card>
  )
}