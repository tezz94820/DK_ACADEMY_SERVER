import multer,{ Multer } from 'multer';

// Set up storage for file uploads
const storage = multer.memoryStorage(); // You can customize the storage as per your needs

// Set up Multer middleware with file size limits and storage configuration
const upload:Multer = multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 5MB limit (adjust as needed)
    },
    fileFilter: (req, file, cb) => {
      // Add file type validation here if needed
      if (file.mimetype.startsWith('application/pdf') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },

  });

export { upload };
