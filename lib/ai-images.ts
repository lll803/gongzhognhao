import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_API_BASE,
  dangerouslyAllowBrowser: false,
})

export interface IllustrationPlan {
  coverPrompt: string
  paragraphPrompts: Array<{ index: number; prompt: string; text: string }>
}

export async function buildIllustrationPlan(title: string | undefined, content: string): Promise<IllustrationPlan> {
  const userPrompt = `You are a senior editorial art director for a Chinese article. Produce concise, concrete ENGLISH prompts for image generation.

Tasks:
1) Based on the title and body, output one English "cover image prompt" (<= 35 words). It must describe a clear main subject, scene, composition and mood for a WeChat cover (horizontal 900x383, centered subject, safe margins). Avoid abstract wording. Append: "without text, watermark, logo, caption".
2) Split the body into up to 6 logical paragraphs. For each paragraph, output an English "illustration prompt" (<= 30 words) that matches that paragraph’s meaning. Each prompt should specify: main subject, setting, time/lighting, style/medium (e.g. documentary photo, flat illustration, watercolor), composition cues, mood. Avoid proper names/brands. Append: "without text, watermark, logo, caption".

Return STRICT JSON only with fields { coverPrompt: string, items: Array<{ index: number, text: string, prompt: string }> } where text is a short Chinese summary (<= 40 汉字) of that paragraph.

Title (Chinese): ${title || ''}
Body (Chinese):\n${content}`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You output ONLY valid minified JSON using standard ASCII quotes, no trailing commas. All image prompts MUST be English and concrete.' },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 1400,
  })

  const text = completion.choices[0]?.message?.content || '{}'
  let parsed: any
  try { parsed = JSON.parse(text) } catch { parsed = { coverPrompt: '主题封面', items: [] } }
  const paragraphPrompts = (parsed.items || []).map((it: any, i: number) => ({ index: it.index ?? i, prompt: String(it.prompt || ''), text: String(it.text || '') }))
  return { coverPrompt: String(parsed.coverPrompt || '主题封面'), paragraphPrompts }
}

export interface GeneratedImage {
  index: number
  url: string
}

export async function generateImageWithFal(prompt: string, opts?: { width?: number; height?: number; guidance_scale?: number; steps?: number }): Promise<string> {
  const apiKey = process.env.FAL_KEY
  const endpoint = process.env.FAL_MODEL_ENDPOINT || 'https://fal.run/fal-ai/flux/schnell'
  if (!apiKey) throw new Error('缺少 FAL_KEY')

  const guidance = opts?.guidance_scale ?? Number(process.env.FAL_GUIDANCE_SCALE || 3.5)
  const stepsEnv = Number(process.env.FAL_NUM_INFERENCE_STEPS || 12)
  const stepsInput = typeof opts?.steps === 'number' ? opts.steps : stepsEnv
  const steps = Math.min(12, Math.max(1, Math.floor(stepsInput))) // schnell 最大 12 步，最小 1 步
  const width = opts?.width ?? Number(process.env.FAL_WIDTH || 896)
  const height = opts?.height ?? Number(process.env.FAL_HEIGHT || 504)

  // 确保尺寸是 8 的倍数（FAL 要求）
  const adjustedWidth = Math.floor(width / 8) * 8
  const adjustedHeight = Math.floor(height / 8) * 8

  const requestBody = {
    prompt,
    guidance_scale: guidance,
    num_inference_steps: steps,
    width: adjustedWidth,
    height: adjustedHeight,
  }

  console.log('FAL API 请求:', { endpoint, prompt, width: adjustedWidth, height: adjustedHeight, guidance, steps })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('FAL API 错误详情:', { status: res.status, statusText: res.statusText, body: errorText })
    throw new Error(`FAL API 错误: ${res.status} - ${res.statusText}\n${errorText}`)
  }
  const json: any = await res.json()
  const url = json?.images?.[0]?.url || json?.data?.image?.url || json?.image?.url || json?.output?.[0]?.url
  if (!url) throw new Error('FAL 返回缺少图片URL')
  return url
}

// 统一导出（仅 FAL）
export async function generateImage(prompt: string, opts?: { width?: number; height?: number; guidance_scale?: number; steps?: number }): Promise<string> {
  return generateImageWithFal(prompt, opts)
}

export function injectImagesIntoMarkdown(originalContent: string, images: GeneratedImage[], paragraphs: Array<{ index: number; text: string }>): string {
  const parts = paragraphs.length > 0 ? paragraphs.map(p => p.text) : originalContent.split(/\n\n+/)
  const lines: string[] = []
  for (let i = 0; i < parts.length; i++) {
    lines.push(parts[i])
    const img = images.find(im => im.index === i)
    if (img) {
      lines.push(`\n![配图](${img.url})\n`)
    }
  }
  return lines.join('\n\n')
}
