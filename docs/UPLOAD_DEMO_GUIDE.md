# 📁 文件上传功能演示指南

## 🎯 功能概览

我为你创建了一个完整的文件上传演示页面，包含以下高级功能：

### ✨ 核心功能
- **基础上传**: 单文件上传，支持拖拽
- **多文件上传**: 批量文件上传，实时进度显示
- **分片上传**: 大文件分片上传，支持断点续传
- **文件管理**: 已上传文件的查看和管理
- **API文档**: 详细的接口文档和示例代码

## 🚀 如何访问

1. **启动应用**: `npm start`
2. **登录系统**: 访问 http://localhost:3000/login
3. **进入演示**: 
   - 在仪表盘点击 **"文件上传演示"** 按钮
   - 或直接访问 http://localhost:3000/upload-demo

## 📋 功能详解

### 1. 基础上传 (`/api/upload/avatar`)
```javascript
// 请求参数
FormData: {
  avatar: File  // 文件对象
}

// 响应数据
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "filename": "avatar_1234567890.jpg",
    "originalName": "photo.jpg", 
    "size": 1024000,
    "url": "/uploads/avatars/avatar_1234567890.jpg",
    "mimeType": "image/jpeg",
    "uploadDate": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 多文件上传 (`/api/upload/multiple`)
```javascript
// 请求参数
FormData: {
  files: [File, File, File...]  // 文件数组
}

// 特性
- 支持同时上传最多10个文件
- 单文件最大50MB
- 实时进度显示
- 批量上传管理
```

### 3. 分片上传

#### 初始化分片 (`/api/upload/chunk/init`)
```javascript
POST /api/upload/chunk/init
{
  "filename": "large-file.zip",
  "fileSize": 104857600,    // 100MB
  "chunkSize": 2097152      // 2MB per chunk
}

// 响应
{
  "success": true,
  "data": {
    "uploadId": "upload_1234567890_abc123",
    "totalChunks": 50,
    "chunkSize": 2097152
  }
}
```

#### 上传分片 (`/api/upload/chunk/upload`)
```javascript
FormData: {
  chunk: Blob,              // 分片数据
  uploadId: string,         // 上传ID
  chunkIndex: number,       // 分片索引 (0-based)
  totalChunks: number       // 总分片数
}
```

#### 合并分片 (`/api/upload/chunk/merge`)
```javascript
POST /api/upload/chunk/merge
{
  "uploadId": "upload_1234567890_abc123",
  "filename": "large-file.zip"
}
```

### 4. 文件管理 (`/api/upload/files`)
```javascript
GET /api/upload/files

// 响应 - 获取所有已上传文件
{
  "success": true,
  "data": [
    {
      "filename": "file_1234567890.jpg",
      "originalName": "photo.jpg",
      "size": 1024000,
      "url": "/uploads/files/file_1234567890.jpg",
      "uploadDate": "2024-01-01T12:00:00.000Z",
      "mimeType": "image/jpeg",
      "type": "files"
    }
  ]
}
```

## 🔧 技术实现

### 前端技术
- **HTML5 File API**: 文件选择和读取
- **XMLHttpRequest**: 上传进度监控
- **Drag & Drop API**: 拖拽上传
- **Blob API**: 文件分片处理
- **Promise/Async**: 异步上传管理

### 后端技术  
- **Multer**: 文件上传中间件
- **Node.js Streams**: 大文件处理
- **File System**: 文件存储管理
- **Express Routes**: RESTful API

### 关键特性
- ✅ **断点续传**: 分片上传支持网络中断恢复
- ✅ **并发控制**: 可配置同时上传的分片数量
- ✅ **进度显示**: 实时显示上传进度
- ✅ **文件验证**: 类型和大小限制
- ✅ **错误处理**: 完善的错误提示和重试机制
- ✅ **安全性**: 用户权限验证和路径安全检查

## 📊 接口参数详解

### 上传限制
```javascript
// 基础上传
maxFileSize: 100MB
allowedTypes: [
  // 图片: jpg, png, gif, webp, bmp, svg
  // 文档: pdf, doc, docx, xls, xlsx, ppt, pptx  
  // 文本: txt, csv, html, css, js, json, xml, md
  // 压缩: zip, rar, 7z, tar, gz
  // 媒体: mp3, wav, mp4, avi, mov, webm
  // 代码: py, java, cpp, c, sql, log
  // 几乎所有常见格式！
]

// 多文件上传  
maxFiles: 10
maxFileSize: 100MB per file

// 分片上传
chunkSize: 1MB - 10MB (可配置)
concurrency: 1-5 (并发数)
支持GB级大文件上传！
```

### 错误处理
```javascript
// 常见错误类型
{
  "success": false,
  "error": "文件类型不支持",
  "code": "INVALID_FILE_TYPE"
}

{
  "success": false,
  "error": "文件大小超出限制", 
  "code": "FILE_TOO_LARGE"
}

{
  "success": false,
  "error": "分片上传不完整",
  "code": "INCOMPLETE_CHUNKS"
}
```

## 🎨 UI 特性

### 用户体验
- **拖拽上传**: 支持文件拖拽到上传区域
- **实时预览**: 图片文件自动预览
- **进度条**: 多层级进度显示（单文件+总体）
- **状态图标**: 上传状态的可视化反馈
- **文件管理**: 网格式文件浏览界面

### 响应式设计
- 完全响应式布局
- 移动设备优化
- Bootstrap 5 组件
- 现代化UI设计

## 🧪 测试建议

### 基础测试
1. **单文件上传**: 测试不同类型和大小的文件
2. **多文件上传**: 测试批量上传和进度显示
3. **拖拽功能**: 测试拖拽上传的交互

### 高级测试
1. **大文件分片**: 上传 > 50MB 的文件测试分片功能
2. **网络中断**: 在上传过程中断网测试恢复能力
3. **并发上传**: 测试多个文件同时上传的性能
4. **错误处理**: 测试各种错误情况的处理

### 性能测试
- 测试不同分片大小对上传速度的影响
- 测试不同并发数的性能表现
- 测试服务器在高并发下的稳定性

## 🔗 相关文件

### 前端文件
- `views/upload-demo.ejs` - 演示页面模板
- `public/js/upload-demo.js` - 前端上传逻辑
- `public/css/style.css` - 样式文件

### 后端文件
- `routes/uploadRoutes.js` - 上传API路由
- `routes/pageRoutes.js` - 页面路由
- `middleware/upload.js` - 上传中间件

### 目录结构
```
public/uploads/
├── avatars/          # 头像文件
├── files/            # 一般文件
temp/chunks/          # 分片临时目录
```

## 📚 学习要点

通过这个演示，你可以深入理解：

1. **文件上传的完整流程** - 从前端选择到后端存储
2. **进度监控实现** - XMLHttpRequest的progress事件
3. **分片上传原理** - 大文件如何拆分和重组
4. **并发控制策略** - 如何管理多个异步上传任务
5. **错误处理机制** - 各种异常情况的处理方案
6. **用户体验优化** - 拖拽、预览、状态反馈等

这是一个生产级别的文件上传解决方案，涵盖了现代Web应用中文件上传的所有核心功能！🚀
