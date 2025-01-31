# ZipLink

A peer-to-peer file sharing web application that allows users to upload, securely share, and access files using a simple and intuitive interface. The application uses a password protection mechanism, file expiration, and QR code generation for easy file sharing and download.

## 🚀 Features

- **User Roles**:  
  - **Sender**: Upload files to share with others.
  - **Receiver**: Download files by providing a filename and password.
  
- **Password Protection**:  
  Uploaders can set an optional password to protect their files. Only those with the correct password can download the file.

- **Drag-and-Drop Upload**:  
  Upload files effortlessly using drag-and-drop or by selecting files directly from the file explorer.

- **Progress Tracking**:  
  Track the upload progress with a dynamic progress bar, and monitor the percentage completion.

- **QR Code Generation**:  
  After uploading, a unique QR code is generated for easy access to the file.

- **File Expiration**:  
  Uploaded files automatically expire after 24 hours to ensure that only recent uploads are accessible.

- **Responsive Interface**:  
  The application uses Bootstrap for a clean, responsive design that works on all devices.

## 🛠 Technologies Used

- **Node.js**  
- **Express**  
- **Multer (for file uploads)**  
- **HTML, CSS, and Bootstrap**  
- **JavaScript (for dynamic interactions)**  
- **QRCode.js** (for generating QR codes)  
- **File System (FS module in Node.js)**  
- **Nodemailer (for future email notifications - optional)**


## 📄 Usage

1. **For Senders**:  
   - Click the **Sender (Upload)** button.
   - Select a file to upload, set an optional password, and hit **Upload**.
   - Once uploaded, a URL and QR code will be generated to share with the recipient.

2. **For Receivers**:  
   - Click the **Receiver (Access)** button.
   - Enter the filename and the password (if any) provided by the sender.
   - Click **Access File** to download the file.

## ⚙️ Future Enhancements

- **File Versioning**: Allow multiple versions of the same file to be uploaded.
- **User Authentication**: Implement user authentication to track files uploaded by specific users.
- **Email Notifications**: Send notifications when files are uploaded or accessed (using Nodemailer).
- **Dark/Light Mode**: Offer theme customization for the interface.
- **File Preview**: Display a preview of files (images, videos) before downloading.

## 👨‍💻 Contributors

- **Vivek** - Creator and Lead Developer

Feel free to fork this repository, raise issues, or submit pull requests. Contributions are always welcome!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
