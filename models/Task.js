const { dbHelpers } = require('../database/db');

class Task {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.status = data.status;
        this.priority = data.priority;
        this.user_id = data.user_id;
        this.due_date = data.due_date;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // 如果有用户信息（连接查询的结果）
        this.username = data.username;
        this.email = data.email;
    }

    // 创建新任务
    static async create(taskData) {
        try {
            const newTaskData = {
                title: taskData.title,
                description: taskData.description || null,
                status: taskData.status || 'pending',
                priority: taskData.priority || 'medium',
                user_id: taskData.user_id,
                due_date: taskData.due_date || null
            };

            const newTask = await dbHelpers.createTask(newTaskData);
            return new Task(newTask);
        } catch (error) {
            throw new Error('创建任务失败: ' + error.message);
        }
    }

    // 根据ID查找任务
    static async findById(id) {
        try {
            const taskData = await dbHelpers.getTaskById(id);
            if (!taskData) {
                return null;
            }

            // SQLite JOIN查询已经包含用户信息
            return new Task(taskData);
        } catch (error) {
            throw new Error('查找任务失败: ' + error.message);
        }
    }

    // 获取所有任务
    static async findAll(options = {}) {
        try {
            const tasks = await dbHelpers.getAllTasks(options);
            return tasks.map(task => new Task(task));
        } catch (error) {
            throw new Error('获取任务列表失败: ' + error.message);
        }
    }

    // 根据用户ID获取任务
    static async findByUserId(userId, options = {}) {
        try {
            const allOptions = { ...options, user_id: userId };
            return await Task.findAll(allOptions);
        } catch (error) {
            throw new Error('获取用户任务失败: ' + error.message);
        }
    }

    // 搜索任务
    static async search(searchTerm, options = {}) {
        try {
            const tasks = await dbHelpers.searchTasks(searchTerm, options);
            return tasks.map(task => new Task(task));
        } catch (error) {
            throw new Error('搜索任务失败: ' + error.message);
        }
    }

    // 更新任务
    async update(updateData) {
        try {
            // 过滤掉id字段
            const { id, ...filteredData } = updateData;
            
            if (Object.keys(filteredData).length === 0) {
                throw new Error('没有要更新的字段');
            }

            const updatedTask = await dbHelpers.updateTask(this.id, filteredData);
            
            // 更新当前实例的属性
            Object.assign(this, updatedTask);
            
            return this;
        } catch (error) {
            throw new Error('更新任务失败: ' + error.message);
        }
    }

    // 删除任务
    async delete() {
        try {
            return await dbHelpers.deleteTask(this.id);
        } catch (error) {
            throw new Error('删除任务失败: ' + error.message);
        }
    }

    // 获取任务统计信息
    static async getStatistics(userId = null) {
        try {
            return await dbHelpers.getTaskStatistics(userId);
        } catch (error) {
            throw new Error('获取任务统计失败: ' + error.message);
        }
    }

    // 验证任务数据
    static validate(taskData) {
        const errors = [];

        if (!taskData.title || taskData.title.trim().length < 1) {
            errors.push('任务标题不能为空');
        }

        if (taskData.title && taskData.title.length > 255) {
            errors.push('任务标题不能超过255个字符');
        }

        if (taskData.status && !['pending', 'in_progress', 'completed'].includes(taskData.status)) {
            errors.push('任务状态无效');
        }

        if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
            errors.push('任务优先级无效');
        }

        if (!taskData.user_id) {
            errors.push('必须指定任务所属用户');
        }

        if (taskData.due_date && isNaN(new Date(taskData.due_date))) {
            errors.push('截止日期格式无效');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 序列化任务数据
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            user_id: this.user_id,
            due_date: this.due_date,
            created_at: this.created_at,
            updated_at: this.updated_at,
            username: this.username,
            email: this.email
        };
    }
}

module.exports = Task;