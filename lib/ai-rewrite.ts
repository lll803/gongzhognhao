import OpenAI from 'openai'
import { RewriteStyle, AIRewriteStatus } from './types'

// 创建OpenAI客户端，使用OpenRouter API
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_API_BASE,
  dangerouslyAllowBrowser: false, // 确保只在服务端使用
})

export interface AIRewriteRequest {
  content: string
  title?: string
  description?: string
  style: RewriteStyle
  customPrompt?: string
}

export interface AIRewriteResponse {
  success: boolean
  rewrittenTitle?: string
  rewrittenDescription?: string
  rewrittenContent?: string
  error?: string
}

// 改写风格对应的提示词
const STYLE_PROMPTS: Record<RewriteStyle, string> = {
  [RewriteStyle.PROFESSIONAL]: '请以专业、正式的语气改写以下内容，保持逻辑清晰，语言严谨。',
  [RewriteStyle.FRIENDLY]: '请以友好、亲切的语气改写以下内容，让读者感到温暖和亲近。',
  [RewriteStyle.HUMOROUS]: '请以幽默、风趣的语气改写以下内容，增加趣味性和可读性。',
  [RewriteStyle.FORMAL]: '请以正式、庄重的语气改写以下内容，适合正式场合使用。',
  [RewriteStyle.CREATIVE]: '请以创意、新颖的方式改写以下内容，展现独特的视角和表达。',
}

/**
 * 执行AI内容改写
 */
export async function performAIRewrite(request: AIRewriteRequest): Promise<AIRewriteResponse> {
  try {
    const { content, title, description, style, customPrompt } = request
    
    // 构建改写提示词
    const basePrompt = STYLE_PROMPTS[style]
    const customPromptText = customPrompt ? `\n\n特殊要求：${customPrompt}` : ''
    
    let fullPrompt = `${basePrompt}${customPromptText}\n\n请改写以下内容：\n\n`
    
    if (title) {
      fullPrompt += `标题：${title}\n\n`
    }
    
    if (description) {
      fullPrompt += `描述：${description}\n\n`
    }
    
    fullPrompt += `正文内容：\n${content}\n\n请提供改写后的内容，保持原意的同时提升表达质量。`

    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的内容改写助手，擅长以不同的风格改写文章内容，保持原意的同时提升表达质量。'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('AI响应为空')
    }

    // 解析响应内容
    const lines = response.split('\n')
    let rewrittenTitle = title
    let rewrittenDescription = description
    let rewrittenContent = response

    // 尝试提取改写后的标题和描述
    if (title && response.includes('标题：')) {
      const titleMatch = response.match(/标题：(.+?)(?:\n|$)/)
      if (titleMatch) {
        rewrittenTitle = titleMatch[1].trim()
      }
    }

    if (description && response.includes('描述：')) {
      const descMatch = response.match(/描述：(.+?)(?:\n|$)/)
      if (descMatch) {
        rewrittenDescription = descMatch[1].trim()
      }
    }

    return {
      success: true,
      rewrittenTitle,
      rewrittenDescription,
      rewrittenContent: response.trim(),
    }
  } catch (error) {
    console.error('AI改写失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

/**
 * 生成改写提示词
 */
export function generateRewritePrompt(style: RewriteStyle, customPrompt?: string): string {
  const basePrompt = STYLE_PROMPTS[style]
  return customPrompt ? `${basePrompt}\n\n特殊要求：${customPrompt}` : basePrompt
}

/**
 * 验证改写风格
 */
export function isValidRewriteStyle(style: string): style is RewriteStyle {
  return Object.values(RewriteStyle).includes(style as RewriteStyle)
}

/**
 * 获取所有可用的改写风格
 */
export function getAvailableRewriteStyles(): Array<{ value: RewriteStyle; label: string }> {
  return [
    { value: RewriteStyle.PROFESSIONAL, label: '专业正式' },
    { value: RewriteStyle.FRIENDLY, label: '友好亲切' },
    { value: RewriteStyle.HUMOROUS, label: '幽默风趣' },
    { value: RewriteStyle.FORMAL, label: '正式庄重' },
    { value: RewriteStyle.CREATIVE, label: '创意新颖' },
  ]
}
