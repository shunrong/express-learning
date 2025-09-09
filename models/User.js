const { dbHelpers } = require('../database/db');
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.avatar = data.avatar;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // 创建新用户
    static async create(userData) {
        try {
            // 密码加密
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const newUserData = {
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                avatar: userData.avatar || '/uploads/default-avatar.png'
            };

            const newUser = dbHelpers.createUser(newUserData);
            return new User(newUser);
        } catch (error) {
            throw new Error('创建用户失败: ' + error.message);
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