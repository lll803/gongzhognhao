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

    const originalLength = (content || '').replace(/\s+/g, '').length
    // 至少 600 字，目标不小于原文的 80%，并限制上限，避免超长
    const minChars = Math.max(600, Math.floor(originalLength * 0.8))
    const targetNote = `正文至少 ${minChars} 字，尽量接近原文长度；分段自然。`
    
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

    fullPrompt += `正文内容：\n${content}\n\n请严格按以下格式输出改写后的完整文章：\n- 仅输出内容本身，不要任何解释或前后缀\n- 不要包含“标题:”“正文内容:”等标签\n- 第一行是改写后的标题\n- 空一行后输出正文\n- ${targetNote}`

    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的内容改写助手，擅长以不同的风格改写文章内容，保持原意与事实准确的同时提升表达质量与结构完整性。输出必须为中文。'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      // 提高可生成长度
      max_tokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.6'),
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('AI响应为空')
    }

    // 解析响应内容
    const lines = response.split('\n')
    let rewrittenTitle = title
    let rewrittenDescription = description

    // 如果模型按约定返回“首行标题”，尝试取第一行作为标题
    const firstNonEmpty = lines.find(l => l.trim())?.trim() || ''
    if (firstNonEmpty && !firstNonEmpty.startsWith('标题')) {
      rewrittenTitle = firstNonEmpty
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
