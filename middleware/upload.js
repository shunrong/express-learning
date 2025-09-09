const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    // 允许的文件类型
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB限制
        files: 5 // 最多5个文件
    },
    fileFilter: fileFilter
});

// 错误处理中间件
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message = '文件上传错误';
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = '文件大小超过限制（最大5MB）';
                break;
            case 'LIMIT_FILE_COUNT':
                message = '文件数量超过限制（最多5个）';
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
const processUploadedFiles = (req, res, next) => {
    if (req.file) {
        // 单个文件
        req.uploadedFile = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: req.file.path.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/')
        };
    }
    
    if (req.files) {
        // 多个文件
        req.uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            url: file.path.replace(path.join(__dirname, '../public'), '').replace(/\\/g, '/')
        }));
    }
    
    next();
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
