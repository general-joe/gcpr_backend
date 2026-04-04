import fs from 'fs'
import path from 'path'

const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp',  // Images
    '.pdf',                                       // Documents
    '.mp3', '.wav', '.m4a', '.ogg',               // Audio
    '.mp4', '.mov', '.avi',                        // Video
]);

class UploadService {
    static async saveFile (buffer, filename, folder) {
        try {
            const ext = path.extname(filename).toLowerCase();
            if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
                throw new Error(`File type "${ext}" is not allowed`);
            }

            fs.writeFileSync(`./src/files/${folder}/${filename}`, buffer)
            const baseUrl = process.env.GCPR_API_URL
            return `${baseUrl}/${folder}/${filename}`
        } catch (error) {
            console.log("File upload error",error)
            throw error
        }
    }

    // static async uploadFile (file, filename, bucket = CONSTANTS.BUCKET) {
    //     if (['ci', 'local'].includes(process.env.NODE_ENV)) return
    //     const data = {
    //         Key: `${process.env.NODE_ENV}/${filename}`,
    //         Bucket: bucket,
    //         Body: file.buffer,
    //         ContentType: file.mimetype
    //     }
    //     await s3.putObject(data).promise()
    // }

    // static async uploadFileBuffer (buffer, filename, mimetype) {
    //     if (['ci', 'local'].includes(process.env.NODE_ENV)) return
    //     const data = {
    //         Key: `${process.env.NODE_ENV}/${filename}`,
    //         Bucket: CONSTANTS.BUCKET,
    //         Body: buffer,
    //         ContentType: mimetype
    //     }
    //     await s3.putObject(data).promise()
    // }

    // static async getSignedUrl (filename, bucket = CONSTANTS.BUCKET) {
    //     if (['ci', 'local'].includes(process.env.NODE_ENV)) return filename
    //     return s3.getSignedUrl('getObject', {
    //         Key: `${process.env.NODE_ENV}/${filename}`,
    //         Bucket: bucket,
    //         Expires: 3600 * 5
    //     })
    // }

    // static async deleteFile (filename, bucket = CONSTANTS.BUCKET) {
    //     return s3.deleteObject({
    //         Key: `${process.env.NODE_ENV}/${filename}`,
    //         Bucket: bucket
    //     }).promise()
    // }

    // static async downloadFile (filename, bucket = CONSTANTS.BUCKET) {
    //     return s3.getObject({
    //         Key: `${process.env.NODE_ENV}/${filename}`,
    //         Bucket: bucket
    //     }).promise()
    // }

    // static async listFiles (subdirectory = '') {
    //     const params = {
    //         Bucket: CONSTANTS.BUCKET,
    //         Prefix: `${process.env.NODE_ENV}/${subdirectory}`
    //     }
    //     return s3.listObjectsV2(params).promise()
    // }
}

export default UploadService