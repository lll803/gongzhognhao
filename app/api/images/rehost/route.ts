import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json()
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: '缺少图片URL列表' }, { status: 400 })
    }

    const results: Record<string, string> = {}

    for (const url of urls) {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`fetch ${res.status}`)
        const arrayBuf = await res.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 16)
        const ext = guessExt(url, contentType)
        const path = `articles/${hash}.${ext}`

        const { error: upErr } = await supabaseAdmin.storage
          .from('images')
          .upload(path, buf, { contentType, upsert: true })
        if (upErr) throw upErr

        const { data } = supabaseAdmin.storage.from('images').getPublicUrl(path)
        results[url] = data.publicUrl
      } catch (e) {
        // 跳过失败的URL
      }
    }

    return NextResponse.json({ success: true, data: { map: results } })
  } catch (e) {
    return NextResponse.json({ success: false, error: '重传失败' }, { status: 500 })
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


