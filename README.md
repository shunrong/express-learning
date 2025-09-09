# Express任务管理系统 - 全栈学习项目

一个基于Node.js和Express框架构建的完整任务管理应用，涵盖了现代Web开发的核心技术和最佳实践。

## 🎯 项目概述

这个项目是为学习Express.js而设计的综合性实战项目，包含了：

- **后端**：基于Express.js的RESTful API
- **前端**：使用EJS模板引擎和Bootstrap 5的响应式界面
- **数据库**：JSON数据库（易于理解和调试）
- **认证**：基于Session的用户认证系统
- **文件上传**：支持头像上传的文件管理
- **CRUD操作**：完整的增删改查功能

## 🚀 快速开始

### 环境要求

- Node.js 14+ 
- npm 6+

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd express-learning
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务器**
```bash
# 开发模式（推荐）
npm run dev

# 或者生产模式
npm start
```

4. **访问应用**
```
http://localhost:3000
```

### 默认账户

- **用户名**: admin
- **密码**: 123456

## 📁 项目结构

```
express-learning/
├── app.js                  # 主应用文件
├── package.json           # 项目配置和依赖
├── controllers/           # 控制器层
│   ├── userController.js  # 用户控制器
│   └── taskController.js  # 任务控制器
├── models/               # 数据模型层
│   ├── User.js           # 用户模型
│   └── Task.js           # 任务模型
├── routes/               # 路由层
│   ├── userRoutes.js     # 用户API路由
│   ├── taskRoutes.js     # 任务API路由
│   ├── pageRoutes.js     # 页面路由
│   └── uploadRoutes.js   # 文件上传路由
├── middleware/           # 中间件
│   └── upload.js         # 文件上传中间件
├── database/             # 数据库
│   ├── db.js             # 数据库连接和操作
│   └── task_manager.json # JSON数据库文件
├── views/                # EJS模板
│   ├── index.ejs         # 首页
│   ├── 404.ejs           # 404页面
│   └── auth/             # 认证相关页面
│       ├── login.ejs     # 登录页面
│       └── register.ejs  # 注册页面
└── public/               # 静态资源
    ├── css/
    │   └── style.css     # 自定义样式
    ├── js/
    │   └── app.js        # 前端JavaScript
    └── uploads/          # 上传文件目录
        └── avatars/      # 头像存储
```

## 🛠 技术栈

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 14+ | JavaScript运行环境 |
| Express.js | ^4.18.2 | Web应用框架 |
| node-json-db | ^2.3.0 | JSON数据库 |
| bcryptjs | ^2.4.3 | 密码加密 |
| express-session | ^1.17.3 | 会话管理 |
| multer | ^1.4.5 | 文件上传处理 |
| cors | ^2.8.5 | 跨域资源共享 |

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| EJS | ^3.1.9 | 模板引擎 |
| Bootstrap | 5.1.3 | CSS框架 |
| Bootstrap Icons | 1.7.2 | 图标库 |
| Vanilla JavaScript | ES6+ | 前端交互 |

## 📚 核心功能详解

### 1. 用户管理系统

#### 用户注册和登录
```javascript
// 用户注册API
POST /api/users/register
{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123"
}

// 用户登录API
POST /api/users/login
{
    "username": "testuser",
    "password": "password123"
}
```

#### 密码安全
- 使用bcrypt加密存储密码
- Session基的认证机制
- 密码强度验证（最少6位）

### 2. 任务管理系统

#### RESTful API设计
```javascript
// 获取所有任务
GET /api/tasks?page=1&limit=10&status=pending

// 创建新任务
POST /api/tasks
{
    "title": "学习Express",
    "description": "完成Express教程",
    "priority": "high",
    "status": "pending"
}

// 更新任务
PUT /api/tasks/1
{
    "status": "completed"
}

// 删除任务
DELETE /api/tasks/1
```

#### 任务状态管理
- **pending**: 待开始
- **in_progress**: 进行中  
- **completed**: 已完成

#### 优先级系统
- **high**: 高优先级（红色）
- **medium**: 中优先级（黄色）
- **low**: 低优先级（蓝色）

### 3. 文件上传功能

#### 头像上传
```javascript
// 上传头像API
POST /api/upload/avatar
Content-Type: multipart/form-data

// 支持的格式: JPG, PNG, GIF, WebP
// 文件大小限制: 2MB
```

#### 安全措施
- 文件类型验证
- 文件大小限制
- 安全的文件名生成
- 自动删除旧头像

### 4. 数据库设计

#### 用户表结构
```json
{
    "id": 1,
    "username": "admin",
    "email": "admin@example.com", 
    "password": "$2a$10$...",
    "avatar": "/uploads/avatars/avatar_1_1234567890.png",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 任务表结构
```json
{
    "id": 1,
    "title": "学习Express基础",
    "description": "完成Express框架的基础学习",
    "status": "completed",
    "priority": "high", 
    "user_id": 1,
    "due_date": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 开发指南

### 添加新的API端点

1. **创建控制器方法**
```javascript
// controllers/taskController.js
static async getTasksByPriority(req, res) {
    try {
        const { priority } = req.params;
        const tasks = await Task.findAll({ priority });
        res.json({ success: true, data: tasks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
```

2. **添加路由**
```javascript
// routes/taskRoutes.js
router.get('/priority/:priority', TaskController.getTasksByPriority);
```

### 添加新的页面

1. **创建EJS模板**
```html
<!-- views/tasks/statistics.ejs -->
<!DOCTYPE html>
<html>
<head>
    <title>任务统计</title>
    <!-- 引入CSS -->
</head>
<body>
    <!-- 页面内容 -->
</body>
</html>
```

2. **添加页面路由**
```javascript
// routes/pageRoutes.js
router.get('/statistics', requireAuth, async (req, res) => {
    const stats = await Task.getStatistics(req.session.userId);
    res.render('tasks/statistics', { title: '任务统计', stats });
});
```

### 数据库操作

#### 查询操作
```javascript
// 查询所有用户
const users = dbHelpers.getAllUsers();

// 根据ID查询用户
const user = dbHelpers.getUserById(1);

// 条件查询任务
const tasks = dbHelpers.getAllTasks({
    user_id: 1,
    status: 'pending',
    limit: 10,
    offset: 0
});
```

#### 创建和更新
```javascript
// 创建新用户
const newUser = dbHelpers.createUser({
    username: 'newuser',
    email: 'new@example.com',
    password: 'hashedPassword'
});

// 更新用户
const updatedUser = dbHelpers.updateUser(1, {
    email: 'updated@example.com'
});
```

## 🎨 前端开发

### Bootstrap组件使用

#### 表单组件
```html
<div class="mb-3">
    <label for="title" class="form-label">任务标题</label>
    <input type="text" class="form-control" id="title" required>
</div>
```

#### 卡片组件
```html
<div class="card">
    <div class="card-header">
        <h5 class="mb-0">任务详情</h5>
    </div>
    <div class="card-body">
        <p class="card-text">任务内容...</p>
    </div>
</div>
```

### JavaScript工具函数

#### AJAX请求
```javascript
// 使用内置的API工具
const result = await API.task.create({
    title: '新任务',
    description: '任务描述'
});

if (result.success) {
    Utils.showAlert('任务创建成功', 'success');
}
```

#### 显示提示消息
```javascript
// 成功消息
Utils.showAlert('操作成功', 'success');

// 错误消息  
Utils.showAlert('操作失败', 'danger');

// 警告消息
Utils.showAlert('请注意', 'warning');
```

## 🔒 安全性考虑

### 认证和授权
- Session基础的认证机制
- 路由级别的权限控制
- 密码强度验证和加密存储

### 文件上传安全
- 文件类型白名单验证
- 文件大小限制
- 安全的文件名生成
- 上传目录权限控制

### 数据验证
- 输入数据格式验证
- SQL注入防护（虽然使用JSON数据库）
- XSS防护

## 📊 性能优化

### 数据库优化
- 适当的分页查询
- 索引优化（如果使用SQL数据库）
- 数据缓存策略

### 前端优化
- 静态资源压缩
- 图片优化
- 懒加载实现
- CDN使用

## 🧪 测试

### API测试示例

使用curl测试用户登录：
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  -c cookies.txt
```

使用curl测试创建任务：
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"测试任务","description":"这是一个测试任务","priority":"high"}'
```

## 🚀 部署指南

### 环境变量配置
```bash
# .env文件
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
UPLOAD_MAX_SIZE=5242880
```

### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name "task-manager"

# 查看状态
pm2 status

# 查看日志
pm2 logs task-manager
```

### Docker部署
```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接错误
```
Error: Can't find dataPath: /users
```
**解决方案**: 删除 `database/task_manager.json` 文件并重启服务器

#### 2. 文件上传失败
```
Error: 文件大小超过限制
```
**解决方案**: 检查文件大小是否超过5MB限制

#### 3. Session无法保持
**解决方案**: 检查浏览器是否启用Cookie，确保域名配置正确

### 日志调试
```javascript
// 启用调试模式
DEBUG=express:* npm start

// 查看详细日志
console.log('调试信息:', data);
```

## 📖 学习路径建议

### 初级阶段
1. 理解Express基础概念
2. 掌握路由和中间件
3. 学习EJS模板语法
4. 了解RESTful API设计

### 中级阶段  
1. 深入理解MVC架构
2. 掌握数据库操作
3. 学习文件上传处理
4. 理解认证机制

### 高级阶段
1. 性能优化技巧
2. 安全性最佳实践
3. 错误处理策略
4. 部署和运维

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如果您有任何问题或建议，请随时联系：

- 项目作者：Express学习项目
- 邮箱：your-email@example.com
- GitHub：[项目地址](https://github.com/your-username/express-learning)

---

## 🎓 学习成果

通过完成这个项目，您将掌握：

- ✅ Express.js框架的核心概念和用法
- ✅ RESTful API的设计和实现
- ✅ 数据库操作和模型设计
- ✅ 用户认证和会话管理
- ✅ 文件上传和处理
- ✅ 前端模板引擎的使用
- ✅ 响应式Web设计
- ✅ 错误处理和调试技巧
- ✅ 项目结构和代码组织
- ✅ 部署和运维基础

这个项目涵盖了现代Web开发的主要技术栈，是学习Node.js和Express.js的理想实战项目！
