# 📋 文件上传 Content-Type 完整指南

## 🎯 核心概念

### 什么是 Content-Type？
Content-Type 是 HTTP 请求头，告诉服务器请求体的数据格式。在文件上传中，它决定了服务器如何解析和处理上传的数据。

## 📊 上传方式详细对比

### 1. multipart/form-data 上传

#### 🔧 技术原理
```
POST /api/upload/single HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[文件二进制数据]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

#### ✅ 适用场景
- **单文件上传** (`/api/upload/single`)
- **多文件上传** (`/api/upload/multiple`) 
- **头像上传** (`/api/upload/avatar`)
- **文件大小**: < 100MB

#### 💻 前端实现
```javascript
// 方式1: FormData (推荐)
const formData = new FormData();
formData.append('file', fileObject);

fetch('/api/upload/single', {
    method: 'POST',
    body: formData  // 浏览器自动设置 Content-Type
});

// 方式2: 手动设置 (不推荐)
fetch('/api/upload/single', {
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=...'
    },
    body: formData
});
```

#### ⚠️ 重要注意事项
- **不要手动设置** Content-Type，让浏览器自动处理
- 浏览器会自动生成 boundary 分隔符
- 支持同时上传文件和其他表单数据

---

### 2. application/json + multipart/form-data 混合

#### 🔧 技术原理 (分片上传)
```
// 第1步: 初始化 (application/json)
POST /api/upload/chunk/init HTTP/1.1
Content-Type: application/json

{
  "filename": "large-file.zip",
  "fileSize": 104857600,
  "chunkSize": 2097152
}

// 第2步: 上传分片 (multipart/form-data)
POST /api/upload/chunk/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="chunk"

[分片二进制数据]
------WebKitFormBoundary...
Content-Disposition: form-data; name="uploadId"

upload_1234567890_abc123
------WebKitFormBoundary...--

// 第3步: 合并分片 (application/json)
POST /api/upload/chunk/merge HTTP/1.1
Content-Type: application/json

{
  "uploadId": "upload_1234567890_abc123",
  "filename": "large-file.zip"
}
```

#### ✅ 适用场景
- **大文件上传** (> 100MB)
- **需要断点续传**的场景
- **网络不稳定**的环境

#### 💻 前端实现
```javascript
// 1. 初始化分片上传
const initResponse = await fetch('/api/upload/chunk/init', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        chunkSize: CHUNK_SIZE
    })
});

// 2. 上传每个分片
for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', i);
    
    await fetch('/api/upload/chunk/upload', {
        method: 'POST',
        body: formData  // 自动设置 multipart/form-data
    });
}

// 3. 合并分片
await fetch('/api/upload/chunk/merge', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        uploadId: uploadId,
        filename: file.name
    })
});
```

---

## 📁 文件存储目录规则

### 目录结构
```
public/uploads/
├── avatars/          # 头像文件
│   ├── avatar_1_1234567890.jpg
│   └── avatar_2_1234567891.png
├── files/            # 通用文件
│   ├── file_1234567890.pdf
│   ├── chunk_1234567891.zip
│   └── multiple_1234567892.docx
└── temp/             # 临时文件
    └── chunks/       # 分片临时存储
        └── upload_123/
            ├── chunk_0
            ├── chunk_1
            └── ...
```

### 存储规则详解

#### 1. 头像上传 (`/uploads/avatars/`)
```javascript
// 文件命名: avatar_[用户ID]_[时间戳].[扩展名]
// 示例: avatar_1_1702345678901.jpg

// 特点:
- 会覆盖用户的旧头像
- 自动删除旧文件
- 只允许图片格式
- 大小限制: 2MB
```

#### 2. 单文件上传 (`/uploads/files/`)
```javascript
// 文件命名: file_[时间戳]_[随机数].[扩展名]
// 示例: file_1702345678901_789456.pdf

// 特点:
- 不会覆盖现有文件
- 支持所有文件格式
- 大小限制: 100MB
```

#### 3. 多文件上传 (`/uploads/files/`)
```javascript
// 文件命名: file_[时间戳]_[随机数].[扩展名]
// 每个文件独立命名

// 特点:
- 批量处理，每个文件独立存储
- 同时最多10个文件
- 每个文件最大100MB
```

#### 4. 分片上传 (`/uploads/files/`)
```javascript
// 临时存储: /temp/chunks/[uploadId]/chunk_[索引]
// 最终文件: chunk_[时间戳]_[随机字符].[扩展名]

// 特点:
- 先存储到临时目录
- 合并后移动到最终目录
- 自动清理临时文件
- 支持超大文件 (GB级)
```

---

## 🔄 为什么使用不同的 Content-Type？

### 1. multipart/form-data 的优势
- ✅ **浏览器原生支持**，无需额外处理
- ✅ **可以同时传输文件和表单数据**
- ✅ **自动处理二进制数据编码**
- ✅ **支持多文件上传**

### 2. application/json 的优势  
- ✅ **结构化数据传输**，易于解析
- ✅ **更好的错误处理**
- ✅ **支持复杂的元数据**
- ✅ **API设计更清晰**

### 3. 混合使用的原因
分片上传需要：
- **初始化阶段**: 传递文件元信息 → `application/json`
- **上传阶段**: 传输二进制分片 → `multipart/form-data`  
- **合并阶段**: 发送合并指令 → `application/json`

---

## 🛠️ 实际开发建议

### 选择上传方式的决策树
```
文件大小 < 10MB
├─ 单个文件 → 使用 /api/upload/single
└─ 多个文件 → 使用 /api/upload/multiple

文件大小 10MB - 100MB  
└─ 使用 /api/upload/single (可选择分片)

文件大小 > 100MB
└─ 必须使用分片上传 /api/upload/chunk/*

用户头像
└─ 使用 /api/upload/avatar
```

### Content-Type 最佳实践

#### ✅ 推荐做法
```javascript
// 1. FormData 让浏览器自动处理
const formData = new FormData();
formData.append('file', file);

fetch('/api/upload/single', {
    method: 'POST',
    body: formData  // 不设置 Content-Type
});

// 2. JSON 数据明确指定
fetch('/api/upload/chunk/init', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

#### ❌ 避免的错误
```javascript
// 错误1: 手动设置 multipart Content-Type
fetch('/api/upload/single', {
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data'  // ❌ 缺少 boundary
    },
    body: formData
});

// 错误2: 用错误的 Content-Type 传文件
fetch('/api/upload/single', {
    method: 'POST', 
    headers: {
        'Content-Type': 'application/json'  // ❌ 无法传输二进制文件
    },
    body: JSON.stringify({file: file})  // ❌ 无法序列化 File 对象
});
```

---

## 🧪 测试示例

### 测试不同上传方式
```bash
# 1. 头像上传测试
curl -X POST http://localhost:3000/api/upload/avatar \
  -H "Cookie: express.sid=..." \
  -F "avatar=@profile.jpg"

# 2. 单文件上传测试  
curl -X POST http://localhost:3000/api/upload/single \
  -H "Cookie: express.sid=..." \
  -F "file=@document.pdf"

# 3. 分片上传初始化测试
curl -X POST http://localhost:3000/api/upload/chunk/init \
  -H "Cookie: express.sid=..." \
  -H "Content-Type: application/json" \
  -d '{"filename":"large.zip","fileSize":104857600,"chunkSize":2097152}'
```

---

## 📚 总结

### 核心要点
1. **FormData + multipart/form-data**: 用于传输文件二进制数据
2. **JSON + application/json**: 用于传输结构化元数据  
3. **不要手动设置** multipart 的 Content-Type
4. **根据文件大小**选择合适的上传方式
5. **理解存储目录规则**，避免文件冲突

### 记忆口诀
- **小文件直传**: multipart/form-data
- **大文件分片**: JSON初始化 + multipart分片 + JSON合并
- **头像专用**: avatar字段 + avatars目录
- **通用文件**: file字段 + files目录

这样的设计既保证了**灵活性**，又确保了**性能**和**安全性**！🚀
