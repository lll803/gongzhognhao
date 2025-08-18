import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '公众号内容管理系统',
  description: '一站式内容管理工具，支持内容采集、AI改写、内容管理、发布等功能',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Toaster>
          {children}
        </Toaster>
      </body>
    </html>
  )
} 