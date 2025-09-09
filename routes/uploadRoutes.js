const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { upload, avatar, handleUploadError, processUploadedFiles, deleteFile, generateThumbnail } = require('../middleware/upload');
const User = require('../models/User');

// 分片上传临时存储
const chunkUploads = new Map();

// 确保目录存在
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

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
            maxFileSize: '100MB',
            maxFiles: 10,
            allowedTypes: [
                // 图片文件
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
                // 文档文件
                'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                // 文本文件
                'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
                // 压缩文件
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
                // 音频视频文件
                'audio/mpeg', 'audio/wav', 'video/mp4', 'video/mpeg',
                // 其他常见文件
                'application/json', 'application/xml'
            ],
            uploadUrl: {
                single: '/api/upload/single',
                multiple: '/api/upload/multiple',
                avatar: '/api/upload/avatar'
            }
        }
    });
});

// ============ 分片上传功能 ============

// 初始化分片上传
router.post('/chunk/init', requireAuth, (req, res) => {
    try {
        const { filename, fileSize, chunkSize } = req.body;
        
        if (!filename || !fileSize || !chunkSize) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const totalChunks = Math.ceil(fileSize / chunkSize);
        
        // 创建临时目录
        const tempDir = path.join(__dirname, '../temp/chunks', uploadId);
        ensureDir(tempDir);
        
        // 存储上传信息
        chunkUploads.set(uploadId, {
            filename,
            fileSize,
            chunkSize,
            totalChunks,
            tempDir,
            uploadedChunks: new Set(),
            startTime: Date.now(),
            userId: req.session.userId
        });
        
        res.json({
            success: true,
            message: '分片上传初始化成功',
            data: {
                uploadId,
                totalChunks,
                chunkSize
            }
        });
    } catch (error) {
        console.error('分片上传初始化错误:', error);
        res.status(500).json({
            success: false,
            error: '初始化失败',
            message: error.message
        });
    }
});

// 上传分片
router.post('/chunk/upload', requireAuth, multer().single('chunk'), (req, res) => {
    try {
        const { uploadId, chunkIndex, totalChunks } = req.body;
        const chunk = req.file;
        
        if (!uploadId || chunkIndex === undefined || !chunk) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        const uploadInfo = chunkUploads.get(uploadId);
        if (!uploadInfo) {
            return res.status(404).json({
                success: false,
                error: '上传信息不存在'
            });
        }
        
        // 验证用户权限
        if (uploadInfo.userId !== req.session.userId) {
            return res.status(403).json({
                success: false,
                error: '无权限访问此上传'
            });
        }
        
        // 保存分片文件
        const chunkPath = path.join(uploadInfo.tempDir, `chunk_${chunkIndex}`);
        fs.writeFileSync(chunkPath, chunk.buffer);
        
        // 记录已上传的分片
        uploadInfo.uploadedChunks.add(parseInt(chunkIndex));
        
        res.json({
            success: true,
            message: '分片上传成功',
            data: {
                chunkIndex: parseInt(chunkIndex),
                uploadedChunks: uploadInfo.uploadedChunks.size,
                totalChunks: parseInt(totalChunks)
            }
        });
    } catch (error) {
        console.error('分片上传错误:', error);
        res.status(500).json({
            success: false,
            error: '分片上传失败',
            message: error.message
        });
    }
});

// 合并分片
router.post('/chunk/merge', requireAuth, (req, res) => {
    try {
        const { uploadId, filename } = req.body;
        
        if (!uploadId || !filename) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        const uploadInfo = chunkUploads.get(uploadId);
        if (!uploadInfo) {
            return res.status(404).json({
                success: false,
                error: '上传信息不存在'
            });
        }
        
        // 验证用户权限
        if (uploadInfo.userId !== req.session.userId) {
            return res.status(403).json({
                success: false,
                error: '无权限访问此上传'
            });
        }
        
        // 检查所有分片是否都已上传
        if (uploadInfo.uploadedChunks.size !== uploadInfo.totalChunks) {
            return res.status(400).json({
                success: false,
                error: '分片上传不完整'
            });
        }
        
        // 合并文件
        const finalPath = path.join(__dirname, '../public/uploads/files');
        ensureDir(finalPath);
        
        const ext = path.extname(filename);
        const finalFilename = 'chunk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + ext;
        const finalFilePath = path.join(finalPath, finalFilename);
        
        const writeStream = fs.createWriteStream(finalFilePath);
        
        // 按顺序合并分片
        for (let i = 0; i < uploadInfo.totalChunks; i++) {
            const chunkPath = path.join(uploadInfo.tempDir, `chunk_${i}`);
            if (fs.existsSync(chunkPath)) {
                const chunkData = fs.readFileSync(chunkPath);
                writeStream.write(chunkData);
            }
        }
        
        writeStream.end();
        
        // 等待文件写入完成
        writeStream.on('finish', () => {
            // 获取文件信息
            const stats = fs.statSync(finalFilePath);
            
            res.json({
                success: true,
                message: '文件合并成功',
                data: {
                    filename: finalFilename,
                    originalName: filename,
                    size: stats.size,
                    url: `/uploads/files/${finalFilename}`,
                    uploadDate: new Date().toISOString(),
                    uploadTime: Date.now() - uploadInfo.startTime
                }
            });
            
            // 清理临时文件
            setTimeout(() => {
                try {
                    fs.rmSync(uploadInfo.tempDir, { recursive: true, force: true });
                    chunkUploads.delete(uploadId);
                } catch (cleanupError) {
                    console.error('清理临时文件错误:', cleanupError);
                }
            }, 1000);
        });
        
        return; // 避免下面的重复响应
    } catch (error) {
        console.error('分片合并错误:', error);
        res.status(500).json({
            success: false,
            error: '文件合并失败',
            message: error.message
        });
    }
});

// ============ 文件管理功能 ============

// 获取已上传文件列表
router.get('/files', requireAuth, (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../public/uploads');
        const files = [];
        
        // 扫描不同类型的上传目录
        const dirs = ['avatars', 'files', 'images', 'documents', 'others'];
        
        dirs.forEach(dir => {
            const dirPath = path.join(uploadsDir, dir);
            if (fs.existsSync(dirPath)) {
                const dirFiles = fs.readdirSync(dirPath);
                dirFiles.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isFile() && file !== 'default-avatar.png') {
                        // 从文件名推断原始名称（去掉时间戳前缀）
                        let displayName = file;
                        if (file.match(/^\d+_\d+\./)) {
                            // 对于格式如 "1234567890_123456789.pdf" 的文件，显示更友好的名称
                            const ext = path.extname(file);
                            displayName = `文件${ext}`;
                        }
                        
                        const mimeType = getMimeType(file);
                        let thumbnailUrl = null;
                        
                        // 如果是图片文件，检查是否存在缩略图，没有则生成
                        if (mimeType && mimeType.startsWith('image/')) {
                            const thumbnailPath = path.join(__dirname, '../public/uploads/thumbnails', `thumb_${file}`);
                            if (fs.existsSync(thumbnailPath)) {
                                thumbnailUrl = `/uploads/thumbnails/thumb_${file}`;
                            } else {
                                // 异步生成缩略图（不阻塞响应）
                                generateThumbnail(filePath, file).then(url => {
                                    if (url) console.log(`生成缩略图: ${url}`);
                                }).catch(err => {
                                    console.error('生成缩略图失败:', err);
                                });
                            }
                        }
                        
                        files.push({
                            filename: file,
                            originalName: displayName,
                            size: stats.size,
                            url: `/uploads/${dir}/${file}`,
                            uploadDate: stats.mtime.toISOString(),
                            mimeType,
                            type: dir,
                            category: getCategoryDisplayName(dir),
                            thumbnailUrl
                        });
                    }
                });
            }
        });
        
        // 按上传时间排序
        files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        res.json({
            success: true,
            data: files
        });
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({
            success: false,
            error: '获取文件列表失败',
            message: error.message
        });
    }
});

// 文件下载接口
router.get('/download/:dir/:filename', (req, res) => {
    try {
        const { dir, filename } = req.params;
        const filePath = path.join(__dirname, '../public/uploads', dir, filename);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }
        
        // 设置下载头
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // 发送文件
        res.sendFile(filePath);
    } catch (error) {
        console.error('下载文件错误:', error);
        res.status(500).json({
            success: false,
            error: '下载失败',
            message: error.message
        });
    }
});

// 获取类别显示名称
function getCategoryDisplayName(dir) {
    const categoryMap = {
        'avatars': '头像',
        'files': '分片文件',
        'images': '图片',
        'documents': '文档',
        'others': '其他'
    };
    return categoryMap[dir] || dir;
}

// 获取文件MIME类型
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        // 图片文件
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', 
        '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', 
        '.svg': 'image/svg+xml',
        
        // 文档文件
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // 文本文件
        '.txt': 'text/plain', '.csv': 'text/csv', '.html': 'text/html',
        '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
        '.xml': 'application/xml', '.md': 'text/markdown',
        
        // 压缩文件
        '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
        '.7z': 'application/x-7z-compressed', '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        
        // 音频文件
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4', '.flac': 'audio/flac',
        
        // 视频文件
        '.mp4': 'video/mp4', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv', '.webm': 'video/webm', '.flv': 'video/x-flv',
        
        // 程序代码文件
        '.py': 'text/x-python', '.java': 'text/x-java-source',
        '.cpp': 'text/x-c++src', '.c': 'text/x-csrc', '.h': 'text/x-chdr',
        '.sql': 'application/sql', '.log': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = router;
