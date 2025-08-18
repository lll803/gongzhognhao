// MongoDB初始化脚本
db = db.getSiblingDB('gongzhonghao-cms');

// 创建用户
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'gongzhonghao-cms'
    }
  ]
});

// 创建集合
db.createCollection('articles');
db.createCollection('hot_items');
db.createCollection('wechat_accounts');
db.createCollection('ai_configs');
db.createCollection('scraping_configs');
db.createCollection('publish_logs');
db.createCollection('tags');
db.createCollection('categories');
db.createCollection('users');

// 创建索引
db.articles.createIndex({ "title": "text", "content": "text", "summary": "text" });
db.articles.createIndex({ "sourcePlatform": 1, "createdAt": -1 });
db.articles.createIndex({ "category": 1, "publishStatus": 1 });
db.articles.createIndex({ "tags": 1 });

db.hot_items.createIndex({ "platform": 1, "createdAt": -1 });
db.hot_items.createIndex({ "rank": 1 });
db.hot_items.createIndex({ "category": 1 });

db.wechat_accounts.createIndex({ "accountId": 1 }, { unique: true });
db.wechat_accounts.createIndex({ "isActive": 1 });

db.publish_logs.createIndex({ "articleId": 1 });
db.publish_logs.createIndex({ "accountId": 1 });
db.publish_logs.createIndex({ "status": 1, "createdAt": -1 });

db.tags.createIndex({ "name": 1 }, { unique: true });
db.categories.createIndex({ "name": 1 }, { unique: true });

// 插入示例数据
db.tags.insertMany([
  { name: '科技', color: '#3B82F6', articleCount: 0 },
  { name: '商业', color: '#10B981', articleCount: 0 },
  { name: '健康', color: '#F59E0B', articleCount: 0 },
  { name: '教育', color: '#8B5CF6', articleCount: 0 },
  { name: '娱乐', color: '#EC4899', articleCount: 0 }
]);

db.categories.insertMany([
  { name: '科技', description: '科技相关文章', articleCount: 0 },
  { name: '商业', description: '商业相关文章', articleCount: 0 },
  { name: '健康', description: '健康相关文章', articleCount: 0 },
  { name: '教育', description: '教育相关文章', articleCount: 0 },
  { name: '娱乐', description: '娱乐相关文章', articleCount: 0 }
]);

print('MongoDB初始化完成！'); 