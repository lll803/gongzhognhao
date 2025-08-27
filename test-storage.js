// 测试Supabase存储权限的脚本
// 在Node.js环境中运行: node test-storage.js

const { createClient } = require('@supabase/supabase-js')

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请设置环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testStorage() {
  console.log('开始测试Supabase存储权限...')
  
  try {
    // 1. 测试列出存储桶
    console.log('\n1. 测试列出存储桶...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ 列出存储桶失败:', bucketError)
      return
    }
    
    console.log('✅ 存储桶列表:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })))
    
    // 2. 检查images存储桶
    const imagesBucket = buckets.find(b => b.id === 'images')
    if (!imagesBucket) {
      console.error('❌ images存储桶不存在')
      return
    }
    
    console.log('✅ images存储桶状态:', {
      id: imagesBucket.id,
      name: imagesBucket.name,
      public: imagesBucket.public,
      file_size_limit: imagesBucket.file_size_limit,
      allowed_mime_types: imagesBucket.allowed_mime_types
    })
    
    // 3. 测试上传小文件
    console.log('\n2. 测试上传文件...')
    const testContent = 'Hello, this is a test file for storage permissions!'
    const testBuffer = Buffer.from(testContent, 'utf-8')
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload('test-permissions.txt', testBuffer, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ 上传测试文件失败:', uploadError)
      return
    }
    
    console.log('✅ 上传测试文件成功')
    
    // 4. 测试获取公共URL
    console.log('\n3. 测试获取公共URL...')
    const { data: urlData, error: urlError } = await supabase.storage
      .from('images')
      .getPublicUrl('test-permissions.txt')
    
    if (urlError) {
      console.error('❌ 获取公共URL失败:', urlError)
      return
    }
    
    console.log('✅ 公共URL:', urlData.publicUrl)
    
    // 5. 测试删除测试文件
    console.log('\n4. 测试删除文件...')
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove(['test-permissions.txt'])
    
    if (deleteError) {
      console.error('❌ 删除测试文件失败:', deleteError)
      return
    }
    
    console.log('✅ 删除测试文件成功')
    
    // 6. 测试列出文件
    console.log('\n5. 测试列出文件...')
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list('articles', { limit: 10 })
    
    if (listError) {
      console.error('❌ 列出文件失败:', listError)
      return
    }
    
    console.log('✅ 文件列表:', files.map(f => ({ name: f.name, size: f.metadata?.size })))
    
    console.log('\n🎉 所有存储权限测试通过！')
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 运行测试
testStorage()
