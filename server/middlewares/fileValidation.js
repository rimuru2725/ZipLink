const config = require('../config');

const fileValidation = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileSize = req.file.size;
    if (fileSize > config.uploadLimit) {
        return res.status(400).json({ 
            message: 'File size exceeds limit' 
        });
    }

    next();
};

module.exports = fileValidation;