const express = require('express');
const TaskController = require('../controllers/taskController');
const router = express.Router();

// 认证中间件
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            error: '需要登录才能访问此资源'
        });
    }
    next();
};

// 任务统计（公开）
router.get('/statistics', TaskController.getTaskStatistics);

// 搜索任务
router.get('/search', TaskController.searchTasks);

// 获取当前用户的任务
router.get('/my', requireAuth, TaskController.getCurrentUserTasks);

// 批量更新任务
router.patch('/batch', requireAuth, TaskController.batchUpdateTasks);

// 基础CRUD路由
router.get('/', TaskController.getAllTasks);            // 获取所有任务
router.post('/', TaskController.createTask);            // 创建新任务
router.get('/:id', TaskController.getTaskById);         // 根据ID获取任务
router.put('/:id', TaskController.updateTask);          // 更新任务
router.delete('/:id', TaskController.deleteTask);       // 删除任务

// 用户相关的任务路由
router.get('/user/:userId', TaskController.getUserTasks); // 获取指定用户的任务

module.exports = router;
