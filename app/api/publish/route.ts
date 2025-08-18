import { NextRequest, NextResponse } from 'next/server'
import { PublishStatus } from '@/lib/types'

interface PublishRequest {
  articleId: string
  accountId: string
  scheduledTime?: string
}

interface PublishResponse {
  id: string
  articleId: string
  accountId: string
  status: PublishStatus
  message: string
  publishedAt?: Date
  createdAt: Date
}

// 模拟发布队列
const publishQueue: PublishResponse[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const accountId = searchParams.get('accountId')
    
    let filteredQueue = [...publishQueue]
    
    // 按状态筛选
    if (status) {
      filteredQueue = filteredQueue.filter(item => item.status === status)
    }
    
    // 按账号筛选
    if (accountId) {
      filteredQueue = filteredQueue.filter(item => item.accountId === accountId)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        queue: filteredQueue,
        total: filteredQueue.length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '获取发布队列失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json()
    
    // 验证请求参数
    if (!body.articleId || !body.accountId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }
    
    // 创建发布任务
    const publishTask: PublishResponse = {
      id: Date.now().toString(),
      articleId: body.articleId,
      accountId: body.accountId,
      status: PublishStatus.PENDING,
      message: '等待发布',
      createdAt: new Date()
    }
    
    // 添加到发布队列
    publishQueue.push(publishTask)
    
    // 模拟发布过程
    setTimeout(async () => {
      await simulatePublish(publishTask)
    }, 2000)
    
    return NextResponse.json({
      success: true,
      data: publishTask,
      message: '发布任务已创建'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '创建发布任务失败' },
      { status: 500 }
    )
  }
}

// 模拟发布过程
async function simulatePublish(publishTask: PublishResponse) {
  try {
    // 模拟发布延迟
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))
    
    // 随机成功或失败
    const isSuccess = Math.random() > 0.1 // 90%成功率
    
    if (isSuccess) {
      publishTask.status = PublishStatus.PUBLISHED
      publishTask.message = '发布成功'
      publishTask.publishedAt = new Date()
    } else {
      publishTask.status = PublishStatus.FAILED
      publishTask.message = '发布失败：网络超时'
    }
    
    // 更新队列中的任务
    const index = publishQueue.findIndex(task => task.id === publishTask.id)
    if (index !== -1) {
      publishQueue[index] = publishTask
    }
  } catch (error) {
    publishTask.status = PublishStatus.FAILED
    publishTask.message = '发布失败：系统错误'
    
    const index = publishQueue.findIndex(task => task.id === publishTask.id)
    if (index !== -1) {
      publishQueue[index] = publishTask
    }
  }
} 