'use client'

import { useEffect, useState } from 'react'

export default function AIRewritePage() {
  const [pageInfo, setPageInfo] = useState({
    loaded: false,
    timestamp: '',
    userAgent: '',
    viewport: '',
    errors: [] as string[]
  })

  useEffect(() => {
    try {
      const info = {
        loaded: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        errors: [] as string[]
      }

      // 测试各种功能
      try {
        if (typeof fetch === 'undefined') {
          info.errors.push('fetch API 不可用')
        }
      } catch (e) {
        info.errors.push(`fetch 测试失败: ${e}`)
      }

      try {
        if (typeof localStorage === 'undefined') {
          info.errors.push('localStorage 不可用')
        }
      } catch (e) {
        info.errors.push(`localStorage 测试失败: ${e}`)
      }

      setPageInfo(info)
      console.log('AI改写页面诊断信息:', info)
    } catch (error) {
      console.error('页面加载错误:', error)
      setPageInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `页面加载错误: ${error}`]
      }))
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>AI改写页面诊断</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>页面状态</h2>
        <p>页面加载时间: {pageInfo.timestamp || '加载中...'}</p>
        <p>页面状态: {pageInfo.loaded ? '✅ 已加载' : '⏳ 加载中'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>系统信息</h2>
        <p>用户代理: {pageInfo.userAgent || '获取中...'}</p>
        <p>视口大小: {pageInfo.viewport || '获取中...'}</p>
      </div>

      {pageInfo.errors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#d32f2f', marginBottom: '10px' }}>错误信息</h2>
          <ul style={{ color: '#d32f2f' }}>
            {pageInfo.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>功能测试</h2>
        <button 
          onClick={() => alert('按钮点击测试成功！')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试按钮点击
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>下一步</h2>
        <p>如果这个页面正常显示，说明基本功能正常。接下来可以：</p>
        <ol style={{ marginLeft: '20px' }}>
          <li>添加样式和组件</li>
          <li>测试API连接</li>
          <li>添加业务逻辑</li>
        </ol>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #2196f3',
        borderRadius: '4px'
      }}>
        <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>调试提示</h3>
        <p style={{ color: '#1976d2', fontSize: '14px' }}>
          如果页面仍然不显示，请检查：
        </p>
        <ul style={{ color: '#1976d2', fontSize: '14px', marginLeft: '20px' }}>
          <li>浏览器控制台是否有错误</li>
          <li>网络请求是否正常</li>
          <li>路由配置是否正确</li>
          <li>Next.js 开发服务器是否正常运行</li>
        </ul>
      </div>
    </div>
  )
} 