// 文件上传演示 JavaScript

// 全局变量
let multipleFiles = [];
let chunkUploads = {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadAreas();
    loadFilesList();
});

// ============ 初始化上传区域 ============
function initializeUploadAreas() {
    // 头像上传区域
    const avatarUploadArea = document.getElementById('avatarUploadArea');
    const avatarFileInput = document.getElementById('avatarFileInput');
    
    if (avatarUploadArea && avatarFileInput) {
        avatarUploadArea.addEventListener('click', () => avatarFileInput.click());
        avatarUploadArea.addEventListener('dragover', handleDragOver);
        avatarUploadArea.addEventListener('drop', (e) => handleSingleDrop(e, 'avatar'));
        avatarFileInput.addEventListener('change', (e) => handleFileSelect(e, 'avatar'));
    }
    
    // 单文件上传区域
    const singleUploadArea = document.getElementById('singleUploadArea');
    const singleFileInput = document.getElementById('singleFileInput');
    
    if (singleUploadArea && singleFileInput) {
        singleUploadArea.addEventListener('click', () => singleFileInput.click());
        singleUploadArea.addEventListener('dragover', handleDragOver);
        singleUploadArea.addEventListener('drop', (e) => handleSingleDrop(e, 'single'));
        singleFileInput.addEventListener('change', (e) => handleFileSelect(e, 'single'));
    }
    
    // 多文件上传区域
    const multipleUploadArea = document.getElementById('multipleUploadArea');
    const multipleFileInput = document.getElementById('multipleFileInput');
    
    multipleUploadArea.addEventListener('click', () => multipleFileInput.click());
    multipleUploadArea.addEventListener('dragover', handleDragOver);
    multipleUploadArea.addEventListener('drop', handleMultipleDrop);
    multipleFileInput.addEventListener('change', handleMultipleFileSelect);
    
    // 分片上传
    const chunkFileInput = document.getElementById('chunkFileInput');
    chunkFileInput.addEventListener('change', handleChunkFileSelect);
}

// ============ 拖拽处理 ============
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleSingleDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        uploadSingleFile(files[0], type);
    }
}

function handleMultipleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addMultipleFiles(files);
}

// ============ 单文件上传处理 ============
function handleFileSelect(e, type) {
    const file = e.target.files[0];
    if (file) {
        uploadSingleFile(file, type);
    }
}

function uploadSingleFile(file, type) {
    // 根据类型确定容器和API端点
    const listContainer = document.getElementById(type === 'avatar' ? 'avatarUploadList' : 'singleUploadList');
    const fileItem = createFileItem(file, type);
    listContainer.appendChild(fileItem);
    
    const formData = new FormData();
    
    // 根据类型设置不同的字段名和API端点
    let endpoint, fieldName;
    if (type === 'avatar') {
        endpoint = '/api/upload/avatar';
        fieldName = 'avatar';
    } else {
        endpoint = '/api/upload/single';
        fieldName = 'file';
    }
    
    formData.append(fieldName, file);
    
    const xhr = new XMLHttpRequest();
    const progressBar = fileItem.querySelector('.progress-bar');
    const statusElement = fileItem.querySelector('.upload-status');
    
    // 上传进度
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            progressBar.style.width = percent + '%';
            progressBar.textContent = Math.round(percent) + '%';
        }
    };
    
    // 上传完成
    xhr.onload = () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    statusElement.innerHTML = '<i class="bi bi-check-circle text-success"></i> 上传成功';
                    progressBar.classList.add('bg-success');
                    
                    // 显示上传结果
                    showUploadResult(fileItem, response.data);
                } else {
                    throw new Error(response.error || '上传失败');
                }
            } catch (error) {
                showUploadError(fileItem, error.message);
            }
        } else {
            showUploadError(fileItem, '上传失败，状态码: ' + xhr.status);
        }
    };
    
    // 上传错误
    xhr.onerror = () => {
        showUploadError(fileItem, '网络错误');
    };
    
    statusElement.innerHTML = '<i class="bi bi-upload text-primary"></i> 上传中...';
    xhr.open('POST', endpoint);
    xhr.send(formData);
}

// ============ 多文件上传 ============
function selectMultipleFiles() {
    document.getElementById('multipleFileInput').click();
}

function handleMultipleFileSelect(e) {
    const files = Array.from(e.target.files);
    addMultipleFiles(files);
}

function addMultipleFiles(files) {
    multipleFiles.push(...files);
    updateMultipleFilesList();
    updateUploadAllButton();
}

function updateMultipleFilesList() {
    const listContainer = document.getElementById('multipleUploadList');
    listContainer.innerHTML = '';
    
    multipleFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, 'multiple', index);
        listContainer.appendChild(fileItem);
    });
}

function updateUploadAllButton() {
    const uploadAllBtn = document.getElementById('uploadAllBtn');
    uploadAllBtn.disabled = multipleFiles.length === 0;
}

function removeMultipleFile(index) {
    multipleFiles.splice(index, 1);
    updateMultipleFilesList();
    updateUploadAllButton();
}

function uploadAllFiles() {
    if (multipleFiles.length === 0) return;
    
    const overallProgress = document.getElementById('overallProgress');
    const overallProgressBar = document.getElementById('overallProgressBar');
    const overallProgressText = document.getElementById('overallProgressText');
    
    overallProgress.style.display = 'block';
    overallProgressBar.style.width = '0%';
    overallProgressText.textContent = '准备上传...';
    
    let completedFiles = 0;
    let totalProgress = 0;
    
    multipleFiles.forEach((file, index) => {
        uploadMultipleFile(file, index, (progress) => {
            // 更新单个文件进度
            const fileItem = document.querySelector(`[data-file-index="${index}"]`);
            if (fileItem) {
                const progressBar = fileItem.querySelector('.progress-bar');
                progressBar.style.width = progress + '%';
                progressBar.textContent = Math.round(progress) + '%';
            }
            
            // 计算总体进度
            totalProgress = 0;
            for (let i = 0; i < multipleFiles.length; i++) {
                const item = document.querySelector(`[data-file-index="${i}"]`);
                if (item) {
                    const bar = item.querySelector('.progress-bar');
                    const percent = parseFloat(bar.style.width) || 0;
                    totalProgress += percent;
                }
            }
            
            const avgProgress = totalProgress / multipleFiles.length;
            overallProgressBar.style.width = avgProgress + '%';
            overallProgressText.textContent = `${completedFiles}/${multipleFiles.length} 文件完成 (${Math.round(avgProgress)}%)`;
            
        }, () => {
            // 单个文件完成
            completedFiles++;
            if (completedFiles === multipleFiles.length) {
                overallProgressText.textContent = `全部完成！共上传 ${completedFiles} 个文件`;
                setTimeout(() => {
                    loadFilesList(); // 刷新文件列表
                }, 1000);
            }
        });
    });
}

function uploadMultipleFile(file, index, onProgress, onComplete) {
    const formData = new FormData();
    formData.append('files', file);
    
    const xhr = new XMLHttpRequest();
    const fileItem = document.querySelector(`[data-file-index="${index}"]`);
    const statusElement = fileItem.querySelector('.upload-status');
    
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent);
        }
    };
    
    xhr.onload = () => {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    statusElement.innerHTML = '<i class="bi bi-check-circle text-success"></i> 成功';
                    const progressBar = fileItem.querySelector('.progress-bar');
                    progressBar.classList.add('bg-success');
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 失败';
            }
        } else {
            statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 失败';
        }
        onComplete();
    };
    
    xhr.onerror = () => {
        statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 错误';
        onComplete();
    };
    
    statusElement.innerHTML = '<i class="bi bi-upload text-primary"></i> 上传中';
    xhr.open('POST', '/api/upload/multiple');
    xhr.send(formData);
}

// ============ 分片上传 ============
function selectChunkFile() {
    document.getElementById('chunkFileInput').click();
}

function handleChunkFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        startChunkUpload(file);
    }
}

function startChunkUpload(file) {
    const chunkSize = parseInt(document.getElementById('chunkSize').value);
    const concurrency = parseInt(document.getElementById('concurrency').value);
    
    const listContainer = document.getElementById('chunkUploadList');
    const fileItem = createChunkFileItem(file, chunkSize);
    listContainer.appendChild(fileItem);
    
    // 初始化分片上传
    initChunkUpload(file, chunkSize, concurrency, fileItem);
}

function initChunkUpload(file, chunkSize, concurrency, fileItem) {
    const statusElement = fileItem.querySelector('.upload-status');
    statusElement.innerHTML = '<i class="bi bi-hourglass text-warning"></i> 初始化中...';
    
    fetch('/api/upload/chunk/init', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: file.name,
            fileSize: file.size,
            chunkSize: chunkSize
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const uploadId = data.data.uploadId;
            const totalChunks = data.data.totalChunks;
            
            statusElement.innerHTML = '<i class="bi bi-upload text-primary"></i> 上传中...';
            
            // 开始分片上传
            uploadChunks(file, uploadId, chunkSize, totalChunks, concurrency, fileItem);
        } else {
            throw new Error(data.error);
        }
    })
    .catch(error => {
        statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 初始化失败';
        console.error('分片上传初始化失败:', error);
    });
}

function uploadChunks(file, uploadId, chunkSize, totalChunks, concurrency, fileItem) {
    const progressBar = fileItem.querySelector('.progress-bar');
    const chunkProgressElement = fileItem.querySelector('.chunk-progress');
    
    let completedChunks = 0;
    let uploadingChunks = 0;
    let currentChunkIndex = 0;
    
    const uploadNextChunk = () => {
        if (currentChunkIndex >= totalChunks || uploadingChunks >= concurrency) {
            return;
        }
        
        const chunkIndex = currentChunkIndex++;
        uploadingChunks++;
        
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        
        fetch('/api/upload/chunk/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadingChunks--;
            
            if (data.success) {
                completedChunks++;
                const progress = (completedChunks / totalChunks) * 100;
                progressBar.style.width = progress + '%';
                progressBar.textContent = Math.round(progress) + '%';
                chunkProgressElement.textContent = `分片 ${completedChunks}/${totalChunks}`;
                
                if (completedChunks === totalChunks) {
                    // 所有分片上传完成，进行合并
                    mergeChunks(uploadId, file.name, fileItem);
                } else {
                    // 继续上传下一个分片
                    uploadNextChunk();
                }
            } else {
                console.error('分片上传失败:', data.error);
            }
        })
        .catch(error => {
            uploadingChunks--;
            console.error('分片上传错误:', error);
        });
        
        // 启动下一个并发上传
        setTimeout(uploadNextChunk, 100);
    };
    
    // 启动初始的并发上传
    for (let i = 0; i < concurrency; i++) {
        uploadNextChunk();
    }
}

function mergeChunks(uploadId, filename, fileItem) {
    const statusElement = fileItem.querySelector('.upload-status');
    statusElement.innerHTML = '<i class="bi bi-puzzle text-info"></i> 合并中...';
    
    fetch('/api/upload/chunk/merge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uploadId: uploadId,
            filename: filename
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusElement.innerHTML = '<i class="bi bi-check-circle text-success"></i> 上传成功';
            const progressBar = fileItem.querySelector('.progress-bar');
            progressBar.classList.add('bg-success');
            
            // 显示上传结果
            showUploadResult(fileItem, data.data);
            
            // 刷新文件列表
            setTimeout(() => {
                loadFilesList();
            }, 1000);
        } else {
            throw new Error(data.error);
        }
    })
    .catch(error => {
        statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 合并失败';
        console.error('分片合并失败:', error);
    });
}

// ============ UI 辅助函数 ============
function createFileItem(file, type, index = null) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    if (index !== null) {
        fileItem.setAttribute('data-file-index', index);
    }
    
    const fileSize = formatFileSize(file.size);
    const fileType = getFileIcon(file.type);
    
    let removeButton = '';
    if (type === 'multiple' && index !== null) {
        removeButton = `<button class="btn btn-sm btn-outline-danger ms-2" onclick="removeMultipleFile(${index})">
                            <i class="bi bi-trash"></i>
                        </button>`;
    }
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="d-flex align-items-center">
                <i class="bi ${fileType.icon} me-2" style="font-size: 24px; color: ${fileType.color};"></i>
                <div>
                    <div class="fw-bold">${file.name}</div>
                    <small class="text-muted">${fileSize}</small>
                </div>
            </div>
            <div class="d-flex align-items-center">
                <div class="upload-status">
                    <i class="bi bi-clock text-muted"></i> 等待上传
                </div>
                ${removeButton}
            </div>
        </div>
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0%">0%</div>
        </div>
        <div class="upload-result mt-2" style="display: none;"></div>
    `;
    
    return fileItem;
}

function createChunkFileItem(file, chunkSize) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileSize = formatFileSize(file.size);
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunkSizeFormatted = formatFileSize(chunkSize);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="d-flex align-items-center">
                <i class="bi bi-file-earmark-zip me-2" style="font-size: 24px; color: #6f42c1;"></i>
                <div>
                    <div class="fw-bold">${file.name}</div>
                    <small class="text-muted">${fileSize} · ${totalChunks} 个分片 · 每片 ${chunkSizeFormatted}</small>
                </div>
            </div>
            <div class="upload-status">
                <i class="bi bi-clock text-muted"></i> 等待上传
            </div>
        </div>
        <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: 0%">0%</div>
        </div>
        <div class="chunk-progress text-muted mt-1" style="font-size: 12px;">分片 0/${totalChunks}</div>
        <div class="upload-result mt-2" style="display: none;"></div>
    `;
    
    return fileItem;
}

function showUploadResult(fileItem, data) {
    const resultElement = fileItem.querySelector('.upload-result');
    resultElement.style.display = 'block';
    resultElement.innerHTML = `
        <div class="alert alert-success py-2 mb-0">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>上传成功!</strong><br>
                    <small>文件名: ${data.filename}</small><br>
                    <small>访问地址: <a href="${data.url}" target="_blank">${data.url}</a></small>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="copyToClipboard('${data.url}')">
                    <i class="bi bi-clipboard"></i> 复制链接
                </button>
            </div>
        </div>
    `;
}

function showUploadError(fileItem, error) {
    const statusElement = fileItem.querySelector('.upload-status');
    const progressBar = fileItem.querySelector('.progress-bar');
    
    statusElement.innerHTML = '<i class="bi bi-x-circle text-danger"></i> 上传失败';
    progressBar.classList.add('bg-danger');
    progressBar.textContent = '失败';
    
    const resultElement = fileItem.querySelector('.upload-result');
    resultElement.style.display = 'block';
    resultElement.innerHTML = `
        <div class="alert alert-danger py-2 mb-0">
            <strong>上传失败:</strong> ${error}
        </div>
    `;
}

function getFileIcon(mimeType) {
    // 图片文件
    if (mimeType.startsWith('image/')) {
        return { icon: 'bi-file-image', color: '#28a745' };
    }
    // PDF文件
    else if (mimeType.includes('pdf')) {
        return { icon: 'bi-file-pdf', color: '#dc3545' };
    }
    // Word文档
    else if (mimeType.includes('word') || mimeType.includes('document')) {
        return { icon: 'bi-file-word', color: '#2b579a' };
    }
    // Excel表格
    else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
        return { icon: 'bi-file-excel', color: '#217346' };
    }
    // PowerPoint演示文稿
    else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
        return { icon: 'bi-file-ppt', color: '#d04423' };
    }
    // 视频文件
    else if (mimeType.startsWith('video/')) {
        return { icon: 'bi-file-play', color: '#6f42c1' };
    }
    // 音频文件
    else if (mimeType.startsWith('audio/')) {
        return { icon: 'bi-file-music', color: '#e83e8c' };
    }
    // 压缩文件
    else if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar') || mimeType.includes('gzip')) {
        return { icon: 'bi-file-zip', color: '#6c757d' };
    }
    // 文本文件
    else if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
        return { icon: 'bi-file-text', color: '#17a2b8' };
    }
    // 代码文件
    else if (mimeType.includes('javascript') || mimeType.includes('python') || mimeType.includes('java') || mimeType.includes('sql')) {
        return { icon: 'bi-file-code', color: '#fd7e14' };
    }
    // 数据文件
    else if (mimeType.includes('csv') || mimeType.includes('database')) {
        return { icon: 'bi-file-earmark-spreadsheet', color: '#20c997' };
    }
    // 默认文件图标
    else {
        return { icon: 'bi-file-earmark', color: '#6c757d' };
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 显示复制成功提示
        const toast = document.createElement('div');
        toast.className = 'toast position-fixed top-0 end-0 m-3';
        toast.innerHTML = `
            <div class="toast-body">
                <i class="bi bi-check-circle text-success"></i> 链接已复制到剪贴板
            </div>
        `;
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    });
}

// ============ 文件管理 ============
function loadFilesList() {
    const filesContainer = document.getElementById('filesList');
    filesContainer.innerHTML = '<div class="text-center py-4"><i class="bi bi-hourglass text-muted"></i> 加载中...</div>';
    
    fetch('/api/upload/files')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFilesList(data.data);
            } else {
                filesContainer.innerHTML = '<div class="text-center py-4 text-danger">加载失败</div>';
            }
        })
        .catch(error => {
            console.error('加载文件列表失败:', error);
            filesContainer.innerHTML = '<div class="text-center py-4 text-danger">加载失败</div>';
        });
}

function displayFilesList(files) {
    const filesContainer = document.getElementById('filesList');
    
    if (files.length === 0) {
        filesContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-folder2-open" style="font-size: 48px; color: #6c757d;"></i>
                <h5 class="mt-3 text-muted">暂无文件</h5>
                <p class="text-muted">上传一些文件来查看它们</p>
            </div>
        `;
        return;
    }
    
    filesContainer.innerHTML = '';
    
    files.forEach(file => {
        const fileCard = createFileCard(file);
        filesContainer.appendChild(fileCard);
    });
}

function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    
    const fileIcon = getFileIcon(file.mimeType || '');
    const fileSize = formatFileSize(file.size);
    const uploadDate = new Date(file.uploadDate).toLocaleDateString();
    
    let preview = '';
    if (file.mimeType && file.mimeType.startsWith('image/')) {
        // 优先使用缩略图，如果没有则使用原图
        const imageUrl = file.thumbnailUrl || file.url;
        preview = `<img src="${imageUrl}" class="file-preview" alt="${file.originalName}" loading="lazy">`;
    } else {
        preview = `<div class="file-icon"><i class="bi ${fileIcon.icon}" style="color: ${fileIcon.color};"></i></div>`;
    }
    
    // 类别标签颜色
    const categoryColors = {
        '头像': 'bg-primary',
        '图片': 'bg-success', 
        '文档': 'bg-info',
        '分片文件': 'bg-warning',
        '其他': 'bg-secondary'
    };
    const categoryColor = categoryColors[file.category] || 'bg-secondary';
    
    card.innerHTML = `
        ${preview}
        <div class="d-flex justify-content-between align-items-start mb-1">
            <div class="text-truncate fw-bold flex-grow-1" title="${file.originalName}">${file.originalName}</div>
            <span class="badge ${categoryColor} ms-1" style="font-size: 0.7em;">${file.category}</span>
        </div>
        <small class="text-muted">${fileSize} · ${uploadDate}</small>
        <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary" onclick="previewFile('${file.filename}', '${file.originalName}', '${file.url}', '${file.mimeType}', '${file.type}')">
                <i class="bi bi-eye"></i> 预览
            </button>
            <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyToClipboard('${file.url}')">
                <i class="bi bi-clipboard"></i>
            </button>
        </div>
    `;
    
    return card;
}

function refreshFilesList() {
    loadFilesList();
}

// 文件预览功能
function previewFile(filename, originalName, url, mimeType, type) {
    const modal = new bootstrap.Modal(document.getElementById('filePreviewModal'));
    const modalTitle = document.getElementById('filePreviewModalLabel');
    const modalContent = document.getElementById('filePreviewContent');
    const downloadBtn = document.getElementById('downloadFileBtn');
    
    // 设置标题
    modalTitle.textContent = originalName || filename;
    
    // 设置下载链接
    downloadBtn.href = `/api/upload/download/${type}/${filename}`;
    
    // 根据文件类型显示不同的预览内容
    if (mimeType && mimeType.startsWith('image/')) {
        // 图片预览
        modalContent.innerHTML = `
            <div class="mb-3">
                <img src="${url}" class="img-fluid" alt="${originalName}" style="max-height: 500px;">
            </div>
            <div class="text-muted">
                <small>点击下载按钮可以保存原图到本地</small>
            </div>
        `;
    } else if (mimeType === 'application/pdf') {
        // PDF预览 (嵌入查看)
        modalContent.innerHTML = `
            <div class="mb-3">
                <embed src="${url}" type="application/pdf" width="100%" height="500px" />
            </div>
            <div class="text-muted">
                <small>如果PDF无法显示，请点击下载按钮</small>
            </div>
        `;
    } else if (mimeType && (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml'))) {
        // 文本文件预览
        fetch(url)
            .then(response => response.text())
            .then(text => {
                modalContent.innerHTML = `
                    <div class="mb-3">
                        <pre class="text-start p-3 bg-light rounded" style="max-height: 400px; overflow-y: auto; white-space: pre-wrap;">${text.substring(0, 5000)}${text.length > 5000 ? '\n\n... (文件太长，仅显示前5000个字符)' : ''}</pre>
                    </div>
                    <div class="text-muted">
                        <small>点击下载按钮可以下载完整文件</small>
                    </div>
                `;
            })
            .catch(error => {
                modalContent.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h6>无法预览此文件</h6>
                        <p>文本文件读取失败: ${error.message}</p>
                        <p>请使用下载按钮下载文件后查看</p>
                    </div>
                `;
            });
        modalContent.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">加载中...</span></div>';
    } else {
        // 不支持预览的文件类型
        const fileIcon = getFileIcon(mimeType);
        modalContent.innerHTML = `
            <div class="alert alert-info">
                <div class="mb-3">
                    <i class="bi ${fileIcon.icon}" style="font-size: 3rem; color: ${fileIcon.color};"></i>
                </div>
                <h6>暂不支持预览此类型文件</h6>
                <p class="mb-2">文件类型: ${mimeType || '未知'}</p>
                <p>请使用下载按钮下载文件后查看</p>
            </div>
        `;
    }
    
    // 显示模态框
    modal.show();
}
