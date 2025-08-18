import { NextRequest, NextResponse } from 'next/server'
import { RewriteStyle } from '@/lib/types'

interface RewriteRequest {
  content: string
  style: RewriteStyle
  customPrompt?: string
  maxLength?: number
}

interface RewriteResponse {
  originalContent: string
  rewrittenContent: string
  style: RewriteStyle
  customPrompt?: string
  wordCount: number
  processingTime: number
}

export async function POST(request: NextRequest) {
  try {
    const body: RewriteRequest = await request.json()
    const startTime = Date.now()
    
    // 验证请求参数
    if (!body.content || !body.style) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }
    
    // 这里应该调用实际的AI API
    // 目前使用模拟的改写逻辑
    const rewrittenContent = await simulateAIRewrite(
      body.content,
      body.style,
      body.customPrompt
    )
    
    const processingTime = Date.now() - startTime
    const wordCount = rewrittenContent.length
    
    const response: RewriteResponse = {
      originalContent: body.content,
      rewrittenContent,
      style: body.style,
      customPrompt: body.customPrompt,
      wordCount,
      processingTime
    }
    
    return NextResponse.json({
      success: true,
      data: response,
      message: 'AI改写完成'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI改写失败' },
      { status: 500 }
    )
  }
}

// 模拟AI改写功能
async function simulateAIRewrite(
  content: string,
  style: RewriteStyle,
  customPrompt?: string
): Promise<string> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  let prefix = ''
  
  switch (style) {
    case RewriteStyle.HUMOROUS:
      prefix = '😄 有趣的是，'
      break
    case RewriteStyle.FORMAL:
      prefix = '根据相关研究，'
      break
    case RewriteStyle.FRIENDLY:
      prefix = '亲爱的朋友，'
      break
    case RewriteStyle.PROFESSIONAL:
      prefix = '从专业角度来看，'
      break
    case RewriteStyle.CREATIVE:
      prefix = '✨ 让我们换个角度思考，'
      break
    default:
      prefix = ''
  }
  
  if (customPrompt) {
    prefix += `[${customPrompt}] `
  }
  
  // 简单的改写逻辑（实际应用中应该调用AI API）
  const rewritten = prefix + content
    .replace(/。/g, '！')
    .replace(/，/g, '，')
    .replace(/。/g, '。')
    .replace(/。/g, '...')
  
  return rewritten
} 