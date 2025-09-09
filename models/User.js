const { dbHelpers } = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.avatar = data.avatar;
        this.github_id = data.github_id;
        this.github_username = data.github_username;
        this.provider = data.provider || 'local';
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // 创建新用户
    static async create(userData) {
        try {
            const newUserData = {
                username: userData.username,
                email: userData.email,
                avatar: userData.avatar || '/uploads/default-avatar.png',
                provider: userData.provider || 'local'
            };

            // 只有本地用户才需要加密密码
            if (userData.password && userData.provider !== 'github') {
                newUserData.password = await bcrypt.hash(userData.password, 10);
            }

            // OAuth相关字段
            if (userData.github_id) {
                newUserData.github_id = userData.github_id;
                newUserData.github_username = userData.github_username;
                newUserData.provider = 'github';
            }

            const newUser = await dbHelpers.createUser(newUserData);
            return new User(newUser);
        } catch (error) {
            throw new Error('创建用户失败: ' + error.message);
        }
    }

    // 创建GitHub用户
    static async createFromGithub(githubProfile) {
        try {
            const userData = {
                username: githubProfile.username || githubProfile.displayName,
                email: githubProfile.emails && githubProfile.emails[0] ? githubProfile.emails[0].value : `${githubProfile.username}@github.local`,
                avatar: githubProfile.photos && githubProfile.photos[0] ? githubProfile.photos[0].value : '/uploads/default-avatar.png',
                github_id: githubProfile.id,
                github_username: githubProfile.username,
                provider: 'github'
            };

            return await User.create(userData);
        } catch (error) {
            throw new Error('创建GitHub用户失败: ' + error.message);
        }
    }

    // 根据ID查找用户
    static async findById(id) {
        try {
            const userData = await dbHelpers.getUserById(id);
            return userData ? new User(userData) : null;
        } catch (error) {
            throw new Error('查找用户失败: ' + error.message);
        }
    }

    // 根据用户名查找用户
    static async findByUsername(username) {
        try {
            const userData = await dbHelpers.getUserByUsername(username);
            return userData ? new User(userData) : null;
        } catch (error) {
            throw new Error('查找用户失败: ' + error.message);
        }
    }

    // 根据邮箱查找用户
    static async findByEmail(email) {
        try {
            const userData = await dbHelpers.getUserByEmail(email);
            return userData ? new User(userData) : null;
        } catch (error) {
            throw new Error('查找用户失败: ' + error.message);
        }
    }

    // 根据GitHub ID查找用户
    static async findByGithubId(githubId) {
        try {
            const userData = await dbHelpers.getUserByGithubId(githubId);
            return userData ? new User(userData) : null;
        } catch (error) {
            throw new Error('查找用户失败: ' + error.message);
        }
    }

    // 获取所有用户
    static async findAll(limit = 50, offset = 0) {
        try {
            const usersData = await dbHelpers.getAllUsers(limit, offset);
            return usersData.map(userData => new User(userData));
        } catch (error) {
            throw new Error('获取用户列表失败: ' + error.message);
        }
    }

    // 更新用户信息
    async update(updateData) {
        try {
            // 过滤掉id字段
            const { id, ...filteredData } = updateData;
            
            if (Object.keys(filteredData).length === 0) {
                throw new Error('没有要更新的字段');
            }

            const updatedUser = dbHelpers.updateUser(this.id, filteredData);
            
            // 更新当前实例的属性
            Object.assign(this, updatedUser);
            
            return this;
        } catch (error) {
            throw new Error('更新用户失败: ' + error.message);
        }
    }

    // 更新密码
    async updatePassword(newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await this.update({ password: hashedPassword });
        } catch (error) {
            throw new Error('更新密码失败: ' + error.message);
        }
    }

    // 验证密码
    async validatePassword(password) {
        try {
            // OAuth用户没有密码，无法验证
            if (this.provider !== 'local' || !this.password) {
                return false;
            }
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw new Error('密码验证失败: ' + error.message);
        }
    }

    // 删除用户
    async delete() {
        try {
            return dbHelpers.deleteUser(this.id);
        } catch (error) {
            throw new Error('删除用户失败: ' + error.message);
        }
    }

    // 获取用户的任务数量
    async getTaskCount() {
        try {
            return dbHelpers.getUserTaskCount(this.id);
        } catch (error) {
            throw new Error('获取任务数量失败: ' + error.message);
        }
    }

    // 序列化用户数据（移除敏感信息）
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }

    // 验证用户数据
    static validate(userData) {
        const errors = [];

        if (!userData.username || userData.username.length < 3) {
            errors.push('用户名至少需要3个字符');
        }

        if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) {
            errors.push('请输入有效的邮箱地址');
        }

        if (!userData.password || userData.password.length < 6) {
            errors.push('密码至少需要6个字符');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = User;