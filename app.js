// 首先加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('./config/passport');
const path = require('path');

// 导入路由
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const pageRoutes = require('./routes/pageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');

// 导入并初始化文件上传
const { initUpload } = require('./middleware/upload');
initUpload();

// 导入并初始化数据库
const { initDatabase } = require('./database/db');
initDatabase();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session配置 - 使用SQLite持久化存储
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './database',
        table: 'sessions'
    }),
    secret: 'express-learning-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'express.sid', // session cookie名称
    cookie: { 
        secure: false, // 开发环境设为false，生产环境应该为true
        httpOnly: true, // 防止XSS攻击
        maxAge: 24 * 60 * 60 * 1000 // 默认24小时（可以通过"记住我"延长到30天）
    }
}));

// Passport中间件
app.use(passport.initialize());
app.use(passport.session());

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 路由配置
app.use('/', pageRoutes);           // 页面路由
app.use('/api/users', userRoutes);  // 用户API路由
app.use('/api/tasks', taskRoutes);  // 任务API路由
app.use('/api/upload', uploadRoutes); // 文件上传API路由
app.use('/auth', authRoutes);       // OAuth认证路由

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: err.message 
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '页面未找到',
        message: '抱歉，您访问的页面不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('Express任务管理系统已启动');
});

module.exports = app;
