import { NextRequest, NextResponse } from 'next/server'

interface CollectBody {
  urls: string[]
  category?: string
  tags?: string[]
}

interface CollectedItemResult {
  url: string
  ok: boolean
  id?: number
  error?: string
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function extractBetween(source: string, startRe: RegExp, endRe: RegExp): string | undefined {
  const start = source.search(startRe)
  if (start === -1) return undefined
  const sliced = source.slice(start)
  const end = sliced.search(endRe)
  if (end === -1) return undefined
  return sliced.slice(0, end)
}

function getMetaContent(html: string, name: string): string | undefined {
  const re = new RegExp(`<meta[^>]+property=[\"']${name}[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>`, 'i')
  const m = html.match(re)
  return m?.[1]?.trim() || undefined
}

function getTagText(html: string, tag: string): string | undefined {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)<\\/${tag}>`, 'i'))
  return m?.[1]?.replace(/\s+/g, ' ')?.trim() || undefined
}

function extractImages(html: string): string[] {
  const images: string[] = []
  const imgRe = /<img\b[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*>/ig
  let m
  while ((m = imgRe.exec(html)) !== null) {
    if (m[1]) images.push(m[1])
  }
  return images
}

function extractFromWeChat(html: string, fallbackTitle: string) {
  const title = getMetaContent(html, 'og:title') || getTagText(html, 'title') || fallbackTitle
  const publishedAt = getMetaContent(html, 'article:published_time') || getTagText(html, 'publish_time')
  // Try to grab #js_content innerHTML
  let contentHtml = ''
  const jsContentMatch = html.match(/<div[^>]*id=["']js_content["'][^>]*>([\s\S]*?)<\/div>/i)
  if (jsContentMatch) contentHtml = jsContentMatch[1]
  if (!contentHtml) {
    const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    contentHtml = art?.[1] || ''
  }
  const images = extractImages(contentHtml || html)
  return { title, contentHtml, images, publishedAt }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CollectBody
    const urls = Array.from(new Set((body?.urls || []).map(u => String(u).trim()).filter(Boolean)))
    if (urls.length === 0) {
      return NextResponse.json({ success: false, error: '请提供至少一个有效链接' }, { status: 400 })
    }

    const category = body?.category || '采集'
    const tags = body?.tags || []
    const origin = req.nextUrl.origin

    const results: CollectedItemResult[] = []

    for (const url of urls) {
      try {
        const html = await fetchHtml(url)
        const { title, contentHtml, images, publishedAt } = extractFromWeChat(html, url)
        if (!title) throw new Error('标题为空')

        const resp = await fetch(`${origin}/api/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: '',
            sourceUrl: url,
            sourcePlatform: 'wechat',
            thumbnail: images[0],
            extraData: { publishedAt, images, full_content: contentHtml },
            category,
            tags,
          }),
        })
        const json = await resp.json().catch(() => null)
        if (!resp.ok || !json?.success) throw new Error(json?.error || `添加素材失败 HTTP ${resp.status}`)
        results.push({ url, ok: true, id: json?.data?.id })
      } catch (err: any) {
        console.error('collect failed:', url, err?.message)
        results.push({ url, ok: false, error: err?.message || '失败' })
      }
    }

    return NextResponse.json({ success: true, data: { results } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '采集失败' }, { status: 500 })
  }
}


