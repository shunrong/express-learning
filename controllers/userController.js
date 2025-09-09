const User = require('../models/User');

class UserController {
    // 获取所有用户
    static async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;
            
            const users = await User.findAll(parseInt(limit), parseInt(offset));
            
            res.json({
                success: true,
                data: users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: users.length
                }
            });
        } catch (error) {
            console.error('获取用户列表错误:', error);
            res.status(500).json({
                success: false,
                error: '获取用户列表失败',
                message: error.message
            });
        }
    }

    // 根据ID获取用户
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            // 获取用户的任务数量
            const taskCount = await user.getTaskCount();
            
            res.json({
                success: true,
                data: {
                    ...user.toJSON(),
                    task_count: taskCount
                }
            });
        } catch (error) {
            console.error('获取用户错误:', error);
            res.status(500).json({
                success: false,
                error: '获取用户失败',
                message: error.message
            });
        }
    }

    // 创建新用户
    static async createUser(req, res) {
        try {
            const userData = req.body;
            
            // 验证用户数据
            const validation = User.validate(userData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: '用户数据验证失败',
                    errors: validation.errors
                });
            }

            // 检查用户名和邮箱是否已存在
            const existingUserByUsername = await User.findByUsername(userData.username);
            if (existingUserByUsername) {
                return res.status(409).json({
                    success: false,
                    error: '用户名已存在'
                });
            }

            const existingUserByEmail = await User.findByEmail(userData.email);
            if (existingUserByEmail) {
                return res.status(409).json({
                    success: false,
                    error: '邮箱已被注册'
                });
            }

            // 创建用户
            const newUser = await User.create(userData);
            
            res.status(201).json({
                success: true,
                message: '用户创建成功',
                data: newUser.toJSON()
            });
        } catch (error) {
            console.error('创建用户错误:', error);
            res.status(500).json({
                success: false,
                error: '创建用户失败',
                message: error.message
            });
        }
    }

    // 更新用户
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            // 如果要更新用户名或邮箱，检查是否已存在
            if (updateData.username && updateData.username !== user.username) {
                const existingUser = await User.findByUsername(updateData.username);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        error: '用户名已存在'
                    });
                }
            }

            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await User.findByEmail(updateData.email);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        error: '邮箱已被注册'
                    });
                }
            }

            // 如果要更新密码，需要特殊处理
            if (updateData.password) {
                await user.updatePassword(updateData.password);
                delete updateData.password; // 从updateData中移除，因为已经处理过了
            }

            // 更新其他字段
            if (Object.keys(updateData).length > 0) {
                await user.update(updateData);
            }
            
            res.json({
                success: true,
                message: '用户更新成功',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('更新用户错误:', error);
            res.status(500).json({
                success: false,
                error: '更新用户失败',
                message: error.message
            });
        }
    }

    // 删除用户
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            await user.delete();
            
            res.json({
                success: true,
                message: '用户删除成功'
            });
        } catch (error) {
            console.error('删除用户错误:', error);
            res.status(500).json({
                success: false,
                error: '删除用户失败',
                message: error.message
            });
        }
    }

    // 用户登录
    static async login(req, res) {
        try {
            const { username, password, rememberMe } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: '用户名和密码不能为空'
                });
            }

            // 查找用户
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: '用户名或密码错误'
                });
            }

            // 验证密码
            const isValidPassword = await user.validatePassword(password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: '用户名或密码错误'
                });
            }

            // 设置session
            req.session.userId = user.id;
            req.session.username = user.username;
            
            // 如果勾选了"记住我"，延长cookie过期时间
            if (rememberMe) {
                // 记住我：30天
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
            } else {
                // 不记住我：使用默认的24小时
                req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
            }
            
            res.json({
                success: true,
                message: '登录成功',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('登录错误:', error);
            res.status(500).json({
                success: false,
                error: '登录失败',
                message: error.message
            });
        }
    }

    // 用户注册
    static async register(req, res) {
        try {
            const userData = req.body;
            
            // 验证用户数据
            const validation = User.validate(userData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: '用户数据验证失败',
                    errors: validation.errors
                });
            }

            // 检查用户名和邮箱是否已存在
            const existingUserByUsername = await User.findByUsername(userData.username);
            if (existingUserByUsername) {
                return res.status(409).json({
                    success: false,
                    error: '用户名已存在'
                });
            }

            const existingUserByEmail = await User.findByEmail(userData.email);
            if (existingUserByEmail) {
                return res.status(409).json({
                    success: false,
                    error: '邮箱已被注册'
                });
            }

            // 创建用户
            const newUser = await User.create(userData);
            
            // 自动登录
            req.session.userId = newUser.id;
            req.session.username = newUser.username;
            
            res.status(201).json({
                success: true,
                message: '注册成功',
                data: newUser.toJSON()
            });
        } catch (error) {
            console.error('注册错误:', error);
            res.status(500).json({
                success: false,
                error: '注册失败',
                message: error.message
            });
        }
    }

    // 用户登出
    static async logout(req, res) {
        try {
            req.session.destroy((err) => {
                if (err) {
                    console.error('登出错误:', err);
                    return res.status(500).json({
                        success: false,
                        error: '登出失败'
                    });
                }
                
                res.json({
                    success: true,
                    message: '登出成功'
                });
            });
        } catch (error) {
            console.error('登出错误:', error);
            res.status(500).json({
                success: false,
                error: '登出失败',
                message: error.message
            });
        }
    }

    // 获取当前用户信息
    static async getCurrentUser(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    error: '未登录'
                });
            }

            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            const taskCount = await user.getTaskCount();
            
            res.json({
                success: true,
                data: {
                    ...user.toJSON(),
                    task_count: taskCount
                }
            });
        } catch (error) {
            console.error('获取当前用户错误:', error);
            res.status(500).json({
                success: false,
                error: '获取用户信息失败',
                message: error.message
            });
        }
    }

    // 更新个人资料
    static async updateProfile(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    error: '未登录'
                });
            }

            const { username, email } = req.body;
            const user = await User.findById(req.session.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            // 如果要更新用户名，检查是否已存在
            if (username && username !== user.username) {
                const existingUser = await User.findByUsername(username);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        error: '用户名已存在'
                    });
                }
            }

            // 如果要更新邮箱，检查是否已存在
            if (email && email !== user.email) {
                const existingUser = await User.findByEmail(email);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        error: '邮箱已被注册'
                    });
                }
            }

            // 更新用户信息
            const updateData = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;

            if (Object.keys(updateData).length > 0) {
                await user.update(updateData);
                // 更新session中的用户名
                if (username) {
                    req.session.username = username;
                }
            }
            
            res.json({
                success: true,
                message: '个人资料更新成功',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('更新个人资料错误:', error);
            res.status(500).json({
                success: false,
                error: '更新个人资料失败',
                message: error.message
            });
        }
    }

    // 更新密码
    static async updatePassword(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    error: '未登录'
                });
            }

            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: '当前密码和新密码不能为空'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: '新密码长度至少6个字符'
                });
            }

            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: '用户不存在'
                });
            }

            // 验证当前密码
            const isValidPassword = await user.validatePassword(currentPassword);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: '当前密码错误'
                });
            }

            // 更新密码
            await user.updatePassword(newPassword);
            
            res.json({
                success: true,
                message: '密码更新成功'
            });
        } catch (error) {
            console.error('更新密码错误:', error);
            res.status(500).json({
                success: false,
                error: '更新密码失败',
                message: error.message
            });
        }
    }
}

module.exports = UserController;
