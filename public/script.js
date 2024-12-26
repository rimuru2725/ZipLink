// QRCode is now available globally because of the CDN script

// Handle Role Selection (Sender or Receiver)
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
const filePreview = document.getElementById('file-preview'); // To show the file name

dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('bg-info');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('bg-info');
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('bg-info');
    const files = event.dataTransfer.files;
    fileInput.files = files; // Assign files to hidden input
    showFilePreview(files[0]);
});

// Click to trigger file input
dropArea.addEventListener('click', () => {
    fileInput.click();
});

// Show the file name when the user selects a file
fileInput.addEventListener('change', () => {
    showFilePreview(fileInput.files[0]);
});

// Function to display the file name and allow removing the file
function showFilePreview(file) {
    if (file) {
        filePreview.innerHTML = `
            <p><strong>File Selected:</strong> ${file.name} <span class="remove-file" onclick="removeFile()">❌</span></p>
        `;
        filePreview.style.display = 'block';
    }
}

// Function to remove the selected file
function removeFile() {
    fileInput.value = '';  // Clear the input field
    filePreview.style.display = 'none'; // Hide the file preview
}

// Upload file functionality for sender (User 1)
document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const passwordInput = document.getElementById('password');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text'); // For displaying percentage
    const progressContainer = document.getElementById('upload-progress');
    const uploadStatus = document.getElementById('upload-status');
    const qrCodeSection = document.getElementById('qr-code');
    const qrCodeContainer = document.getElementById('qr-code-container');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('password', passwordInput.value);

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);

    // Update progress bar
    xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.style.width = `${percentComplete}%`;
            progressText.textContent = `${Math.round(percentComplete)}%`;  // Show percentage inside progress bar

            // Change the color based on progress
            if (percentComplete <= 50) {
                progressBar.style.backgroundColor = 'black'; // 0-50% -> black
            } else {
                progressBar.style.backgroundColor = 'blue'; // 51-100% -> blue
            }
        }
    });

    xhr.onload = async () => {
        if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
                const fileUrl = `http://localhost:3000/access?filename=${result.filename}&password=${passwordInput.value}`;
                uploadStatus.textContent = `File uploaded successfully! Share this link: ${fileUrl}`;
                uploadStatus.classList.add('success');
                uploadStatus.style.display = 'block';

                // Generate QR Code
                qrCodeContainer.innerHTML = '';
                QRCode.toCanvas(qrCodeContainer, fileUrl, { width: 200 }, (error) => {
                    if (error) console.error('Error generating QR code:', error);
                    else qrCodeSection.style.display = 'block';
                });
            } else {
                uploadStatus.textContent = result.message;
                uploadStatus.style.display = 'block';
            }
        } else {
            uploadStatus.textContent = 'An error occurred. Please try again.';
            uploadStatus.style.display = 'block';
        }
    };

    xhr.onerror = () => {
        uploadStatus.textContent = 'An error occurred during the upload.';
        uploadStatus.style.display = 'block';
    };

    xhr.send(formData);
});

// Access file functionality for recipient (User 2)
document.getElementById('access-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const filenameInput = document.getElementById('access-filename');
    const passwordInput = document.getElementById('access-password');

    const filename = filenameInput.value.trim();
    const password = passwordInput.value.trim();

    const accessStatus = document.getElementById('access-status');

    try {
        const response = await fetch(`/access?filename=${filename}&password=${password}`, {
            method: 'GET',
        });

        if (response.ok) {
            const fileBlob = await response.blob();
            const fileURL = URL.createObjectURL(fileBlob);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = filename;
            link.click();
            accessStatus.textContent = 'File downloaded successfully!';
            accessStatus.style.display = 'block';
        } else {
            const error = await response.json();
            accessStatus.textContent = `Error: ${error.message}`;
            accessStatus.style.display = 'block';
        }
    } catch (error) {
        console.error('Error accessing file:', error);
        accessStatus.textContent = 'An error occurred. Please try again.';
        accessStatus.style.display = 'block';
    }
});
