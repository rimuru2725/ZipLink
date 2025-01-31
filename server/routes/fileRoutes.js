const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Upload route
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
        const downloadUrl = `${req.protocol}://${req.get('host')}/api/download/${fileId}`;

        res.json({
            success: true,
            downloadUrl,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Download route
router.get('/download/:fileId', async (req, res) => {
    try {
        const files = await fs.readdir('uploads/');
        const file = files.find(f => f.startsWith(req.params.fileId));
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const filePath = path.join('uploads', file);
        res.download(filePath);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;