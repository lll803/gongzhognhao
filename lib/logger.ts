// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 日志配置
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  logFilePath?: string
}

// 默认配置
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: false
}

// 日志类
class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 格式化日志消息
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
    
    return `[${timestamp}] ${levelName}: ${message}${dataStr}`
  }

  // 检查是否应该记录该级别的日志
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  // 记录日志
  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, data)

    // 控制台输出
    if (this.config.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage)
          break
        case LogLevel.INFO:
          console.info(formattedMessage)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage)
          break
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage)
          break
      }
    }

    // 文件输出（这里可以扩展为写入文件）
    if (this.config.enableFile && this.config.logFilePath) {
      // TODO: 实现文件写入逻辑
    }
  }

  // 调试日志
  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  // 信息日志
  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  // 警告日志
  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  // 错误日志
  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data)
  }

  // 致命错误日志
  fatal(message: string, data?: any) {
    this.log(LogLevel.FATAL, message, data)
  }

  // 设置日志级别
  setLevel(level: LogLevel) {
    this.config.level = level
  }

  // 启用/禁用控制台输出
  setConsoleOutput(enabled: boolean) {
    this.config.enableConsole = enabled
  }

  // 启用/禁用文件输出
  setFileOutput(enabled: boolean, filePath?: string) {
    this.config.enableFile = enabled
    if (enabled && filePath) {
      this.config.logFilePath = filePath
    }
  }
}

// 创建默认日志实例
export const logger = new Logger()

// 导出Logger类供自定义使用
export { Logger }

// 便捷的日志函数
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => logger.error(message, data),
  fatal: (message: string, data?: any) => logger.fatal(message, data)
} 