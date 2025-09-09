# 🔧 文件上传限制配置总结

## 📊 当前配置统一表

| 上传类型 | 文件大小限制 | 文件数量限制 | 支持格式 | 存储目录 |
|---------|-------------|-------------|----------|----------|
| **头像上传** | 2MB | 1个 | 图片格式 (jpg, png, gif, webp) | `/uploads/avatars/` |
| **单文件上传** | 100MB | 1个 | 几乎所有格式 | `/uploads/files/` |
| **多文件上传** | 100MB/文件 | 最多10个 | 几乎所有格式 | `/uploads/files/` |
| **分片上传** | 无限制 | 1个 | 几乎所有格式 | `/uploads/files/` |

## 🔧 技术实现配置

### 1. 头像上传配置
```javascript
// middleware/upload.js - avatar multer
limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
}
fileFilter: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
```

### 2. 通用文件上传配置
```javascript
// middleware/upload.js - upload multer  
limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // 最多10个文件
}
```

### 3. 错误提示配置
```javascript
// middleware/upload.js - handleUploadError
case 'LIMIT_FILE_SIZE':
    message = '文件大小超过限制（最大100MB）'; // 通用文件
    // 头像上传有单独的错误处理

case 'LIMIT_FILE_COUNT':
    message = '文件数量超过限制（最多10个）';
```

## ✅ 修复的问题

1. **错误提示不一致** - 统一为实际的限制大小
2. **页面显示错误** - 头像显示2MB，单文件显示100MB
3. **文档不一致** - 更新所有文档中的限制信息

## 🎯 使用建议

- **用户头像**: 2MB限制合理，头像不需要太大
- **单文件上传**: 100MB可以处理大部分文件
- **多文件上传**: 每个文件100MB，最多10个，总共最大1GB
- **分片上传**: 用于超大文件(>100MB)，无大小限制

## 🔄 配置变更历史

- ✅ 修复了错误提示中的5MB → 100MB
- ✅ 修复了页面显示中头像5MB → 2MB  
- ✅ 统一了多文件上传限制5个 → 10个
- ✅ 更新了所有相关文档
