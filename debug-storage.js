// 诊断Supabase存储问题的脚本
// 运行: node debug-storage.js

const { createClient } = require('@supabase/supabase-js')

// 从环境变量获取配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 开始诊断Supabase存储问题...')
console.log('')

// 检查环境变量
console.log('1. 环境变量检查:')
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ 已设置' : '❌ 未设置'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ 已设置' : '❌ 未设置'}`)

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 环境变量缺失，请检查.env.local文件')
  process.exit(1)
}

// 检查URL格式
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ SUPABASE_URL格式不正确，应该是: https://xxx.supabase.co')
  process.exit(1)
}

console.log('✅ 环境变量检查通过')
console.log('')

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseStorage() {
  try {
    console.log('2. 测试Supabase连接...')
    
    // 测试基本连接
    const { data: profile, error: profileError } = await supabase.auth.getUser()
    if (profileError) {
      console.log('⚠️  认证测试失败（这是正常的，service role不需要认证）')
    } else {
      console.log('✅ 认证测试通过')
    }
    
    console.log('')
    console.log('3. 测试存储桶访问...')
    
    // 列出所有存储桶
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ 无法列出存储桶:', bucketError)
      console.log('')
      console.log('🔧 可能的原因:')
      console.log('   - SERVICE_ROLE_KEY权限不足')
      console.log('   - 存储服务未启用')
      console.log('   - 项目配置问题')
      return
    }
    
    console.log('✅ 成功列出存储桶')
    console.log('')
    console.log('4. 存储桶列表:')
    
    if (buckets.length === 0) {
      console.log('   ⚠️  没有找到任何存储桶')
    } else {
      buckets.forEach(bucket => {
        const status = bucket.public ? 'Public' : 'Private'
        console.log(`   📦 ${bucket.id} (${status})`)
        console.log(`      名称: ${bucket.name}`)
        console.log(`      大小限制: ${bucket.file_size_limit || '无限制'}`)
        console.log(`      允许类型: ${bucket.allowed_mime_types?.join(', ') || '所有'}`)
        console.log('')
      })
    }
    
    // 检查images存储桶
    const imagesBucket = buckets.find(b => b.id === 'images')
    if (!imagesBucket) {
      console.log('❌ 未找到images存储桶')
      console.log('')
      console.log('🔧 解决方案:')
      console.log('   1. 在Supabase控制台创建images存储桶')
      console.log('   2. 确保设置为Public')
      console.log('   3. 检查存储桶名称拼写')
      return
    }
    
    console.log('✅ 找到images存储桶')
    console.log('')
    console.log('5. 测试存储桶权限...')
    
    // 测试上传权限
    const testContent = 'Hello, this is a test file!'
    const testBuffer = Buffer.from(testContent, 'utf-8')
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload('test-permissions.txt', testBuffer, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ 上传测试失败:', uploadError)
      console.log('')
      console.log('🔧 可能的原因:')
      console.log('   - 存储桶权限策略配置错误')
      console.log('   - RLS策略阻止上传')
      console.log('   - 存储桶配置问题')
      return
    }
    
    console.log('✅ 上传测试成功')
    
    // 测试获取URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from('images')
      .getPublicUrl('test-permissions.txt')
    
    if (urlError) {
      console.error('❌ 获取公共URL失败:', urlError)
      return
    }
    
    console.log('✅ 获取公共URL成功')
    console.log(`   URL: ${urlData.publicUrl}`)
    
    // 清理测试文件
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove(['test-permissions.txt'])
    
    if (deleteError) {
      console.warn('⚠️  删除测试文件失败:', deleteError)
    } else {
      console.log('✅ 删除测试文件成功')
    }
    
    console.log('')
    console.log('🎉 所有测试通过！存储功能正常')
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error)
    console.log('')
    console.log('🔧 建议:')
    console.log('   1. 检查网络连接')
    console.log('   2. 验证Supabase项目状态')
    console.log('   3. 检查环境变量配置')
  }
}

// 运行诊断
diagnoseStorage()
