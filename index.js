const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const fileRoutes = require('./server/routes/fileRoutes');
const config = require('./server/config');

// Initialize express app
const app = express();

// Security middleware
// Modify your helmet configuration in index.js
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net"
        ],
        styleSrc: ["'self'", "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    }
  }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// File cleanup service
async function cleanupExpiredFiles() {
    try {
        const uploadDir = path.join(__dirname, 'uploads');
        const files = await fs.readdir(uploadDir);
        
        for (const file of files) {
            const filePath = path.join(uploadDir, file);
            const stats = await fs.stat(filePath);
            const fileAge = Date.now() - stats.mtime.getTime();
            
            // Delete files older than 24 hours (or their specified expiry time)
            if (fileAge > 24 * 60 * 60 * 1000) {
                await fs.unlink(filePath);
                console.log(`Deleted expired file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error during file cleanup:', error);
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

// Logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Delete uploaded file if there's an error during processing
    if (req.file) {
        fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// API routes
app.use('/api', fileRoutes);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true })
    .catch(console.error);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`
    🚀 Server is running on port ${port}
    📁 Upload directory: ${uploadDir}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;