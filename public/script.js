// DOM Elements
const uploadTab = document.getElementById('upload-tab');
const downloadTab = document.getElementById('download-tab');
const uploadSection = document.getElementById('upload-section');
const downloadSection = document.getElementById('download-section');
const dropZone = document.querySelector('.drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-btn');
const uploadModal = document.getElementById('upload-modal');
const themeToggle = document.getElementById('theme-toggle');

// State management
let files = new Map(); // Store file objects with metadata
let isDarkTheme = true;

// Theme Toggle
themeToggle.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme');
    themeToggle.querySelector('.material-icons').textContent = 
        isDarkTheme ? 'dark_mode' : 'light_mode';
});

// Tab Navigation
uploadTab.addEventListener('click', () => {
    uploadTab.classList.add('bg-blue-500');
    downloadTab.classList.remove('bg-blue-500');
    uploadSection.classList.remove('hidden');
    downloadSection.classList.add('hidden');
});

downloadTab.addEventListener('click', () => {
    downloadTab.classList.add('bg-blue-500');
    uploadTab.classList.remove('bg-blue-500');
    downloadSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
});

// Drag and Drop Handling
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
    });
});

dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);

// File Handling Functions
function handleDrop(e) {
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
}

function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    handleFiles(selectedFiles);
}

function handleFiles(fileList) {
    Array.from(fileList).forEach(file => {
        // Generate unique ID for each file
        const fileId = generateFileId();
        files.set(fileId, {
            file: file,
            status: 'pending',
            progress: 0
        });
        displayFile(file, fileId);
    });
    updateUploadButton();
}

function generateFileId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        pdf: 'picture_as_pdf',
        jpg: 'image',
        jpeg: 'image',
        png: 'image',
        gif: 'gif',
        doc: 'description',
        docx: 'description',
        xls: 'table_chart',
        xlsx: 'table_chart',
        zip: 'folder_zip',
        rar: 'folder_zip'
    };
    return iconMap[extension] || 'insert_drive_file';
}

function displayFile(file, fileId) {
    const fileElement = document.createElement('div');
    fileElement.className = 'bg-gray-800 rounded-lg p-4 flex items-center space-x-4';
    fileElement.innerHTML = `
        <span class="material-icons text-blue-500">${getFileIcon(file.name)}</span>
        <div class="flex-1">
            <div class="font-medium truncate">${file.name}</div>
            <div class="text-sm text-gray-400">${formatFileSize(file.size)}</div>
        </div>
        <div class="file-progress hidden">
            <svg class="progress-ring" width="24" height="24">
                <circle class="progress-ring-circle" stroke="currentColor" stroke-width="2"
                    fill="transparent" r="10" cx="12" cy="12"/>
            </svg>
        </div>
        <button onclick="removeFile('${fileId}')" class="text-red-500 hover:text-red-400">
            <span class="material-icons">close</span>
        </button>
    `;
    fileList.appendChild(fileElement);
}

function removeFile(fileId) {
    const fileElements = fileList.children;
    for (let i = 0; i < fileElements.length; i++) {
        if (fileElements[i].dataset.fileId === fileId) {
            fileElements[i].remove();
            break;
        }
    }
    files.delete(fileId);
    updateUploadButton();
}

function updateUploadButton() {
    uploadBtn.disabled = files.size === 0;
    uploadBtn.classList.toggle('opacity-50', files.size === 0);
}

// Upload Handling
uploadBtn.addEventListener('click', handleUpload);

async function handleUpload() {
    if (files.size === 0) return;

    const password = document.querySelector('input[type="password"]').value;
    const expiryTime = document.querySelector('select').value;

    for (const [fileId, fileData] of files) {
        try {
            const formData = new FormData();
            formData.append('file', fileData.file);
            formData.append('password', password);
            formData.append('expiryHours', expiryTime);

            const response = await uploadFile(formData, fileId);
            if (response.success) {
                showUploadSuccess(response);
            } else {
                showError('Upload failed: ' + response.message);
            }
        } catch (error) {
            showError('Upload error: ' + error.message);
        }
    }
}

async function uploadFile(formData, fileId) {
    try {
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        updateUploadProgress(fileId, 100);
        return await response.json();
    } catch (error) {
        throw new Error('Upload failed: ' + error.message);
    }
}

function updateUploadProgress(fileId, progress) {
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
        const progressCircle = fileElement.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 10;
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
}

// Download Handling
document.getElementById('download-btn').addEventListener('click', handleDownload);

async function handleDownload() {
    const fileLink = document.querySelector('#download-section input[type="text"]').value;
    const password = document.querySelector('#download-section input[type="password"]').value;

    try {
        const response = await fetch(fileLink, {
            method: 'GET',
            headers: {
                'x-password': password
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getFilenameFromResponse(response);
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showSuccess('File downloaded successfully!');
        } else {
            const error = await response.json();
            showError(error.message);
        }
    } catch (error) {
        showError('Download failed: ' + error.message);
    }
}

// UI Helpers
function showUploadSuccess(response) {
    const shareLink = document.getElementById('share-link');
    shareLink.value = response.downloadUrl;

    // Generate QR Code
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: response.downloadUrl,
        width: 128,
        height: 128
    });

    uploadModal.classList.remove('hidden');
}

function closeModal() {
    uploadModal.classList.add('hidden');
    // Clear file list and reset state
    fileList.innerHTML = '';
    files.clear();
    updateUploadButton();
}

function copyToClipboard() {
    const shareLink = document.getElementById('share-link');
    shareLink.select();
    document.execCommand('copy');
    showSuccess('Link copied to clipboard!');
}

function showSuccess(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "#10B981",
        }
    }).showToast();
}

function showError(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "#EF4444",
        }
    }).showToast();
}

// Helper function to get filename from response headers
function getFilenameFromResponse(response) {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
            return matches[1].replace(/['"]/g, '');
        }
    }
    return 'downloaded-file';
}

// Initialize the UI
updateUploadButton();