import CONSTANTS from '../utils/constants.js'
import multer from 'multer'

const storage = multer.memoryStorage({
    limits: {
        fileSize: CONSTANTS.MAX_FILE_UPLOAD
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: CONSTANTS.MAX_FILE_UPLOAD
    }
})

export default upload