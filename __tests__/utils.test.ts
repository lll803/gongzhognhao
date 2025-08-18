import { 
  formatDate, 
  formatRelativeTime, 
  truncateText, 
  generateId,
  getPlatformIcon,
  getPlatformName,
  validateUrl,
  sanitizeHtml
} from '../lib/utils'

describe('Utils Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('2024')
      expect(formatted).toContain('1月')
      expect(formatted).toContain('15')
    })

    it('should handle string date', () => {
      const dateStr = '2024-01-15T10:30:00Z'
      const formatted = formatDate(dateStr)
      expect(formatted).toContain('2024')
    })
  })

  describe('formatRelativeTime', () => {
    it('should show "刚刚" for recent time', () => {
      const now = new Date()
      const result = formatRelativeTime(now)
      expect(result).toBe('刚刚')
    })

    it('should show minutes ago', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      const result = formatRelativeTime(date)
      expect(result).toBe('30分钟前')
    })

    it('should show hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      const result = formatRelativeTime(date)
      expect(result).toBe('2小时前')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = '这是一个很长的文本，需要被截断'
      const result = truncateText(text, 10)
      expect(result).toBe('这是一个很长的文本，需要被截断...')
    })

    it('should not truncate short text', () => {
      const text = '短文本'
      const result = truncateText(text, 10)
      expect(result).toBe('短文本')
    })
  })

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1).toHaveLength(9)
      expect(id2).toHaveLength(9)
    })
  })

  describe('getPlatformIcon', () => {
    it('should return correct icons for platforms', () => {
      expect(getPlatformIcon('wechat')).toBe('💬')
      expect(getPlatformIcon('zhihu')).toBe('📚')
      expect(getPlatformIcon('baidu')).toBe('🔍')
      expect(getPlatformIcon('weibo')).toBe('📱')
      expect(getPlatformIcon('douyin')).toBe('🎵')
    })

    it('should return default icon for unknown platform', () => {
      expect(getPlatformIcon('unknown')).toBe('📄')
    })
  })

  describe('getPlatformName', () => {
    it('should return correct names for platforms', () => {
      expect(getPlatformName('wechat')).toBe('微信')
      expect(getPlatformName('zhihu')).toBe('知乎')
      expect(getPlatformName('baidu')).toBe('百度')
      expect(getPlatformName('weibo')).toBe('微博')
      expect(getPlatformName('douyin')).toBe('抖音')
    })

    it('should return default name for unknown platform', () => {
      expect(getPlatformName('unknown')).toBe('未知平台')
    })
  })

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://example.com')).toBe(true)
      expect(validateUrl('https://example.com/path')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false)
      expect(validateUrl('')).toBe(false)
      expect(validateUrl('ftp://example.com')).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>'
      const result = sanitizeHtml(html)
      expect(result).toBe('<p>Hello</p>')
    })

    it('should remove dangerous attributes', () => {
      const html = '<p onclick="alert(\'xss\')">Hello</p>'
      const result = sanitizeHtml(html)
      expect(result).toBe('<p>Hello</p>')
    })

    it('should remove javascript protocol', () => {
      const html = '<a href="javascript:alert(\'xss\')">Click</a>'
      const result = sanitizeHtml(html)
      expect(result).toBe('<a href="">Click</a>')
    })
  })
}) 