'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Copy, Check } from 'lucide-react'

interface MaterialRow {
  id: number
  title: string
  description?: string | null
  source_url?: string | null
  source_platform?: string | null
  thumbnail?: string | null
  extra_data?: any
  created_at: string
  updated_at: string
}

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [material, setMaterial] = useState<MaterialRow | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const illustratedMd: string | undefined = useMemo(() => {
    return (material as any)?.extra_data?.illustrate?.contentWithImages
  }, [material])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/materials?materialId=${materialId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const row: MaterialRow | undefined = json?.data?.materials?.[0]
      if (!row) throw new Error('未找到素材')
      setMaterial(row)
    } catch (e: any) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [materialId])

  useEffect(() => { load() }, [load])

  async function copy(text?: string, label?: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label || '已复制')
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-6 w-64" />
      </div>
    )
  }

  if (error || !material) {
    return (
      <div className="container mx-auto py-10 text-center text-red-600">
        {error || '未找到文章'}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Button>
        <h1 className="text-2xl font-bold">文章详情</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{material.title}</span>
            {material.thumbnail && (
              <span className="text-xs text-muted-foreground">封面已生成</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {material.description && (
            <div className="text-muted-foreground text-sm">{material.description}</div>
          )}

          {/* 配图后的 Markdown 优先展示 */}
          {illustratedMd ? (
            <div className="border rounded-md">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm text-muted-foreground">配图后的Markdown</span>
                <Button size="sm" variant="outline" onClick={() => copy(illustratedMd, '配图Markdown')}>
                  {copied === '配图Markdown' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  复制
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-b-md">
                <pre className="whitespace-pre-wrap text-sm">{illustratedMd}</pre>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">尚未生成配图后的内容，请返回“内容管理”生成配图。</div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {material.source_platform && <Badge variant="outline">{material.source_platform}</Badge>}
            <span>素材ID: {material.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


