require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    uploadLimit: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: [
        'image/*',
        'application/pdf',
        'application/zip',
        'text/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};