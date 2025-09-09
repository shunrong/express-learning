const Task = require('../models/Task');

class TaskController {
    // 获取所有任务
    static async getAllTasks(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                priority, 
                user_id, 
                sort_by, 
                sort_order,
                search 
            } = req.query;
            
            const offset = (page - 1) * limit;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                status,
                priority,
                user_id,
                sort_by,
                sort_order
            };

            let tasks;
            if (search) {
                tasks = await Task.search(search, options);
            } else {
                tasks = await Task.findAll(options);
            }
            
            res.json({
                success: true,
                data: tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: tasks.length
                },
                filters: {
                    status,
                    priority,
                    user_id,
                    search
                }
            });
        } catch (error) {
            console.error('获取任务列表错误:', error);
            res.status(500).json({
                success: false,
                error: '获取任务列表失败',
                message: error.message
            });
        }
    }

    // 根据ID获取任务
    static async getTaskById(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);
            
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: '任务不存在'
                });
            }
            
            res.json({
                success: true,
                data: task.toJSON()
            });
        } catch (error) {
            console.error('获取任务错误:', error);
            res.status(500).json({
                success: false,
                error: '获取任务失败',
                message: error.message
            });
        }
    }

    // 创建新任务
    static async createTask(req, res) {
        try {
            const taskData = req.body;
            
            // 如果session中有用户ID且请求中没有指定user_id，使用session中的用户ID
            if (req.session.userId && !taskData.user_id) {
                taskData.user_id = req.session.userId;
            }
            
            // 验证任务数据
            const validation = Task.validate(taskData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: '任务数据验证失败',
                    errors: validation.errors
                });
            }

            // 创建任务
            const newTask = await Task.create(taskData);
            
            res.status(201).json({
                success: true,
                message: '任务创建成功',
                data: newTask.toJSON()
            });
        } catch (error) {
            console.error('创建任务错误:', error);
            res.status(500).json({
                success: false,
                error: '创建任务失败',
                message: error.message
            });
        }
    }

    // 更新任务
    static async updateTask(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: '任务不存在'
                });
            }

            // 检查权限：只有任务创建者可以更新任务（除非是管理员）
            if (req.session.userId && task.user_id !== req.session.userId) {
                return res.status(403).json({
                    success: false,
                    error: '没有权限更新此任务'
                });
            }

            // 验证更新数据
            if (updateData.title !== undefined || updateData.status !== undefined || 
                updateData.priority !== undefined || updateData.user_id !== undefined) {
                const validation = Task.validate({ ...task, ...updateData });
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        error: '任务数据验证失败',
                        errors: validation.errors
                    });
                }
            }

            // 更新任务
            await task.update(updateData);
            
            res.json({
                success: true,
                message: '任务更新成功',
                data: task.toJSON()
            });
        } catch (error) {
            console.error('更新任务错误:', error);
            res.status(500).json({
                success: false,
                error: '更新任务失败',
                message: error.message
            });
        }
    }

    // 删除任务
    static async deleteTask(req, res) {
        try {
            const { id } = req.params;
            
            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: '任务不存在'
                });
            }

            // 检查权限：只有任务创建者可以删除任务（除非是管理员）
            if (req.session.userId && task.user_id !== req.session.userId) {
                return res.status(403).json({
                    success: false,
                    error: '没有权限删除此任务'
                });
            }

            await task.delete();
            
            res.json({
                success: true,
                message: '任务删除成功'
            });
        } catch (error) {
            console.error('删除任务错误:', error);
            res.status(500).json({
                success: false,
                error: '删除任务失败',
                message: error.message
            });
        }
    }

    // 获取用户的任务
    static async getUserTasks(req, res) {
        try {
            const { userId } = req.params;
            const { 
                page = 1, 
                limit = 10, 
                status, 
                priority, 
                sort_by = 'created_at', 
                sort_order = 'DESC',
                search 
            } = req.query;
            
            const offset = (page - 1) * limit;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                status,
                priority,
                sort_by,
                sort_order
            };

            let tasks;
            if (search) {
                tasks = await Task.search(search, { ...options, user_id: userId });
            } else {
                tasks = await Task.findByUserId(userId, options);
            }
            
            res.json({
                success: true,
                data: tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: tasks.length
                },
                filters: {
                    status,
                    priority,
                    search
                }
            });
        } catch (error) {
            console.error('获取用户任务错误:', error);
            res.status(500).json({
                success: false,
                error: '获取用户任务失败',
                message: error.message
            });
        }
    }

    // 获取当前用户的任务
    static async getCurrentUserTasks(req, res) {
        try {
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    error: '未登录'
                });
            }

            req.params.userId = req.session.userId;
            return TaskController.getUserTasks(req, res);
        } catch (error) {
            console.error('获取当前用户任务错误:', error);
            res.status(500).json({
                success: false,
                error: '获取当前用户任务失败',
                message: error.message
            });
        }
    }

    // 获取任务统计信息
    static async getTaskStatistics(req, res) {
        try {
            const { userId } = req.query;
            const stats = await Task.getStatistics(userId);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('获取任务统计错误:', error);
            res.status(500).json({
                success: false,
                error: '获取任务统计失败',
                message: error.message
            });
        }
    }

    // 批量更新任务状态
    static async batchUpdateTasks(req, res) {
        try {
            const { taskIds, updateData } = req.body;
            
            if (!Array.isArray(taskIds) || taskIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '请提供要更新的任务ID列表'
                });
            }

            const updatedTasks = [];
            const errors = [];

            for (const taskId of taskIds) {
                try {
                    const task = await Task.findById(taskId);
                    if (!task) {
                        errors.push(`任务 ${taskId} 不存在`);
                        continue;
                    }

                    // 检查权限
                    if (req.session.userId && task.user_id !== req.session.userId) {
                        errors.push(`没有权限更新任务 ${taskId}`);
                        continue;
                    }

                    await task.update(updateData);
                    updatedTasks.push(task.toJSON());
                } catch (error) {
                    errors.push(`更新任务 ${taskId} 失败: ${error.message}`);
                }
            }

            res.json({
                success: true,
                message: `成功更新 ${updatedTasks.length} 个任务`,
                data: updatedTasks,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            console.error('批量更新任务错误:', error);
            res.status(500).json({
                success: false,
                error: '批量更新任务失败',
                message: error.message
            });
        }
    }

    // 搜索任务
    static async searchTasks(req, res) {
        try {
            const { q: searchTerm, page = 1, limit = 10, user_id } = req.query;
            
            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    error: '请提供搜索关键词'
                });
            }

            const offset = (page - 1) * limit;
            const options = {
                limit: parseInt(limit),
                offset: parseInt(offset),
                user_id
            };

            const tasks = await Task.search(searchTerm, options);
            
            res.json({
                success: true,
                data: tasks,
                search: {
                    term: searchTerm,
                    results: tasks.length
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: tasks.length
                }
            });
        } catch (error) {
            console.error('搜索任务错误:', error);
            res.status(500).json({
                success: false,
                error: '搜索任务失败',
                message: error.message
            });
        }
    }
}

module.exports = TaskController;
