'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function ArticleActions() {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        共 0 篇文章
      </div>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        新建文章
      </Button>
    </div>
  )
}
