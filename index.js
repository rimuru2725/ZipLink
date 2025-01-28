const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer with file size limits and file filter
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB limit
    },
    fileFilter: (req, file, cb) => {
        // Add file type restrictions if needed
        cb(null, true);
    }
});

// Enable CORS with specific options
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for file data
const fileData = new Map();

// Clean up expired files periodically (every hour)
setInterval(() => {
    const currentTime = Date.now();
    for (const [filename, data] of fileData.entries()) {
        if (currentTime - data.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
            // Delete expired file
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error(`Error deleting expired file ${filename}:`, err);
                    else console.log(`Deleted expired file: ${filename}`);
                });
            }
            fileData.delete(filename);
        }
    }
}, 60 * 60 * 1000); // Run every hour

// Function to log file access
function logFileAccess(filename, ipAddress) {
    const logMessage = `${new Date().toISOString()} - File: ${filename}, Accessed by IP: ${ipAddress}\n`;
    fs.appendFile('access.log', logMessage, 'utf8', (err) => {
        if (err) console.error('Error writing to access log:', err);
    });
}

// Route to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Store file data with password and timestamp
        fileData.set(req.file.filename, {
            password: req.body.password || '',
            timestamp: Date.now(),
            originalName: req.file.originalname
        });

        res.json({
            success: true,
            message: 'File uploaded successfully!',
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during upload'
        });
    }
});

// Route to handle file access
app.get('/access', (req, res) => {
    try {
        const { filename, password } = req.query;

        // Check if file exists in our records
        if (!fileData.has(filename)) {
            return res.status(404).json({
                success: false,
                message: 'File not found or has expired.'
            });
        }

        const fileInfo = fileData.get(filename);

        // Check if file has expired (24 hours)
        if (Date.now() - fileInfo.timestamp > 24 * 60 * 60 * 1000) {
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            fileData.delete(filename);
            return res.status(410).json({
                success: false,
                message: 'File has expired and was deleted.'
            });
        }

        // Check password if one was set
        if (fileInfo.password && fileInfo.password !== password) {
            return res.status(403).json({
                success: false,
                message: 'Incorrect password.'
            });
        }

        const filePath = path.join(uploadDir, filename);
        
        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            fileData.delete(filename);
            return res.status(404).json({
                success: false,
                message: 'File not found on server.'
            });
        }

        // Log access
        logFileAccess(filename, req.ip);

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Send file
        res.sendFile(filePath);
    } catch (error) {
        console.error('Access error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during file access'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Upload directory: ${uploadDir}`);
});