'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MaterialItem {
  id: number
  title: string
  description?: string
  sourcePlatform?: string
  created_at?: string
}

export function ArticleSelector() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        
        const params = new URLSearchParams({ 
          page: '1', 
          limit: '10', 
          status: 'active', 
          ...(search ? { search } : {}) 
        })
        
        const res = await fetch(`/api/materials?${params}`, { 
          signal: controller.signal 
        })
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const json = await res.json()
        
        if (json?.success) {
          setMaterials(json.data.materials || [])
        } else {
          throw new Error(json?.error || '获取素材失败')
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('加载素材失败:', err)
          setError(err.message)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    load()
    return () => controller.abort()
  }, [search])

  async function copyText(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    } catch (e) {
      return false
    }
  }

  const handleMaterialClick = async (materialId: number) => {
    const ok = await copyText(String(materialId))
    if (ok) {
      setCopiedId(materialId)
      setTimeout(() => setCopiedId(null), 1500)
    } else {
      console.error('复制失败')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择素材</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择素材</CardTitle>
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
        <CardTitle className="text-base">选择素材</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-w-full overflow-x-hidden">
        <Input 
          placeholder="搜索素材..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <div className="space-y-2 max-h-72 overflow-auto">
          {materials.map(m => (
            <div 
              key={m.id} 
              className="p-3 border rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
              onClick={() => handleMaterialClick(m.id)}
              title="点击复制ID"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm line-clamp-1 break-all">{m.title}</div>
                {m.sourcePlatform && (
                  <Badge variant="outline" className="text-xs">
                    {m.sourcePlatform}
                  </Badge>
                )}
              </div>
              {m.description && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-all">
                  {m.description}
                </div>
              )}
              <div 
                className="text-[10px] text-muted-foreground mt-1 underline-offset-2 hover:underline"
                onClick={(e) => { e.stopPropagation(); handleMaterialClick(m.id) }}
                role="button"
              >
                {copiedId === m.id ? '已复制' : `点击复制ID：${m.id}`}
              </div>
            </div>
          ))}
          {materials.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {search ? '没有找到匹配的素材' : '暂无素材，请先在热榜添加'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


