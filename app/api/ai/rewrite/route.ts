import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { performAIRewrite, AIRewriteRequest } from '@/lib/ai-rewrite'
import { RewriteStyle } from '@/lib/types'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 创建AI改写任务（支持单个或批量）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      materialId,
      materialIds,
      rewriteStyle = RewriteStyle.PROFESSIONAL,
      customPrompt,
    } = body

    // 批量模式
    if (Array.isArray(materialIds) && materialIds.length > 0) {
      const ids = materialIds
        .map((x: unknown) => Number(x))
        .filter((n: number) => Number.isFinite(n) && n > 0)

      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, error: '提供的素材ID无效' },
          { status: 400 }
        )
      }

      const results: Array<{ materialId: number; taskId?: number; error?: string }> = []

      // 顺序创建，避免速率限制；每个任务异步执行
      for (const id of ids) {
        try {
          // 获取素材
          const { data: material, error: materialError } = await supabase
            .from('materials')
            .select('*')
            .eq('id', id)
            .single()

          if (materialError || !material) {
            results.push({ materialId: id, error: '素材不存在' })
            continue
          }

          // 跳过进行中的同素材任务
          const { data: existingTask } = await supabase
            .from('ai_rewrite_tasks')
            .select('id, status')
            .eq('material_id', id)
            .in('status', ['pending', 'processing'])
            .single()

          if (existingTask) {
            results.push({ materialId: id, error: '已有进行中的任务' })
            continue
          }

          // 创建任务
          const { data: task, error: taskError } = await supabase
            .from('ai_rewrite_tasks')
            .insert({
              material_id: id,
              status: 'pending',
              original_content: material.title + (material.description ? '\n\n' + material.description : ''),
              rewrite_style: rewriteStyle,
              rewrite_prompt: customPrompt,
            })
            .select()
            .single()

          if (taskError || !task) {
            results.push({ materialId: id, error: '创建任务失败' })
            continue
          }

          // 异步执行
          processAIRewriteTask(task.id, material, rewriteStyle, customPrompt)
          results.push({ materialId: id, taskId: task.id })
        } catch (e) {
          results.push({ materialId: id, error: e instanceof Error ? e.message : '未知错误' })
        }
      }

      return NextResponse.json({ success: true, data: { results } })
    }

    // 单个模式
    if (!materialId) {
      return NextResponse.json(
        { success: false, error: '素材ID为必填字段' },
        { status: 400 }
      )
    }

    // 获取素材信息
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single()

    if (materialError || !material) {
      return NextResponse.json(
        { success: false, error: '素材不存在' },
        { status: 404 }
      )
    }

    // 检查是否已有进行中的改写任务
    const { data: existingTask } = await supabase
      .from('ai_rewrite_tasks')
      .select('id, status')
      .eq('material_id', materialId)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingTask) {
      return NextResponse.json(
        { success: false, error: '该素材已有进行中的改写任务' },
        { status: 409 }
      )
    }

    // 创建AI改写任务
    const { data: task, error: taskError } = await supabase
      .from('ai_rewrite_tasks')
      .insert({
        material_id: materialId,
        status: 'pending',
        original_content: material.title + (material.description ? '\n\n' + material.description : ''),
        rewrite_style: rewriteStyle,
        rewrite_prompt: customPrompt,
      })
      .select()
      .single()

    if (taskError) {
      throw taskError
    }

    // 异步执行AI改写
    processAIRewriteTask(task.id, material, rewriteStyle, customPrompt)

    return NextResponse.json({
      success: true,
      data: { taskId: task.id },
      message: 'AI改写任务已创建，正在处理中',
    })
  } catch (error) {
    console.error('创建AI改写任务失败:', error)
    return NextResponse.json(
      { success: false, error: '创建AI改写任务失败' },
      { status: 500 }
    )
  }
}

// 获取改写任务状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const taskId = searchParams.get('taskId')
    const materialIds = searchParams.getAll('materialId')

    // 允许无参获取最近任务列表

    let query = supabase
      .from('ai_rewrite_tasks')
      .select(`
        *,
        materials (
          id,
          title,
          source_url,
          source_platform
        )
      `)

    if (materialIds && materialIds.length > 1) {
      query = query.in('material_id', materialIds)
    } else if (materialId) {
      query = query.eq('material_id', materialId)
    } else if (taskId) {
      query = query.eq('id', taskId)
    }

    query = query.order('created_at', { ascending: false })

    // 默认返回最近20条
    let { data: tasks, error } = await query.limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: tasks || [],
    })
  } catch (error) {
    console.error('获取改写任务状态失败:', error)
    return NextResponse.json(
      { success: false, error: '获取改写任务状态失败' },
      { status: 500 }
    )
  }
}

// 异步处理AI改写任务
async function processAIRewriteTask(
  taskId: number,
  material: any,
  rewriteStyle: RewriteStyle,
  customPrompt?: string
) {
  try {
    // 更新任务状态为处理中
    await supabase
      .from('ai_rewrite_tasks')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // 准备AI改写请求
    const aiRequest: AIRewriteRequest = {
      content: material.title + (material.description ? '\n\n' + material.description : ''),
      title: material.title,
      description: material.description,
      style: rewriteStyle,
      customPrompt,
    }

    // 执行AI改写
    const startTime = Date.now()
    const aiResponse = await performAIRewrite(aiRequest)
    const processingTime = Date.now() - startTime

    if (aiResponse.success && aiResponse.rewrittenContent) {
      // 更新任务状态为完成
      await supabase
        .from('ai_rewrite_tasks')
        .update({
          status: 'completed',
          rewritten_content: aiResponse.rewrittenContent,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      // 创建改写结果记录
      await supabase
        .from('rewrite_results')
        .insert({
          task_id: taskId,
          material_id: material.id,
          original_title: material.title,
          rewritten_title: aiResponse.rewrittenTitle || material.title,
          original_description: material.description,
          rewritten_description: aiResponse.rewrittenDescription || material.description,
          original_content: aiRequest.content,
          rewritten_content: aiResponse.rewrittenContent,
          rewrite_style: rewriteStyle,
          word_count: aiResponse.rewrittenContent.length,
          processing_time_ms: processingTime,
        })

      console.log(`AI改写任务 ${taskId} 完成`)
    } else {
      // 更新任务状态为失败
      await supabase
        .from('ai_rewrite_tasks')
        .update({
          status: 'failed',
          error_message: aiResponse.error || 'AI改写失败',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      console.error(`AI改写任务 ${taskId} 失败:`, aiResponse.error)
    }
  } catch (error) {
    console.error(`AI改写任务 ${taskId} 处理异常:`, error)
    
    // 更新任务状态为失败
    await supabase
      .from('ai_rewrite_tasks')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '未知错误',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }
} 