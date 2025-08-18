// 自定义错误类
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// 业务逻辑错误
export class BusinessError extends AppError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode, true)
  }
}

// 验证错误
export class ValidationError extends AppError {
  public errors: any[]

  constructor(message: string, errors: any[] = []) {
    super(message, 400, true)
    this.errors = errors
  }
}

// 认证错误
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401, true)
  }
}

// 授权错误
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, true)
  }
}

// 资源不存在错误
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(message, 404, true)
  }
}

// 冲突错误
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, true)
  }
}

// 错误处理函数
export function handleError(error: any) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      ...(error instanceof ValidationError && { errors: error.errors })
    }
  }

  // 处理未知错误
  console.error('未知错误:', error)
  
  return {
    success: false,
    error: '系统内部错误',
    statusCode: 500
  }
}

// 异步错误包装器
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : '未知错误',
        500,
        false
      )
    }
  }
} 