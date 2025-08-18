import mongoose, { Schema, Document } from 'mongoose'
import { Article, Platform, PublishStatus, RewriteStyle } from '@/lib/types'

export interface ArticleDocument extends Article, Document {}

const ArticleSchema = new Schema<ArticleDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500
  },
  sourceUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v)
      },
      message: 'URL格式不正确'
    }
  },
  sourcePlatform: {
    type: String,
    enum: Object.values(Platform),
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  publishStatus: {
    type: String,
    enum: Object.values(PublishStatus),
    default: PublishStatus.DRAFT
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  },
  aiRewrittenContent: {
    type: String
  },
  aiRewriteStyle: {
    type: String,
    enum: Object.values(RewriteStyle)
  },
  aiRewritePrompt: {
    type: String
  }
}, {
  timestamps: true
})

// 创建索引
ArticleSchema.index({ title: 'text', content: 'text', summary: 'text' })
ArticleSchema.index({ sourcePlatform: 1, createdAt: -1 })
ArticleSchema.index({ category: 1, publishStatus: 1 })
ArticleSchema.index({ tags: 1 })

// 更新时自动设置updatedAt
ArticleSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Article || mongoose.model<ArticleDocument>('Article', ArticleSchema) 