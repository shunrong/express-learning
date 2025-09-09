const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const router = express.Router();

// 认证中间件
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// 添加用户信息到所有页面
const addUserToLocals = async (req, res, next) => {
    res.locals.currentUser = null; // 默认值
    
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.currentUser = user ? user.toJSON() : null;
        } catch (error) {
            console.error('获取用户信息错误:', error);
            res.locals.currentUser = null;
        }
    }
    next();
};

router.use(addUserToLocals);

// 首页
router.get('/', async (req, res) => {
    try {
        let stats = null;
        let recentTasks = [];
        
        if (req.session.userId) {
            // 获取当前用户的统计信息
            stats = await Task.getStatistics(req.session.userId);
            // 获取最近的任务
            recentTasks = await Task.findByUserId(req.session.userId, { limit: 5 });
        }
        
        res.render('index', {
            title: '任务管理系统',
            stats,
            recentTasks
        });
    } catch (error) {
        console.error('首页加载错误:', error);
        res.render('index', {
            title: '任务管理系统',
            stats: null,
            recentTasks: [],
            error: '加载数据失败'
        });
    }
});

// 登录页面
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', {
        title: '用户登录'
    });
});

// 注册页面
router.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', {
        title: '用户注册'
    });
});

// 仪表盘
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const stats = await Task.getStatistics(req.session.userId);
        const recentTasks = await Task.findByUserId(req.session.userId, { limit: 10 });
        
        res.render('dashboard', {
            title: '仪表盘',
            stats,
            recentTasks
        });
    } catch (error) {
        console.error('仪表盘加载错误:', error);
        res.render('dashboard', {
            title: '仪表盘',
            stats: null,
            recentTasks: [],
            error: '加载数据失败'
        });
    }
});

// 任务列表页面
router.get('/tasks', requireAuth, async (req, res) => {
    try {
        const { status, priority, search, page = 1 } = req.query;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        const options = {
            limit,
            offset,
            status,
            priority
        };

        let tasks;
        if (search) {
            tasks = await Task.search(search, { ...options, user_id: req.session.userId });
        } else {
            tasks = await Task.findByUserId(req.session.userId, options);
        }
        
        res.render('tasks/list', {
            title: '任务列表',
            tasks,
            filters: { status, priority, search },
            pagination: {
                page: parseInt(page),
                limit,
                hasNext: tasks.length === limit,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('任务列表加载错误:', error);
        res.render('tasks/list', {
            title: '任务列表',
            tasks: [],
            error: '加载任务列表失败'
        });
    }
});

// 创建任务页面
router.get('/tasks/new', requireAuth, (req, res) => {
    res.render('tasks/form', {
        title: '创建新任务',
        task: null,
        isEdit: false
    });
});

// 编辑任务页面
router.get('/tasks/:id/edit', requireAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).render('404', {
                title: '任务不存在',
                message: '您要编辑的任务不存在'
            });
        }

        // 检查权限
        if (task.user_id !== req.session.userId) {
            return res.status(403).render('error', {
                title: '权限不足',
                message: '您没有权限编辑此任务'
            });
        }
        
        res.render('tasks/form', {
            title: '编辑任务',
            task: task.toJSON(),
            isEdit: true
        });
    } catch (error) {
        console.error('加载编辑任务页面错误:', error);
        res.status(500).render('error', {
            title: '服务器错误',
            message: '加载编辑页面失败'
        });
    }
});

// 任务详情页面
router.get('/tasks/:id', requireAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).render('404', {
                title: '任务不存在',
                message: '您查看的任务不存在'
            });
        }

        // 检查权限（这里允许查看，但可以根据需要调整）
        if (task.user_id !== req.session.userId) {
            return res.status(403).render('error', {
                title: '权限不足',
                message: '您没有权限查看此任务'
            });
        }
        
        res.render('tasks/detail', {
            title: `任务: ${task.title}`,
            task: task.toJSON()
        });
    } catch (error) {
        console.error('加载任务详情错误:', error);
        res.status(500).render('error', {
            title: '服务器错误',
            message: '加载任务详情失败'
        });
    }
});

// 用户设置页面
router.get('/settings', requireAuth, (req, res) => {
    res.render('settings', {
        title: '用户设置'
    });
});

// 关于页面
router.get('/about', (req, res) => {
    res.render('about', {
        title: '关于系统'
    });
});

// 文件上传演示页面
router.get('/upload-demo', requireAuth, (req, res) => {
    res.render('upload-demo', {
        title: '文件上传演示'
    });
});

module.exports = router;
