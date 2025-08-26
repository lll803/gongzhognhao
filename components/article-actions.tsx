'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function ArticleActions() {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    status: 'draft'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容')
      return
    }

    setIsSubmitting(true)
    
    try {
      // 这里可以调用API创建文章
      // 暂时模拟创建成功
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('文章创建成功！')
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: '',
        status: 'draft'
      })
      setShowForm(false)
    } catch (error) {
      alert('创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (showForm) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>新建文章</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">文章标题</label>
              <Input
                placeholder="请输入文章标题"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">文章内容</label>
              <Textarea
                placeholder="请输入文章内容..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">分类</label>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="general">通用</option>
                  <option value="news">新闻</option>
                  <option value="tech">科技</option>
                  <option value="lifestyle">生活</option>
                  <option value="entertainment">娱乐</option>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">标签</label>
                <Input
                  placeholder="用逗号分隔多个标签"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">状态</label>
                <Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '创建中...' : '创建文章'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        共 {formData.title ? '1' : '0'} 篇文章
      </div>
      <Button onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4 mr-2" />
        新建文章
      </Button>
    </div>
  )
}
