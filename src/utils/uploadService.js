import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Your existing allowed extensions
const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp',  // Images
    '.pdf', '.doc', '.docx',                    // Documents
    '.mp3', '.wav', '.m4a', '.ogg',            // Audio
    '.mp4', '.webm', '.mov', '.avi',            // Video
]);

// Initialize the S3 Client pointed at Cloudflare R2
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

class UploadService {
    /**
     * Uploads a file buffer to Cloudflare R2 and returns the public URL.
     * @param {Buffer} buffer - The file buffer from Multer
     * @param {String} filename - The generated safe filename
     * @param {String} folder - The folder prefix (e.g., 'pdfs', 'videos')
     */
    static async saveFile(buffer, filename, folder) {
        try {
            const ext = path.extname(filename).toLowerCase();
            if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
                throw new Error(`File type "${ext}" is not allowed`);
            }

            // Create a clean key path (e.g., "pdfs/filename.pdf")
            const fileKey = folder ? path.join(folder, filename).replace(/\\/g, "/") : filename;

            // Determine Content-Type based on extension to ensure browsers render correctly
            let contentType = "application/octet-stream";
            if (['.jpg', '.jpeg'].includes(ext)) contentType = "image/jpeg";
            else if (ext === '.png') contentType = "image/png";
            else if (ext === '.gif') contentType = "image/gif";
            else if (ext === '.pdf') contentType = "application/pdf";
            else if (ext === '.mp4') contentType = "video/mp4";
            else if (['.mp3', '.m4a'].includes(ext)) contentType = "audio/mpeg";

            const command = new PutObjectCommand({
                Bucket: "gmnc-bucket", // You can also move this to process.env.R2_BUCKET_NAME
                Key: fileKey,
                Body: buffer,
                ContentType: contentType,
            });

            // Send to Cloudflare R2
            await s3Client.send(command);

            // Return the public CDN URL
            return `${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`;
            
        } catch (error) {
            console.error("Cloudflare R2 File upload error:", error);
            throw error;
        }
    }

    /**
     * Deletes a file from Cloudflare R2 using the file key
     * @param {String} fileKey - The path of the file in the bucket (e.g., "pdfs/filename.pdf")
     */
    static async deleteFile(fileKey) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: "gmnc-bucket",
                Key: fileKey,
            });
            await s3Client.send(command);
        } catch (error) {
            console.error("Cloudflare R2 File delete error:", error);
            throw error;
        }
    }
}

export default UploadService;

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
