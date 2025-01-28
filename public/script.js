document.getElementById('sender-btn').addEventListener('click', () => {
    document.getElementById('sender-form').style.display = 'block';
    document.getElementById('recipient-form').style.display = 'none';
});

document.getElementById('receiver-btn').addEventListener('click', () => {
    document.getElementById('recipient-form').style.display = 'block';
    document.getElementById('sender-form').style.display = 'none';
});

// Drag-and-Drop Functionality
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file');
const filePreview = document.getElementById('file-preview');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('dragover');
    });
});

dropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    fileInput.files = files;
    showFilePreview(files[0]);
});

// Click to trigger file input
dropArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    showFilePreview(fileInput.files[0]);
});

function showFilePreview(file) {
    if (file) {
        filePreview.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <span><i class="bi bi-file-earmark me-2"></i>${file.name}</span>
                <span class="remove-file" onclick="removeFile()">❌</span>
            </div>
        `;
        filePreview.style.display = 'block';
    }
}

function removeFile() {
    fileInput.value = '';
    filePreview.style.display = 'none';
}

// Upload form handling
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', document.getElementById('password').value);

    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('upload-progress');
    const uploadStatus = document.getElementById('upload-status');
    const qrCodeSection = document.getElementById('qr-code');
    const qrCodeContainer = document.getElementById('qr-code-container');

    progressContainer.style.display = 'block';
    uploadStatus.style.display = 'none';
    qrCodeSection.style.display = 'none';

    try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3000/upload', true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = `${percentComplete}%`;
                progressText.textContent = `${Math.round(percentComplete)}%`;
            }
        };

        xhr.onload = function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    const fileUrl = `http://localhost:3000/access?filename=${response.filename}&password=${document.getElementById('password').value}`;
                    
                    uploadStatus.innerHTML = `
                        <div class="alert alert-success">
                            File uploaded successfully!<br>
                            Share this link: <a href="${fileUrl}" class="text-light">${fileUrl}</a>
                        </div>
                    `;
                    uploadStatus.style.display = 'block';

                    // Generate QR Code
                    qrCodeContainer.innerHTML = '';
                    new QRCode(qrCodeContainer, {
                        text: fileUrl,
                        width: 128,
                        height: 128
                    });
                    qrCodeSection.style.display = 'block';
                }
            } else {
                uploadStatus.innerHTML = '<div class="alert alert-danger">Upload failed. Please try again.</div>';
                uploadStatus.style.display = 'block';
            }
        };

        xhr.onerror = function() {
            uploadStatus.innerHTML = '<div class="alert alert-danger">Upload failed. Please try again.</div>';
            uploadStatus.style.display = 'block';
        };

        xhr.send(formData);
    } catch (error) {
        uploadStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        uploadStatus.style.display = 'block';
    }
});

// Access form handling
document.getElementById('access-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const filename = document.getElementById('access-filename').value.trim();
    const password = document.getElementById('access-password').value.trim();
    const accessStatus = document.getElementById('access-status');

    try {
        const response = await fetch(`http://localhost:3000/access?filename=${filename}&password=${password}`);
        
        if (response.ok) {
            // If response is OK, create a blob and download it
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            accessStatus.innerHTML = '<div class="alert alert-success">File downloaded successfully!</div>';
            accessStatus.style.display = 'block';
        } else {
            // If response is not OK, show error message
            const error = await response.json();
            accessStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            accessStatus.style.display = 'block';
        }
    } catch (error) {
        accessStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        accessStatus.style.display = 'block';
    }
});