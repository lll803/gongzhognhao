import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json()
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: '缺少图片URL列表' }, { status: 400 })
    }

    console.log(`开始重新托管 ${urls.length} 张图片...`)
    
    // 检查环境变量
    console.log('环境变量检查:')
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置')
    
    // 检查Supabase连接
    try {
      console.log('检查Supabase连接...')
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
      
      if (bucketError) {
        console.error('无法列出存储桶:', bucketError)
        return NextResponse.json({ 
          success: false, 
          error: `存储桶访问失败: ${bucketError.message}`,
          details: {
            message: bucketError.message,
            hint: '请检查SERVICE_ROLE_KEY权限和存储服务状态'
          }
        }, { status: 500 })
      }
      
      console.log('成功列出存储桶，数量:', buckets.length)
      
      const imagesBucket = buckets.find(b => b.id === 'images')
      if (!imagesBucket) {
        console.error('images存储桶不存在')
        console.log('可用的存储桶:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })))
        
        return NextResponse.json({ 
          success: false, 
          error: 'images存储桶不存在',
          details: {
            availableBuckets: buckets.map(b => ({ id: b.id, name: b.name, public: b.public })),
            hint: '请在Supabase控制台创建名为"images"的存储桶，并设置为Public'
          }
        }, { status: 500 })
      }
      
      console.log('images存储桶状态:', {
        id: imagesBucket.id,
        name: imagesBucket.name,
        public: imagesBucket.public,
        file_size_limit: imagesBucket.file_size_limit,
        allowed_mime_types: imagesBucket.allowed_mime_types
      })
      
      // 检查存储桶权限
      if (!imagesBucket.public) {
        console.warn('images存储桶不是公开的，这可能导致访问问题')
      }
      
    } catch (e) {
      console.error('检查存储桶失败:', e)
      return NextResponse.json({ 
        success: false, 
        error: '存储桶检查失败',
        details: {
          error: e instanceof Error ? e.message : String(e),
          hint: '请检查Supabase项目配置和网络连接'
        }
      }, { status: 500 })
    }

    const results: Record<string, string> = {}
    const failedUrls: string[] = []

    for (const url of urls) {
      try {
        console.log(`处理图片: ${url}`)
        
        // 添加重试机制
        let res: Response | null = null
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries && !res) {
          try {
            res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            })
            if (res.ok) break
          } catch (fetchError) {
            retryCount++
            console.warn(`图片下载重试 ${retryCount}/${maxRetries}:`, fetchError)
            if (retryCount >= maxRetries) {
              throw fetchError
            }
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
        
        if (!res || !res.ok) {
          throw new Error(`fetch failed after ${maxRetries} retries: ${res?.status}`)
        }
        
        const arrayBuf = await res.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        
        // 检查图片大小（限制在10MB以内）
        if (buf.length > 10 * 1024 * 1024) {
          throw new Error('图片文件过大（超过10MB）')
        }
        
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        
        // 验证是否为有效的图片类型
        if (!contentType.startsWith('image/')) {
          throw new Error(`无效的图片类型: ${contentType}`)
        }
        
        const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 16)
        const ext = guessExt(url, contentType)
        const path = `articles/${hash}.${ext}`

        console.log(`上传图片到路径: ${path}, 大小: ${buf.length} bytes, 类型: ${contentType}`)

        const { error: upErr } = await supabaseAdmin.storage
          .from('images')
          .upload(path, buf, { 
            contentType, 
            upsert: true,
            cacheControl: '3600' // 1小时缓存
          })
          
        if (upErr) {
          console.error('Supabase上传错误:', upErr)
          throw upErr
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('images')
          .getPublicUrl(path)
        
        results[url] = urlData.publicUrl
        
        console.log(`成功重新托管图片: ${url} -> ${urlData.publicUrl}`)
      } catch (e) {
        console.error(`重新托管图片失败 ${url}:`, e)
        failedUrls.push(url)
        // 继续处理其他图片，不中断整个流程
      }
    }

    const successCount = Object.keys(results).length
    const totalCount = urls.length
    
    console.log(`重新托管完成: ${successCount}/${totalCount} 成功, ${failedUrls.length} 失败`)

    return NextResponse.json({ 
      success: true, 
      data: { 
        map: results,
        failed: failedUrls,
        total: totalCount,
        success: successCount
      } 
    })
  } catch (e) {
    console.error('图片重新托管API错误:', e)
    return NextResponse.json({ 
      success: false, 
      error: '重传失败',
      details: {
        error: e instanceof Error ? e.message : String(e),
        hint: '请检查控制台日志获取详细错误信息'
      }
    }, { status: 500 })
  }
}

function guessExt(url: string, contentType: string): string {
  const ct = contentType.toLowerCase()
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  const m = url.match(/\.(png|webp|gif|jpe?g)(?:\?|#|$)/i)
  return m?.[1]?.toLowerCase().replace('jpeg','jpg') || 'jpg'
}


