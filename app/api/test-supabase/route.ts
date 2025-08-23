import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // 测试基本连接
    const { data, error } = await supabaseAdmin
      .from('hotboards')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }
    
    console.log('Supabase connection successful')
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data: data
    })
    
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 })
  }
}
