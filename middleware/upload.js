const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 根据文件类型创建不同的子目录
        let subDir = 'others';
        if (file.fieldname === 'avatar') {
            subDir = 'avatars';
        } else if (file.mimetype.startsWith('image/')) {
            subDir = 'images';
        } else if (file.mimetype.includes('document') || file.mimetype.includes('pdf')) {
            subDir = 'documents';
        }

        const targetDir = path.join(uploadDir, subDir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}_${random}${ext}`;
        cb(null, filename);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 允许的文件类型 - 支持大部分常见文件格式
    const allowedMimes = [
        // 图片文件
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
        
        // 文档文件
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // 文本文件
        'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
        'application/json', 'application/xml',
        
        // 压缩文件
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'application/x-tar', 'application/gzip',
        
        // 音频文件
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
        
        // 视频文件
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        
        // 其他常见文件
        'application/octet-stream' // 通用二进制文件
    ];

    // 危险文件类型黑名单
    const dangerousTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'application/x-msdos-program',
        'application/x-winexe'
    ];

    if (dangerousTypes.includes(file.mimetype)) {
        cb(new Error('不允许上传可执行文件'), false);
    } else if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // 对于不在白名单中的文件类型，检查文件扩展名
        const allowedExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.txt', '.csv', '.html', '.css', '.js', '.json', '.xml',
            '.zip', '.rar', '.7z', '.tar', '.gz',
            '.mp3', '.wav', '.ogg', '.m4a',
            '.mp4', '.avi', '.mov', '.wmv', '.webm',
            '.log', '.md', '.sql', '.py', '.java', '.cpp', '.c', '.h'
        ];
        
        const ext = require('path').extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件类型: ${file.mimetype || ext}`), false);
        }
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB限制（普通上传）
        files: 10 // 最多10个文件
    },
    fileFilter: fileFilter
});

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message = '文件上传错误';
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = '文件大小超过限制（最大100MB）';
                break;
            case 'LIMIT_FILE_COUNT':
                message = '文件数量超过限制（最多10个）';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = '意外的文件字段';
                break;
            default:
                message = error.message;
        }
        
        return res.status(400).json({
            success: false,
            error: message
        });
    } else if (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    next();
};

// 处理上传后的文件信息
const processUploadedFiles = async (req, res, next) => {
    try {
        if (req.file) {
            // 单个文件
            let thumbnailUrl = null;
            
            // 如果是图片文件，生成缩略图
            if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
                thumbnailUrl = await generateThumbnail(req.file.path, req.file.filename);
            }
            
            req.uploadedFile = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                url: req.file.path.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/'),
                thumbnailUrl
            };
        }
        
        if (req.files) {
            // 多个文件
            req.uploadedFiles = [];
            
            for (const file of req.files) {
                let thumbnailUrl = null;
                
                // 如果是图片文件，生成缩略图
                if (file.mimetype && file.mimetype.startsWith('image/')) {
                    thumbnailUrl = await generateThumbnail(file.path, file.filename);
                }
                
                req.uploadedFiles.push({
                    filename: file.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path,
                    url: file.path.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/'),
                    thumbnailUrl
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('处理上传文件失败:', error);
        next();
    }
};

// 删除文件的辅助函数
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        // 如果是相对路径，转换为绝对路径
        let absolutePath = filePath;
        if (!path.isAbsolute(filePath)) {
            absolutePath = path.join(__dirname, '../public', filePath);
        }
        
        fs.unlink(absolutePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// 生成图片缩略图
const generateThumbnail = async (imagePath, originalFilename) => {
    try {
        // 创建缩略图目录
        const thumbnailDir = path.join(uploadDir, 'thumbnails');
        if (!fs.existsSync(thumbnailDir)) {
            fs.mkdirSync(thumbnailDir, { recursive: true });
        }
        
        // 生成缩略图文件名
        const ext = path.extname(originalFilename);
        const basename = path.basename(originalFilename, ext);
        const thumbnailFilename = `thumb_${basename}${ext}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        
        // 生成缩略图 (300x300，保持纵横比)
        await sharp(imagePath)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        
        return `/uploads/thumbnails/${thumbnailFilename}`;
    } catch (error) {
        console.error('生成缩略图失败:', error);
        return null;
    }
};

// 创建默认头像（如果不存在）
const createDefaultAvatar = () => {
    const defaultAvatarPath = path.join(uploadDir, 'default-avatar.png');
    if (!fs.existsSync(defaultAvatarPath)) {
        // 这里可以创建一个简单的默认头像，或者复制一个预设的图片
        // 为了简化，我们创建一个空文件作为占位符
        fs.writeFileSync(defaultAvatarPath, '');
    }
};

// 初始化上传模块
const initUpload = () => {
    createDefaultAvatar();
    console.log('文件上传模块初始化完成');
};

module.exports = {
    upload,
    handleUploadError,
    processUploadedFiles,
    deleteFile,
    initUpload,
    generateThumbnail,
    
    // 常用的上传配置
    single: (fieldName) => upload.single(fieldName),
    multiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
    fields: (fields) => upload.fields(fields),
    
    // 仅限图片上传
    imageOnly: multer({
        storage: storage,
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('只能上传图片文件'), false);
            }
        }
    }),
    
    // 头像上传专用
    avatar: multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const avatarDir = path.join(uploadDir, 'avatars');
                if (!fs.existsSync(avatarDir)) {
                    fs.mkdirSync(avatarDir, { recursive: true });
                }
                cb(null, avatarDir);
            },
            filename: function (req, file, cb) {
                const userId = req.session.userId || 'anonymous';
                const timestamp = Date.now();
                const ext = path.extname(file.originalname);
                const filename = `avatar_${userId}_${timestamp}${ext}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 2 * 1024 * 1024 // 头像限制2MB
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('头像只能是JPG、PNG、GIF或WebP格式'), false);
            }
        }
    })
};
