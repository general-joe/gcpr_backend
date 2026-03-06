import CONSTANTS from '../utils/constants.js'
import multer from 'multer'

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true)
    } else {
        cb(new Error('Only video files are allowed'), false)
    }
}

const videoUpload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // example: 100MB
    },
    fileFilter
})

export default videoUpload