// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.querySelector('.upload-btn');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片数据
let currentFile = null;
let originalImageData = null;

// 事件监听器
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', handleQualityChange);
downloadBtn.addEventListener('click', handleDownload);

// 处理拖拽
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#3498db';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = '#2c3e50';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// 处理文件
function handleFile(file) {
    if (!file.type.match('image.*')) {
        alert('请选择图片文件！');
        return;
    }

    currentFile = file;
    originalSize.textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImageData = e.target.result;
        originalImage.src = originalImageData;
        compressImage(originalImageData, qualitySlider.value / 100);
    };
    reader.readAsDataURL(file);
}

// 压缩图片
function compressImage(dataUrl, quality) {
    const img = new Image();
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算压缩后的尺寸
        let targetWidth = img.width;
        let targetHeight = img.height;

        // 如果图片尺寸过大，等比例缩小
        const MAX_WIDTH = 2048;
        const MAX_HEIGHT = 2048;
        if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
            if (targetWidth / targetHeight > MAX_WIDTH / MAX_HEIGHT) {
                targetHeight = Math.round((MAX_WIDTH * targetHeight) / targetWidth);
                targetWidth = MAX_WIDTH;
            } else {
                targetWidth = Math.round((MAX_HEIGHT * targetWidth) / targetHeight);
                targetHeight = MAX_HEIGHT;
            }
        }

        // 设置canvas尺寸
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 清除之前的绘制内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 如果之前有URL，先清理掉
        if (compressedImage.src) {
            URL.revokeObjectURL(compressedImage.src);
        }

        // 根据图片类型选择压缩策略
        let outputType = currentFile.type;
        let compressionQuality = quality;

        // 对于PNG图片，使用较低的质量以实现更好的压缩效果
        if (currentFile.type === 'image/png') {
            // 如果是PNG，转换为JPEG来实现更好的压缩效果
            outputType = 'image/jpeg';
            // PNG转JPEG时使用较高的基础质量
            compressionQuality = Math.max(0.7, quality);
        }

        // 压缩
        canvas.toBlob(
            (blob) => {
                // 如果压缩后的大小反而变大了，就使用原图
                if (blob.size > currentFile.size && quality > 0.8) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        compressedImage.src = e.target.result;
                        compressedSize.textContent = formatFileSize(currentFile.size);
                        downloadBtn.disabled = false;
                    };
                    reader.readAsDataURL(currentFile);
                } else {
                    const url = URL.createObjectURL(blob);
                    compressedImage.src = url;
                    compressedSize.textContent = formatFileSize(blob.size);
                    downloadBtn.disabled = false;
                }
            },
            outputType,
            compressionQuality
        );
    };

    img.src = dataUrl;
}

// 处理质量滑块变化
function handleQualityChange(e) {
    const quality = e.target.value;
    qualityValue.textContent = quality + '%';
    if (originalImageData) {
        // 添加延迟以避免频繁压缩
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            compressImage(originalImageData, quality / 100);
        }, 100);
    }
}

// 处理下载
function handleDownload() {
    if (!compressedImage.src) return;
    
    const link = document.createElement('a');
    link.download = `compressed_${currentFile.name}`;
    link.href = compressedImage.src;
    link.click();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 页面卸载时清理资源
window.addEventListener('unload', () => {
    if (compressedImage.src) {
        URL.revokeObjectURL(compressedImage.src);
    }
});

// 创建上传图标
function createUploadIcon() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    document.querySelector('.upload-icon').src = url;
}