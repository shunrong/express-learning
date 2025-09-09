const express = require('express');
const UserController = require('../controllers/userController');
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

// 公开路由（不需要认证）
router.post('/login', UserController.login);           // 用户登录
router.post('/register', UserController.register);     // 用户注册
router.post('/logout', UserController.logout);         // 用户登出

// 需要认证的路由
router.get('/me', requireAuth, UserController.getCurrentUser);      // 获取当前用户信息
router.put('/profile', requireAuth, UserController.updateProfile);  // 更新个人资料
router.put('/password', requireAuth, UserController.updatePassword);// 更新密码

// 管理员路由（简化版，这里暂时不做复杂的角色权限控制）
router.get('/', UserController.getAllUsers);           // 获取所有用户
router.get('/:id', UserController.getUserById);        // 根据ID获取用户
router.post('/', UserController.createUser);           // 创建新用户
router.put('/:id', UserController.updateUser);         // 更新用户
router.delete('/:id', UserController.deleteUser);      // 删除用户

module.exports = router;
