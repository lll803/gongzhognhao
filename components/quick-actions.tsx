'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  FileText, 
  Upload, 
  Settings,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react'

const quickActions = [
  {
    title: '开始采集',
    description: '从各大平台采集热门内容',
    icon: Zap,
    href: '/scraping',
    variant: 'accent' as const
  },
  {
    title: 'AI改写',
    description: '使用AI技术改写文章内容',
    icon: FileText,
    href: '/ai-rewrite',
    variant: 'accent' as const
  },
  {
    title: '发布文章',
    description: '将文章发布到公众号',
    icon: Upload,
    href: '/publish',
    variant: 'accent' as const
  },
  {
    title: '查看统计',
    description: '查看内容发布和阅读数据',
    icon: BarChart3,
    href: '/analytics',
    variant: 'outline' as const
  },
  {
    title: '账号管理',
    description: '管理公众号账号和配置',
    icon: Users,
    href: '/accounts',
    variant: 'outline' as const
  },
  {
    title: '系统设置',
    description: '配置AI接口和采集规则',
    icon: Settings,
    href: '/settings',
    variant: 'outline' as const
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5" />
          <span>快速操作</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <div key={action.title} className="group">
              <Button
                variant={action.variant}
                className={`w-full h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow`}
                asChild
              >
                <a href={action.href}>
                  <action.icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 