# API 文档

## 目录
- [用户管理 API](#用户管理-api)
- [任务管理 API](#任务管理-api)
- [文件上传 API](#文件上传-api)
- [错误处理](#错误处理)

---

## 用户管理 API

### 1. 用户注册
- **URL**: `POST /api/users/register`
- **描述**: 注册新用户账户
- **请求体**:
```json
{
    "username": "string (3-20字符)",
    "email": "string (有效邮箱格式)",
    "password": "string (最少6字符)"
}
```
- **成功响应** (201):
```json
{
    "success": true,
    "message": "注册成功",
    "data": {
        "id": 1,
        "username": "newuser",
        "email": "user@example.com",
        "avatar": "/uploads/default-avatar.png",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }
}
```

### 2. 用户登录
- **URL**: `POST /api/users/login`
- **描述**: 用户登录获取会话
- **请求体**:
```json
{
    "username": "string",
    "password": "string"
}
```
- **成功响应** (200):
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "avatar": "/uploads/default-avatar.png"
    }
}
```

### 3. 用户登出
- **URL**: `POST /api/users/logout`
- **描述**: 用户登出销毁会话
- **认证**: 需要登录
- **成功响应** (200):
```json
{
    "success": true,
    "message": "登出成功"
}
```

### 4. 获取当前用户信息
- **URL**: `GET /api/users/me`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要登录
- **成功响应** (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "avatar": "/uploads/avatars/avatar_1_1234567890.png",
        "task_count": 5,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }
}
```

### 5. 获取所有用户
- **URL**: `GET /api/users`
- **描述**: 获取用户列表（管理员功能）
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
- **成功响应** (200):
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "avatar": "/uploads/default-avatar.png",
            "created_at": "2024-01-01T00:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1
    }
}
```

### 6. 根据ID获取用户
- **URL**: `GET /api/users/:id`
- **描述**: 获取指定用户的详细信息
- **成功响应** (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "avatar": "/uploads/default-avatar.png",
        "task_count": 5,
        "created_at": "2024-01-01T00:00:00.000Z"
    }
}
```

### 7. 更新用户信息
- **URL**: `PUT /api/users/:id`
- **描述**: 更新用户信息
- **请求体**:
```json
{
    "username": "string (可选)",
    "email": "string (可选)",
    "password": "string (可选，会自动加密)"
}
```
- **成功响应** (200):
```json
{
    "success": true,
    "message": "用户更新成功",
    "data": {
        "id": 1,
        "username": "updated_user",
        "email": "updated@example.com",
        "avatar": "/uploads/default-avatar.png",
        "updated_at": "2024-01-01T12:00:00.000Z"
    }
}
```

### 8. 删除用户
- **URL**: `DELETE /api/users/:id`
- **描述**: 删除用户账户（同时删除相关任务）
- **成功响应** (200):
```json
{
    "success": true,
    "message": "用户删除成功"
}
```

---

## 任务管理 API

### 1. 获取所有任务
- **URL**: `GET /api/tasks`
- **描述**: 获取任务列表
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `status`: 任务状态 (`pending`, `in_progress`, `completed`)
  - `priority`: 优先级 (`low`, `medium`, `high`)
  - `user_id`: 用户ID
  - `sort_by`: 排序字段 (`created_at`, `updated_at`, `title`)
  - `sort_order`: 排序顺序 (`ASC`, `DESC`)
  - `search`: 搜索关键词
- **成功响应** (200):
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "学习Express基础",
            "description": "完成Express框架的基础学习",
            "status": "completed",
            "priority": "high",
            "user_id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "due_date": null,
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1
    },
    "filters": {
        "status": "completed",
        "priority": null,
        "user_id": null,
        "search": null
    }
}
```

### 2. 根据ID获取任务
- **URL**: `GET /api/tasks/:id`
- **描述**: 获取指定任务的详细信息
- **成功响应** (200):
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "学习Express基础",
        "description": "完成Express框架的基础学习",
        "status": "completed",
        "priority": "high",
        "user_id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "due_date": null,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }
}
```

### 3. 创建新任务
- **URL**: `POST /api/tasks`
- **描述**: 创建新任务
- **认证**: 需要登录
- **请求体**:
```json
{
    "title": "string (必需)",
    "description": "string (可选)",
    "status": "string (可选, 默认: pending)",
    "priority": "string (可选, 默认: medium)",
    "user_id": "number (可选, 默认: 当前用户)",
    "due_date": "string (可选, ISO日期格式)"
}
```
- **成功响应** (201):
```json
{
    "success": true,
    "message": "任务创建成功",
    "data": {
        "id": 4,
        "title": "新任务",
        "description": "任务描述",
        "status": "pending",
        "priority": "medium",
        "user_id": 1,
        "due_date": null,
        "created_at": "2024-01-01T12:00:00.000Z",
        "updated_at": "2024-01-01T12:00:00.000Z"
    }
}
```

### 4. 更新任务
- **URL**: `PUT /api/tasks/:id`
- **描述**: 更新任务信息
- **认证**: 需要登录，只能更新自己的任务
- **请求体**:
```json
{
    "title": "string (可选)",
    "description": "string (可选)",
    "status": "string (可选)",
    "priority": "string (可选)",
    "due_date": "string (可选)"
}
```
- **成功响应** (200):
```json
{
    "success": true,
    "message": "任务更新成功",
    "data": {
        "id": 1,
        "title": "更新的任务标题",
        "status": "in_progress",
        "updated_at": "2024-01-01T12:00:00.000Z"
    }
}
```

### 5. 删除任务
- **URL**: `DELETE /api/tasks/:id`
- **描述**: 删除任务
- **认证**: 需要登录，只能删除自己的任务
- **成功响应** (200):
```json
{
    "success": true,
    "message": "任务删除成功"
}
```

### 6. 获取当前用户的任务
- **URL**: `GET /api/tasks/my`
- **描述**: 获取当前登录用户的任务列表
- **认证**: 需要登录
- **查询参数**: 与获取所有任务相同
- **成功响应**: 格式与获取所有任务相同

### 7. 获取指定用户的任务
- **URL**: `GET /api/tasks/user/:userId`
- **描述**: 获取指定用户的任务列表
- **查询参数**: 与获取所有任务相同
- **成功响应**: 格式与获取所有任务相同

### 8. 搜索任务
- **URL**: `GET /api/tasks/search`
- **描述**: 根据关键词搜索任务
- **查询参数**:
  - `q`: 搜索关键词 (必需)
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `user_id`: 用户ID (可选)
- **成功响应** (200):
```json
{
    "success": true,
    "data": [...],
    "search": {
        "term": "Express",
        "results": 2
    },
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 2
    }
}
```

### 9. 获取任务统计
- **URL**: `GET /api/tasks/statistics`
- **描述**: 获取任务统计信息
- **查询参数**:
  - `userId`: 用户ID (可选, 不提供则获取全局统计)
- **成功响应** (200):
```json
{
    "success": true,
    "data": {
        "total": 10,
        "pending": 3,
        "in_progress": 2,
        "completed": 5,
        "high_priority": 2,
        "medium_priority": 6,
        "low_priority": 2
    }
}
```

### 10. 批量更新任务
- **URL**: `PATCH /api/tasks/batch`
- **描述**: 批量更新多个任务的状态
- **认证**: 需要登录
- **请求体**:
```json
{
    "taskIds": [1, 2, 3],
    "updateData": {
        "status": "completed"
    }
}
```
- **成功响应** (200):
```json
{
    "success": true,
    "message": "成功更新 3 个任务",
    "data": [...],
    "errors": []
}
```

---

## 文件上传 API

### 1. 上传头像
- **URL**: `POST /api/upload/avatar`
- **描述**: 上传用户头像
- **认证**: 需要登录
- **Content-Type**: `multipart/form-data`
- **文件字段**: `avatar`
- **限制**:
  - 支持格式: JPG, PNG, GIF, WebP
  - 最大大小: 2MB
- **成功响应** (200):
```json
{
    "success": true,
    "message": "头像上传成功",
    "data": {
        "avatar": "/uploads/avatars/avatar_1_1234567890.png",
        "file": {
            "filename": "avatar_1_1234567890.png",
            "originalname": "my-avatar.png",
            "mimetype": "image/png",
            "size": 102400,
            "url": "/uploads/avatars/avatar_1_1234567890.png"
        }
    }
}
```

### 2. 上传单个文件
- **URL**: `POST /api/upload/single`
- **描述**: 上传单个文件
- **认证**: 需要登录
- **Content-Type**: `multipart/form-data`
- **文件字段**: `file`
- **限制**:
  - 支持格式: 图片, PDF, Word文档, 文本文件
  - 最大大小: 5MB
- **成功响应** (200):
```json
{
    "success": true,
    "message": "文件上传成功",
    "data": {
        "file": {
            "filename": "1234567890_987654321.pdf",
            "originalname": "document.pdf",
            "mimetype": "application/pdf",
            "size": 1024000,
            "url": "/uploads/documents/1234567890_987654321.pdf"
        }
    }
}
```

### 3. 上传多个文件
- **URL**: `POST /api/upload/multiple`
- **描述**: 上传多个文件
- **认证**: 需要登录
- **Content-Type**: `multipart/form-data`
- **文件字段**: `files`
- **限制**:
  - 最多5个文件
  - 每个文件最大5MB
- **成功响应** (200):
```json
{
    "success": true,
    "message": "成功上传 2 个文件",
    "data": {
        "files": [
            {
                "filename": "1234567890_111111111.jpg",
                "originalname": "photo1.jpg",
                "mimetype": "image/jpeg",
                "size": 512000,
                "url": "/uploads/images/1234567890_111111111.jpg"
            },
            {
                "filename": "1234567890_222222222.png",
                "originalname": "photo2.png", 
                "mimetype": "image/png",
                "size": 768000,
                "url": "/uploads/images/1234567890_222222222.png"
            }
        ],
        "count": 2
    }
}
```

### 4. 删除文件
- **URL**: `DELETE /api/upload/file`
- **描述**: 删除上传的文件
- **认证**: 需要登录
- **请求体**:
```json
{
    "filePath": "/uploads/images/1234567890_111111111.jpg"
}
```
- **成功响应** (200):
```json
{
    "success": true,
    "message": "文件删除成功"
}
```

### 5. 获取上传信息
- **URL**: `GET /api/upload/info`
- **描述**: 获取文件上传配置信息
- **认证**: 需要登录
- **成功响应** (200):
```json
{
    "success": true,
    "data": {
        "maxFileSize": "5MB",
        "maxFiles": 5,
        "allowedTypes": [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ],
        "uploadUrl": {
            "single": "/api/upload/single",
            "multiple": "/api/upload/multiple",
            "avatar": "/api/upload/avatar"
        }
    }
}
```

---

## 错误处理

### 标准错误响应格式
```json
{
    "success": false,
    "error": "错误描述",
    "message": "详细错误信息"
}
```

### 常见HTTP状态码

| 状态码 | 含义 | 示例场景 |
|--------|------|----------|
| 200 | 成功 | GET请求成功返回数据 |
| 201 | 创建成功 | POST请求成功创建资源 |
| 400 | 请求错误 | 参数验证失败、格式错误 |
| 401 | 未认证 | 需要登录但未提供有效会话 |
| 403 | 权限不足 | 尝试访问不属于自己的资源 |
| 404 | 资源不存在 | 请求的用户或任务不存在 |
| 409 | 资源冲突 | 用户名或邮箱已存在 |
| 500 | 服务器错误 | 数据库操作失败、系统异常 |

### 验证错误示例
```json
{
    "success": false,
    "error": "用户数据验证失败",
    "errors": [
        "用户名至少需要3个字符",
        "请输入有效的邮箱地址",
        "密码至少需要6个字符"
    ]
}
```

### 认证错误示例
```json
{
    "success": false,
    "error": "需要登录才能访问此资源"
}
```

### 权限错误示例
```json
{
    "success": false,
    "error": "没有权限更新此任务"
}
```

### 资源不存在错误示例
```json
{
    "success": false,
    "error": "任务不存在"
}
```

---

## 认证机制

### Session认证
- 使用Express Session进行会话管理
- 登录成功后设置`req.session.userId`
- 登出时销毁session
- Session在24小时后自动过期

### 认证中间件
```javascript
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            error: '需要登录才能访问此资源'
        });
    }
    next();
};
```

### Cookie设置
- httpOnly: true (防止XSS攻击)
- secure: false (开发环境，生产环境应设为true)
- maxAge: 24小时

---

## 使用示例

### JavaScript Fetch示例

#### 用户登录
```javascript
const login = async (username, password) => {
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 重要：包含cookie
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('登录成功:', result.data);
            // 重定向到仪表盘
            window.location.href = '/dashboard';
        } else {
            console.error('登录失败:', result.error);
        }
    } catch (error) {
        console.error('请求失败:', error);
    }
};
```

#### 创建任务
```javascript
const createTask = async (taskData) => {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(taskData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('任务创建成功:', result.data);
            // 刷新任务列表
            loadTasks();
        } else {
            console.error('创建失败:', result.error);
        }
    } catch (error) {
        console.error('请求失败:', error);
    }
};
```

#### 文件上传
```javascript
const uploadAvatar = async (file) => {
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch('/api/upload/avatar', {
            method: 'POST',
            credentials: 'include',
            body: formData // 不要设置Content-Type，让浏览器自动设置
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('头像上传成功:', result.data.avatar);
            // 更新页面上的头像显示
            updateAvatarDisplay(result.data.avatar);
        } else {
            console.error('上传失败:', result.error);
        }
    } catch (error) {
        console.error('上传失败:', error);
    }
};
```

### curl命令示例

#### 用户注册
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### 用户登录并保存Cookie
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

#### 使用Cookie创建任务
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "新任务",
    "description": "任务描述",
    "priority": "high"
  }'
```

#### 上传文件
```bash
curl -X POST http://localhost:3000/api/upload/avatar \
  -b cookies.txt \
  -F "avatar=@/path/to/your/image.jpg"
```

---

本API文档涵盖了Express任务管理系统的所有可用接口。如有疑问，请参考源代码或联系开发者。
