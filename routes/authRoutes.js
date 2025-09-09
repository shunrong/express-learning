const express = require('express');
const passport = require('passport');
const router = express.Router();

// GitHub OAuth登录路由
router.get('/github', 
    passport.authenticate('github', { 
        scope: ['user:email'] // 请求用户邮箱权限
    })
);

// GitHub OAuth回调路由
router.get('/github/callback', (req, res, next) => {
    passport.authenticate('github', (err, user, info) => {
        if (err) {
            console.error('GitHub OAuth策略错误:', err);
            return res.redirect('/login?error=oauth_strategy_error');
        }
        
        if (!user) {
            console.error('GitHub OAuth未返回用户:', info);
            return res.redirect('/login?error=oauth_no_user');
        }
        
        // 手动登录用户
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('用户登录错误:', loginErr);
                return res.redirect('/login?error=login_error');
            }
            
            console.log('GitHub OAuth登录成功:', user.username);
            
            // 设置兼容现有系统的session字段
            req.session.userId = user.id;
            req.session.username = user.username;
            
            // 重定向到仪表盘
            res.redirect('/dashboard');
        });
    })(req, res, next);
});

// OAuth登出路由
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('登出错误:', err);
            return res.status(500).json({ 
                success: false, 
                error: '登出失败' 
            });
        }
        
        // 销毁session
        req.session.destroy((err) => {
            if (err) {
                console.error('销毁session错误:', err);
            }
            res.clearCookie('express.sid');
            res.redirect('/');
        });
    });
});

module.exports = router;
