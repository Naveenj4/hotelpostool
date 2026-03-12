const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Redundant hardcoded check removed, handled dynamically in storage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subDir = 'products';
        if (req.originalUrl.includes('staff')) subDir = 'staff';
        if (req.originalUrl.includes('products')) subDir = 'products';
        if (req.originalUrl.includes('restaurant')) subDir = 'restaurant';
        
        const dir = `uploads/${subDir}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
