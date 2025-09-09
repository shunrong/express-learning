const express = require('express');
const router = express.Router();
const { upload, avatar, handleUploadError, processUploadedFiles, deleteFile } = require('../middleware/upload');
const User = require('../models/User');

// 认证中间件
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            error: '需要登录才能上传文件'
        });
    }
    next();
};

// 上传头像
router.post('/avatar', requireAuth, avatar.single('avatar'), handleUploadError, processUploadedFiles, async (req, res) => {
    try {
        if (!req.uploadedFile) {
            return res.status(400).json({
                success: false,
                error: '没有收到文件'
            });
        }

        // 更新用户的头像信息
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        // 删除旧头像（如果不是默认头像）
        if (user.avatar && user.avatar !== '/uploads/default-avatar.png') {
            try {
                await deleteFile(user.avatar);
            } catch (error) {
                console.log('删除旧头像失败:', error.message);
            }
        }

        // 更新用户头像
        await user.update({
            avatar: req.uploadedFile.url
        });

        res.json({
            success: true,
            message: '头像上传成功',
            data: {
                avatar: req.uploadedFile.url,
                file: req.uploadedFile
            }
        });
    } catch (error) {
        console.error('头像上传错误:', error);
        
        // 如果更新数据库失败，删除已上传的文件
        if (req.uploadedFile) {
            try {
                await deleteFile(req.uploadedFile.path);
            } catch (deleteError) {
                console.error('删除文件失败:', deleteError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: '头像上传失败',
            message: error.message
        });
    }
});

// 上传单个文件
router.post('/single', requireAuth, upload.single('file'), handleUploadError, processUploadedFiles, (req, res) => {
    try {
        if (!req.uploadedFile) {
            return res.status(400).json({
                success: false,
                error: '没有收到文件'
            });
        }

        res.json({
            success: true,
            message: '文件上传成功',
            data: {
                file: req.uploadedFile
            }
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({
            success: false,
            error: '文件上传失败',
            message: error.message
        });
    }
});

// 上传多个文件
router.post('/multiple', requireAuth, upload.array('files', 5), handleUploadError, processUploadedFiles, (req, res) => {
    try {
        if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有收到文件'
            });
        }

        res.json({
            success: true,
            message: `成功上传 ${req.uploadedFiles.length} 个文件`,
            data: {
                files: req.uploadedFiles,
                count: req.uploadedFiles.length
            }
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({
            success: false,
            error: '文件上传失败',
            message: error.message
        });
    }
});

// 删除文件
router.delete('/file', requireAuth, async (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: '请提供文件路径'
            });
        }

        // 安全检查：确保文件路径在uploads目录内
        if (!filePath.startsWith('/uploads/')) {
            return res.status(403).json({
                success: false,
                error: '无效的文件路径'
            });
        }

        await deleteFile(filePath);

        res.json({
            success: true,
            message: '文件删除成功'
        });
    } catch (error) {
        console.error('文件删除错误:', error);
        res.status(500).json({
            success: false,
            error: '文件删除失败',
            message: error.message
        });
    }
});

// 获取文件信息
router.get('/info', requireAuth, (req, res) => {
    res.json({
        success: true,
        data: {
            maxFileSize: '5MB',
            maxFiles: 5,
            allowedTypes: [
                'image/jpeg',
                'image/png', 
                'image/gif',
                'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            uploadUrl: {
                single: '/api/upload/single',
                multiple: '/api/upload/multiple',
                avatar: '/api/upload/avatar'
            }
        }
    });
});

module.exports = router;
