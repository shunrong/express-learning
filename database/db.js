const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// 数据库文件路径
const dbPath = path.join(__dirname, 'task_manager.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库错误:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
    }
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON;');

// 初始化数据库表
const initDatabase = () => {
    console.log('开始初始化数据库表...');
    
    // 创建用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT DEFAULT '/uploads/default-avatar.png',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('创建用户表错误:', err.message);
        } else {
            console.log('用户表创建成功');
        }
    });

    // 创建任务表
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
            user_id INTEGER NOT NULL,
            due_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('创建任务表错误:', err.message);
        } else {
            console.log('任务表创建成功');
        }
    });

    // 插入默认数据
    setTimeout(() => {
        insertDefaultData();
    }, 100); // 稍微延迟以确保表创建完成
};

// 插入默认数据
const insertDefaultData = () => {
    // 检查是否已有用户数据
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('查询用户数据错误:', err.message);
            return;
        }
        
        if (row.count === 0) {
            console.log('插入默认用户数据...');
            const hashedPassword = bcrypt.hashSync('123456', 10);
            
            db.run(`
                INSERT INTO users (username, email, password) 
                VALUES (?, ?, ?)
            `, ['admin', 'admin@example.com', hashedPassword], function(err) {
                if (err) {
                    console.error('插入默认用户错误:', err.message);
                } else {
                    console.log('默认用户创建成功，用户名: admin, 密码: 123456');
                    
                    // 插入默认任务
                    const userId = this.lastID;
                    db.run(`
                        INSERT INTO tasks (title, description, status, priority, user_id) 
                        VALUES 
                        ('学习Express基础', '完成Express框架的基础学习', 'completed', 'high', ?),
                        ('实现用户管理', '完成用户的CRUD操作', 'in_progress', 'medium', ?),
                        ('添加文件上传', '实现头像上传功能', 'pending', 'low', ?)
                    `, [userId, userId, userId], (err) => {
                        if (err) {
                            console.error('插入默认任务错误:', err.message);
                        } else {
                            console.log('默认任务数据插入成功');
                        }
                    });
                }
            });
        } else {
            console.log('数据库已存在用户数据，跳过初始化');
        }
    });
};

// 数据库操作帮助函数
const dbHelpers = {
    // 执行查询
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // 执行单行查询
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // 执行插入/更新/删除
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    },

    // === 用户相关操作 ===

    // 查询所有用户
    getAllUsers: async (limit = 50, offset = 0) => {
        return await dbHelpers.query(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
    },

    // 根据ID查找用户
    getUserById: async (id) => {
        return await dbHelpers.get(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
    },

    // 根据用户名查找用户
    getUserByUsername: async (username) => {
        return await dbHelpers.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    },

    // 根据邮箱查找用户
    getUserByEmail: async (email) => {
        return await dbHelpers.get(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
    },

    // 创建用户
    createUser: async (userData) => {
        const result = await dbHelpers.run(
            `INSERT INTO users (username, email, password, avatar) 
             VALUES (?, ?, ?, ?)`,
            [userData.username, userData.email, userData.password, userData.avatar || '/uploads/default-avatar.png']
        );
        return await dbHelpers.getUserById(result.lastID);
    },

    // 更新用户
    updateUser: async (id, updateData) => {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            throw new Error('没有要更新的字段');
        }

        values.push(id);

        await dbHelpers.run(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return await dbHelpers.getUserById(id);
    },

    // 删除用户
    deleteUser: async (id) => {
        const result = await dbHelpers.run('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    },

    // 获取用户的任务数量
    getUserTaskCount: async (userId) => {
        const result = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM tasks WHERE user_id = ?',
            [userId]
        );
        return result.count;
    },

    // === 任务相关操作 ===

    // 查询所有任务
    getAllTasks: async (options = {}) => {
        let sql = `
            SELECT t.*, u.username, u.email 
            FROM tasks t 
            LEFT JOIN users u ON t.user_id = u.id
        `;
        const params = [];

        // 添加筛选条件
        const conditions = [];

        if (options.user_id) {
            conditions.push('t.user_id = ?');
            params.push(options.user_id);
        }

        if (options.status) {
            conditions.push('t.status = ?');
            params.push(options.status);
        }

        if (options.priority) {
            conditions.push('t.priority = ?');
            params.push(options.priority);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        // 排序
        sql += ' ORDER BY ';
        if (options.sort_by) {
            sql += `t.${options.sort_by} ${options.sort_order || 'DESC'}`;
        } else {
            sql += 't.created_at DESC';
        }

        // 分页
        if (options.limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(options.limit, options.offset || 0);
        }

        return await dbHelpers.query(sql, params);
    },

    // 根据ID查找任务
    getTaskById: async (id) => {
        return await dbHelpers.get(
            `SELECT t.*, u.username, u.email 
             FROM tasks t 
             LEFT JOIN users u ON t.user_id = u.id 
             WHERE t.id = ?`,
            [id]
        );
    },

    // 创建任务
    createTask: async (taskData) => {
        const result = await dbHelpers.run(
            `INSERT INTO tasks (title, description, status, priority, user_id, due_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                taskData.title,
                taskData.description || null,
                taskData.status || 'pending',
                taskData.priority || 'medium',
                taskData.user_id,
                taskData.due_date || null
            ]
        );
        return await dbHelpers.getTaskById(result.lastID);
    },

    // 更新任务
    updateTask: async (id, updateData) => {
        const fields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== 'id') {
                fields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (fields.length === 0) {
            throw new Error('没有要更新的字段');
        }

        values.push(id);

        await dbHelpers.run(
            `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return await dbHelpers.getTaskById(id);
    },

    // 删除任务
    deleteTask: async (id) => {
        const result = await dbHelpers.run('DELETE FROM tasks WHERE id = ?', [id]);
        return result.changes > 0;
    },

    // 搜索任务
    searchTasks: async (searchTerm, options = {}) => {
        let sql = `
            SELECT t.*, u.username, u.email 
            FROM tasks t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE (t.title LIKE ? OR t.description LIKE ?)
        `;
        const params = [`%${searchTerm}%`, `%${searchTerm}%`];

        if (options.user_id) {
            sql += ' AND t.user_id = ?';
            params.push(options.user_id);
        }

        sql += ' ORDER BY t.created_at DESC';

        if (options.limit) {
            sql += ' LIMIT ? OFFSET ?';
            params.push(options.limit, options.offset || 0);
        }

        return await dbHelpers.query(sql, params);
    },

    // 获取任务统计
    getTaskStatistics: async (userId = null) => {
        let sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority
            FROM tasks
        `;
        const params = [];

        if (userId) {
            sql += ' WHERE user_id = ?';
            params.push(userId);
        }

        return await dbHelpers.get(sql, params);
    }
};

// 优雅关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库错误:', err.message);
        } else {
            console.log('数据库连接已关闭');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    initDatabase,
    dbHelpers
};