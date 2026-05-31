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
 *     Resource:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         type:
 *           type: string
 *           enum: [DOCUMENT, VIDEO, LINK]
 *         resourceUrl:
 *           type: string
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
 *     ResourceUploadRequest:
 *       type: object
 *       required:
 *         - title
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the resource
 *         description:
 *           type: string
 *           description: Description of the resource
 *         type:
 *           type: string
 *           enum: [DOCUMENT, VIDEO, LINK]
 *           description: Type of the resource
 *         file:
 *           type: string
 *           format: binary
 *           description: File to upload (required if type is DOCUMENT or VIDEO)
 *         resourceUrl:
 *           type: string
 *           description: External URL (required if type is LINK)
 *
 *     ResourceUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the resource
 *         description:
 *           type: string
 *           description: Description of the resource
 *         type:
 *           type: string
 *           enum: [DOCUMENT, VIDEO, LINK]
 *           description: Type of the resource
 *         file:
 *           type: string
 *           format: binary
 *           description: File to upload (optional, for DOCUMENT/VIDEO)
 *         resourceUrl:
 *           type: string
 *           description: External URL (optional, for LINK)
 *
 * /resource:
 *   post:
 *     summary: Upload a new resource (Document, Video, or Link)
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ResourceUploadRequest'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceUploadRequest'
 *     responses:
 *       200:
 *         description: Resource uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only service providers can upload resources
 *       422:
 *         description: Unsupported file type
 *
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
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
 *                     $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *
 * /resource/{id}:
 *   get:
 *     summary: Get a specific resource by ID
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
 *         description: Resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resource not found
 *
 *   put:
 *     summary: Update a resource
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
 *             $ref: '#/components/schemas/ResourceUpdateRequest'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceUpdateRequest'
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only the owner can update this resource
 *       404:
 *         description: Resource not found
 *       422:
 *         description: Unsupported file type
 *
 *   delete:
 *     summary: Delete a resource
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
 *         description: Resource deleted successfully
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
 *         description: Resource not found
 *
 * /resource/{id}/download:
 *   get:
 *     summary: Download or view a resource file
 *     description: Redirects to the Cloudflare R2 public URL for Documents and Videos. Links cannot be downloaded.
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
 *       302:
 *         description: Redirect to the Cloudflare R2 URL
 *       400:
 *         description: External links cannot be downloaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Resource not found or no file associated
 */