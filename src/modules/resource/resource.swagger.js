/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     PDFResource:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         pdfFile:
 *           type: array
 *           items:
 *             type: string
 *         serviceProviderId:
 *           type: string
 *         serviceProvider:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             user:
 *               type: object
 *               properties:
 *                 fullName:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                   nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PDFResourceUploadRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the PDF resource
 *         description:
 *           type: string
 *           description: Description of the PDF resource
 *         pdfFile:
 *           type: string
 *           format: binary
 *           description: PDF file to upload
 *
 *     PDFResourceUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the PDF resource
 *         description:
 *           type: string
 *           description: Description of the PDF resource
 *         pdfFile:
 *           type: string
 *           format: binary
 *           description: PDF file to upload (optional)
 *
 * /resource:
 *   post:
 *     summary: Upload a new PDF resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PDFResourceUploadRequest'
 *     responses:
 *       200:
 *         description: PDF resource uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PDFResource'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error (title required)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only service providers can upload resources
 *       422:
 *         description: Unsupported file type (only PDF allowed)
 *
 *   get:
 *     summary: Get all PDF resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PDFResource'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *
 * /resource/{id}:
 *   get:
 *     summary: Get a specific PDF resource by ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PDFResource'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: PDF resource not found
 *
 *   put:
 *     summary: Update a PDF resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PDFResourceUpdateRequest'
 *     responses:
 *       200:
 *         description: PDF resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PDFResource'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the owner can update this resource
 *       404:
 *         description: PDF resource not found
 *       422:
 *         description: Unsupported file type (only PDF allowed)
 *
 *   delete:
 *     summary: Delete a PDF resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF resource deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties: {}
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the owner can delete this resource
 *       404:
 *         description: PDF resource not found
 *
 * /resource/{id}/download:
 *   get:
 *     summary: Download a PDF resource file
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: PDF resource not found or no file associated
 */