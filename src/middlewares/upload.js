import CONSTANTS from '../utils/constants.js'
import multer from 'multer'

const storage = multer.memoryStorage()

const defaultLimits = {
    fileSize: CONSTANTS.MAX_FILE_UPLOAD,
}

const upload = multer({
    storage,
    limits: defaultLimits,
})

export function imageUpload() {
    return multer({
        storage,
        limits: defaultLimits,
        fileFilter: (_req, file, cb) => {
            if (file.mimetype?.startsWith('image/')) {
                cb(null, true)
                return
            }
            cb(new Error('Only image uploads are allowed'))
        },
    })
}

export function documentUpload() {
    return multer({
        storage,
        limits: defaultLimits,
        fileFilter: (_req, file, cb) => {
            const allowed = new Set([
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/webp',
            ])
            if (allowed.has(file.mimetype)) {
                cb(null, true)
                return
            }
            cb(new Error('Only PDF or image uploads are allowed'))
        },
    })
}

export default upload
