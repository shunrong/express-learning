const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const oauthConfig = require('./oauth');

// GitHub OAuth策略配置
passport.use(new GitHubStrategy({
    clientID: oauthConfig.github.clientID,
    clientSecret: oauthConfig.github.clientSecret,
    callbackURL: oauthConfig.github.callbackURL,
    // 添加调试和兼容性选项
    passReqToCallback: false,
    scope: ['user:email'],
    userAgent: 'express-learning-app'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('GitHub OAuth回调，用户信息:', {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            email: profile.emails ? profile.emails[0].value : null
        });

        // 尝试通过GitHub ID查找现有用户
        let user = await User.findByGithubId(profile.id);
        
        if (user) {
            // 用户已存在，直接返回
            console.log('找到现有GitHub用户:', user.username);
            return done(null, user);
        }

        // 检查是否已有相同邮箱的用户
        if (profile.emails && profile.emails.length > 0) {
            const existingUser = await User.findByEmail(profile.emails[0].value);
            if (existingUser) {
                // 如果是本地用户，则绑定GitHub账户
                if (existingUser.provider === 'local') {
                    await existingUser.update({
                        github_id: profile.id,
                        github_username: profile.username,
                        provider: 'github'
                    });
                    console.log('已绑定GitHub账户到现有用户:', existingUser.username);
                    return done(null, existingUser);
                }
            }
        }

        // 创建新的GitHub用户
        user = await User.createFromGithub(profile);
        console.log('创建新GitHub用户:', user.username);
        
        return done(null, user);
    } catch (error) {
        console.error('GitHub OAuth错误:', error);
        return done(error, null);
    }
}));

// 序列化用户信息到session
passport.serializeUser((user, done) => {
    console.log('序列化用户:', user.id, user.username);
    done(null, user.id);
});

// 从session反序列化用户信息
passport.deserializeUser(async (id, done) => {
    try {
        console.log('反序列化用户ID:', id);
        const user = await User.findById(id);
        if (user) {
            console.log('反序列化成功:', user.username);
        } else {
            console.log('未找到用户ID:', id);
        }
        done(null, user);
    } catch (error) {
        console.error('反序列化用户错误:', error);
        done(error, null);
    }
});

module.exports = passport;
