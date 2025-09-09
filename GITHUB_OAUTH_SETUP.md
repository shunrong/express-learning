# GitHub OAuth 配置指南

## 1. 在 GitHub 创建 OAuth 应用

1. 访问 GitHub，登录你的账户
2. 进入 **Settings** > **Developer settings** > **OAuth Apps**
3. 点击 **New OAuth App**
4. 填写应用信息：
   - **Application name**: `Express任务管理系统` (或任何你喜欢的名称)
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: `基于Express的任务管理系统，集成GitHub OAuth登录`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`

5. 点击 **Register application**

## 2. 获取应用凭据

创建成功后，你会看到：
- **Client ID**: 一个公开的标识符
- **Client Secret**: 一个私密的密钥（点击 Generate a new client secret 生成）

## 3. 配置应用

### 方式一：使用环境变量（推荐）
在项目根目录创建 `.env` 文件：
```bash
GITHUB_CLIENT_ID=你的GitHub Client ID
GITHUB_CLIENT_SECRET=你的GitHub Client Secret
APP_URL=http://localhost:3000
SESSION_SECRET=你的session密钥
```

### 方式二：直接修改配置文件
编辑 `config/oauth.js` 文件，替换以下内容：
```javascript
module.exports = {
    github: {
        clientID: '你的GitHub Client ID',
        clientSecret: '你的GitHub Client Secret',
        callbackURL: 'http://localhost:3000/auth/github/callback'
    },
    session: {
        secret: '你的session密钥'
    }
};
```

## 4. 启动应用

```bash
npm start
```

## 5. 测试 GitHub 登录

1. 访问 `http://localhost:3000/login`
2. 点击 "使用 GitHub 登录" 按钮
3. 跳转到 GitHub 授权页面
4. 授权后会自动跳转回应用并登录成功

## 6. 功能特性

### 🔗 账户绑定
- 如果 GitHub 邮箱与现有本地账户相同，会自动绑定
- 绑定后用户可以使用 GitHub 或本地密码登录

### 👤 新用户创建
- 首次使用 GitHub 登录会自动创建新账户
- 用户名取自 GitHub 用户名
- 头像取自 GitHub 头像

### 🔒 安全性
- OAuth 用户没有密码，只能通过 GitHub 登录
- 支持传统 session 和 OAuth 混合认证
- 自动处理用户信息同步

## 7. 数据库变更

系统已自动添加以下字段到用户表：
- `github_id`: GitHub 用户 ID
- `github_username`: GitHub 用户名
- `provider`: 认证提供商（'local' 或 'github'）

## 8. 生产环境部署

部署到生产环境时，需要：
1. 在 GitHub OAuth 应用中添加生产环境 URL
2. 更新 `APP_URL` 环境变量
3. 设置 `NODE_ENV=production`
4. 使用 HTTPS（GitHub OAuth 要求）

## 注意事项

- ⚠️ Client Secret 必须保密，不要提交到代码仓库
- 🔄 回调 URL 必须与 GitHub 应用配置完全一致
- 📧 GitHub 用户必须有公开或已验证的邮箱地址
- 🌐 生产环境必须使用 HTTPS
