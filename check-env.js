// 检查环境变量配置
// 运行: node check-env.js

console.log('🔍 检查环境变量配置...')
console.log('')

// 检查关键环境变量
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

let allSet = true

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    // 隐藏敏感信息，只显示前10个字符
    const displayValue = value.length > 10 ? value.substring(0, 10) + '...' : value
    console.log(`✅ ${varName}: ${displayValue}`)
    
    // 检查格式
    if (varName === 'SUPABASE_URL' && !value.includes('supabase.co')) {
      console.log(`   ⚠️  警告: URL格式可能不正确，应该是 https://xxx.supabase.co`)
      allSet = false
    }
    
    if (varName === 'SUPABASE_SERVICE_ROLE_KEY' && !value.startsWith('eyJ')) {
      console.log(`   ⚠️  警告: SERVICE_ROLE_KEY格式可能不正确，应该以eyJ开头`)
      allSet = false
    }
  } else {
    console.log(`❌ ${varName}: 未设置`)
    allSet = false
  }
})

console.log('')

if (allSet) {
  console.log('🎉 所有必需的环境变量都已设置！')
  console.log('')
  console.log('下一步:')
  console.log('1. 运行诊断脚本: node debug-storage.js')
  console.log('2. 检查Supabase控制台中的存储桶配置')
  console.log('3. 测试图片重新托管功能')
} else {
  console.log('❌ 环境变量配置不完整')
  console.log('')
  console.log('请检查:')
  console.log('1. .env.local 文件是否存在')
  console.log('2. 环境变量名称是否正确')
  console.log('3. 值是否完整')
  console.log('')
  console.log('示例 .env.local 文件:')
  console.log('SUPABASE_URL=https://your-project-id.supabase.co')
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
}
