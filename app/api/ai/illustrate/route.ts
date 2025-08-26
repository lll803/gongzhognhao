import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildIllustrationPlan, generateImageWithFal, injectImagesIntoMarkdown } from '@/lib/ai-images'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { materialId, taskId } = await req.json()
    if (!materialId) return NextResponse.json({ success: false, error: '缺少 materialId' }, { status: 400 })

    // 拉取改写结果（优先 rewrite_results，否则回退 ai_rewrite_tasks）
    const { data: result } = await supabase
      .from('rewrite_results')
      .select('*')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let title = result?.rewritten_title || result?.original_title
    let content = result?.rewritten_content || result?.original_content

    if (!content) {
      const { data: task } = await supabase
        .from('ai_rewrite_tasks')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      title = task?.rewritten_title || task?.original_title
      content = task?.rewritten_content || task?.original_content
    }

    if (!content) return NextResponse.json({ success: false, error: '未找到改写内容' }, { status: 404 })

    // 1) 生成配图计划
    const plan = await buildIllustrationPlan(title, content)

    // 2) 生成封面和分段插图
    const imgs: Array<{ index: number; url: string }> = []
    // 封面作为 index -1，使用公众号封面尺寸 900x383
    try {
      const coverUrl = await generateImageWithFal(plan.coverPrompt, { width: 900, height: 383 })
      imgs.push({ index: -1, url: coverUrl })
    } catch (e) {
      console.warn('封面生成失败', e)
    }

    // 分段生成（串行）
    for (const item of plan.paragraphPrompts) {
      try {
        const url = await generateImageWithFal(item.prompt)
        imgs.push({ index: item.index, url })
      } catch (e) {
        console.warn('段落图片生成失败', e)
      }
    }

    // 3) 将图片均匀插入到正文（markdown）
    const md = injectImagesIntoMarkdown(content, imgs.map((it) => ({ index: it.index, url: it.url })), plan.paragraphPrompts.map(p => ({ index: p.index, text: p.text })))

    // 3.5) 将封面与配图后的正文写回素材库，方便内容管理展示
    try {
      const coverUrl = imgs.find(i => i.index === -1)?.url || null
      const payload: any = {
        updated_at: new Date().toISOString(),
      }
      if (coverUrl) payload.thumbnail = coverUrl
      payload.extra_data = {
        ...(result?.extra_data || {}),
        illustrate: {
          cover: coverUrl,
          coverSize: { width: 900, height: 383 },
          images: imgs,
          plan,
          contentWithImages: md,
        }
      }
      await supabase
        .from('materials')
        .update(payload)
        .eq('id', materialId)
    } catch (e) {
      console.warn('保存配图结果到 materials 失败', e)
    }

    return NextResponse.json({ success: true, data: { cover: imgs.find(i => i.index === -1)?.url, coverSize: { width: 900, height: 383 }, images: imgs, contentWithImages: md, plan } })
  } catch (error) {
    console.error('AI配图失败:', error)
    return NextResponse.json({ success: false, error: 'AI配图失败' }, { status: 500 })
  }
}
