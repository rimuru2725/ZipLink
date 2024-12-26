const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

// Set up multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Middleware to parse incoming JSON data
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for file data
const fileData = {};

// Function to log file access
function logFileAccess(filename, ipAddress) {
    const logMessage = `${new Date().toISOString()} - File: ${filename}, Accessed by IP: ${ipAddress}\n`;
    fs.appendFileSync('access.log', logMessage, 'utf8');
    console.log(logMessage); // Optional: Log in the console as well
}

// Route to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    const password = req.body.password; // Password sent from the frontend
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Store the password, filename, and timestamp
    fileData[req.file.filename] = {
        password: password || null, // Store password if provided
        timestamp: Date.now(), // Store the upload time
    };

    res.json({
        success: true,
        message: 'File uploaded successfully!',
        filename: req.file.filename,
    });
});

// Route to handle file access
app.get('/access', (req, res) => {
    const { filename, password } = req.query; // Get filename and password from query parameters

    // Check if the file exists in memory (fileData object)
    if (!fileData[filename]) {
        return res.status(404).json({ success: false, message: 'File not found or has expired.' });
    }

    // Check if the file has expired
    const currentTime = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (currentTime - fileData[filename].timestamp > expirationTime) {
        // Delete the file if expired
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        delete fileData[filename];
        return res.status(410).json({ success: false, message: 'File has expired and was deleted.' });
    }

    // Check if the password matches
    if (fileData[filename].password !== password) {
        return res.status(403).json({ success: false, message: 'Incorrect password.' });
    }

    // Serve the file if everything is valid
    const filePath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filePath)) {
        // Log file access details
        logFileAccess(filename, req.ip);

        // Send the file
        res.sendFile(filePath);
    } else {
        res.status(404).json({ success: false, message: 'File not found.' });
    }
});

// Route to handle file download
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
