// Express任务管理系统 - 前端JavaScript

// 全局变量
window.TaskManager = {
    currentUser: null,
    config: {
        apiUrl: '/api',
        pageSize: 10
    }
};

// 工具函数
const Utils = {
    // 显示提示消息
    showAlert: function(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="bi bi-${this.getAlertIcon(type)}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // 自动移除提示
        if (duration > 0) {
            setTimeout(() => {
                const alert = document.getElementById(alertId);
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, duration);
        }
    },

    // 获取提示图标
    getAlertIcon: function(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-triangle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            primary: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // 格式化日期
    formatDate: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 格式化相对时间
    formatRelativeTime: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return this.formatDate(dateString);
        } else if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    },

    // 防抖函数
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 发送AJAX请求
    request: async function(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('请求错误:', error);
            throw error;
        }
    }
};

// API 接口
const API = {
    // 用户相关API
    user: {
        login: (credentials) => Utils.request('/api/users/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        register: (userData) => Utils.request('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        logout: () => Utils.request('/api/users/logout', {
            method: 'POST'
        }),

        getCurrentUser: () => Utils.request('/api/users/me'),

        updateUser: (id, userData) => Utils.request(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        })
    },

    // 任务相关API
    task: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return Utils.request(`/api/tasks?${queryString}`);
        },

        getById: (id) => Utils.request(`/api/tasks/${id}`),

        create: (taskData) => Utils.request('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        }),

        update: (id, taskData) => Utils.request(`/api/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        }),

        delete: (id) => Utils.request(`/api/tasks/${id}`, {
            method: 'DELETE'
        }),

        getMyTasks: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return Utils.request(`/api/tasks/my?${queryString}`);
        },

        search: (query, params = {}) => {
            const allParams = { q: query, ...params };
            const queryString = new URLSearchParams(allParams).toString();
            return Utils.request(`/api/tasks/search?${queryString}`);
        },

        getStatistics: (userId = null) => {
            const params = userId ? `?userId=${userId}` : '';
            return Utils.request(`/api/tasks/statistics${params}`);
        }
    }
};

// 组件管理
const Components = {
    // 初始化所有组件
    init: function() {
        this.initTooltips();
        this.initPopovers();
        this.initModals();
        this.initForms();
        this.initSearch();
    },

    // 初始化工具提示
    initTooltips: function() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    // 初始化弹出框
    initPopovers: function() {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    },

    // 初始化模态框
    initModals: function() {
        // 模态框打开时聚焦第一个输入框
        document.addEventListener('shown.bs.modal', function (event) {
            const modal = event.target;
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        });
    },

    // 初始化表单
    initForms: function() {
        // 表单验证
        const forms = document.querySelectorAll('.needs-validation');
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });

        // 文件上传拖拽
        this.initFileUpload();
    },

    // 初始化搜索功能
    initSearch: function() {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            const debouncedSearch = Utils.debounce((query) => {
                this.performSearch(query);
            }, 300);

            input.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        });
    },

    // 执行搜索
    performSearch: function(query) {
        // 搜索实现将在具体页面中重写
        console.log('搜索:', query);
    },

    // 初始化文件上传
    initFileUpload: function() {
        const uploadAreas = document.querySelectorAll('.file-upload-area');
        uploadAreas.forEach(area => {
            const input = area.querySelector('input[type="file"]');
            if (!input) return;

            // 点击上传区域触发文件选择
            area.addEventListener('click', () => {
                input.click();
            });

            // 拖拽上传
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('dragover');
            });

            area.addEventListener('dragleave', () => {
                area.classList.remove('dragover');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    this.handleFileUpload(input);
                }
            });

            // 文件选择处理
            input.addEventListener('change', () => {
                this.handleFileUpload(input);
            });
        });
    },

    // 处理文件上传
    handleFileUpload: function(input) {
        const files = input.files;
        if (files.length === 0) return;

        const file = files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (file.size > maxSize) {
            Utils.showAlert('文件大小不能超过5MB', 'danger');
            input.value = '';
            return;
        }

        // 显示文件预览
        this.showFilePreview(file, input);
    },

    // 显示文件预览
    showFilePreview: function(file, input) {
        const uploadArea = input.closest('.file-upload-area');
        if (!uploadArea) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = uploadArea.querySelector('.file-preview') || 
                           uploadArea.appendChild(document.createElement('div'));
            preview.className = 'file-preview mt-3';
            
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `
                    <img src="${e.target.result}" class="img-thumbnail" style="max-width: 200px; max-height: 200px;">
                    <p class="mt-2 mb-0">${file.name}</p>
                `;
            } else {
                preview.innerHTML = `
                    <i class="bi bi-file-earmark fs-1"></i>
                    <p class="mt-2 mb-0">${file.name}</p>
                `;
            }
        };
        reader.readAsDataURL(file);
    }
};

// 全局事件处理
const EventHandlers = {
    // 登出功能
    logout: async function() {
        try {
            await API.user.logout();
            Utils.showAlert('已成功登出', 'success', 2000);
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            Utils.showAlert('登出失败: ' + error.message, 'danger');
        }
    },

    // 确认删除
    confirmDelete: function(message = '确定要删除吗？') {
        return confirm(message);
    },

    // 任务状态切换
    toggleTaskStatus: async function(taskId, newStatus) {
        try {
            await API.task.update(taskId, { status: newStatus });
            Utils.showAlert('任务状态已更新', 'success');
            // 刷新页面或更新UI
            window.location.reload();
        } catch (error) {
            Utils.showAlert('更新失败: ' + error.message, 'danger');
        }
    }
};

// 将函数绑定到全局
window.logout = EventHandlers.logout;
window.confirmDelete = EventHandlers.confirmDelete;
window.toggleTaskStatus = EventHandlers.toggleTaskStatus;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    Components.init();
    
    // 添加页面加载动画
    document.body.classList.add('fade-in');
    
    // 获取当前用户信息
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        API.user.getCurrentUser()
            .then(result => {
                if (result.success) {
                    TaskManager.currentUser = result.data;
                }
            })
            .catch(error => {
                console.log('未登录或获取用户信息失败');
            });
    }
});

// 页面卸载前的清理工作
window.addEventListener('beforeunload', function() {
    // 清理定时器、事件监听器等
});

// 导出到全局
window.Utils = Utils;
window.API = API;
window.Components = Components;
window.EventHandlers = EventHandlers;
