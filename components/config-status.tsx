'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ConfigStatus {
  supabase: boolean
  openai: boolean
  database: boolean
}

export function ConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus>({
    supabase: false,
    openai: false,
    database: false
  })
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkConfig()
  }, [])

  const checkConfig = async () => {
    setIsChecking(true)
    
    try {
      // 检查数据库连接
      const dbRes = await fetch('/api/materials?limit=1')
      const dbOk = dbRes.ok
      
      // 检查AI改写API
      const aiRes = await fetch('/api/ai/rewrite?limit=1')
      const aiOk = aiRes.ok
      
      setStatus({
        supabase: dbOk,
        openai: aiOk,
        database: dbOk
      })
    } catch (error) {
      console.error('配置检查失败:', error)
      setStatus({
        supabase: false,
        openai: false,
        database: false
      })
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusBadge = (isOk: boolean) => (
    <Badge className={isOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
      {isOk ? '正常' : '异常'}
    </Badge>
  )

  if (isChecking) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">系统状态检查中...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const allOk = status.supabase && status.openai && status.database

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">系统状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">数据库连接</span>
          {getStatusBadge(status.database)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">AI改写服务</span>
          {getStatusBadge(status.openai)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Supabase</span>
          {getStatusBadge(status.supabase)}
        </div>
        
        {!allOk && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">⚠️ 系统配置异常</p>
              <p className="text-xs mb-2">请检查以下配置：</p>
              <ul className="text-xs space-y-1 ml-4">
                {!status.supabase && <li>• 环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY</li>}
                {!status.openai && <li>• 环境变量 OPENAI_API_KEY 或 OPENROUTER_API_KEY</li>}
                {!status.database && <li>• 数据库连接配置</li>}
              </ul>
              <p className="text-xs mt-2">
                参考 <code className="bg-yellow-100 px-1 rounded">env.example</code> 文件配置环境变量
              </p>
            </div>
          </div>
        )}
        
        <Button 
          onClick={checkConfig} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          重新检查
        </Button>
      </CardContent>
    </Card>
  )
}
