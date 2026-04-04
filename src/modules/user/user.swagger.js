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
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         phoneNumber:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE]
 *         role:
 *           type: string
 *           enum: [SERVICE_PROVIDER, CAREGIVER]
 *         profileImage:
 *           type: string
 *           nullable: true
 *         verified:
 *           type: boolean
 *         address:
 *           type: string
 *           nullable: true
 *         digitalAddress:
 *           type: string
 *           nullable: true
 *         dateOfBirth:
 *           type: string
 *           format: date
 *
 *     VideoInfo:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Video title
 *         videoId:
 *           type: string
 *           description: YouTube video ID
 *         videoUrl:
 *           type: string
 *           format: uri
 *           description: Direct URL to the YouTube video
 *         channelId:
 *           type: string
 *           description: YouTube channel ID
 *         thumbnail:
 *           type: string
 *           format: uri
 *           description: URL to video thumbnail
 *         description:
 *           type: string
 *           description: Video description
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Publication date and time
 *         channelTitle:
 *           type: string
 *           description: Name of the YouTube channel
 *
 *     VideoListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         videos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VideoInfo'
 *           description: Array of video objects
 *         pageInfo:
 *           type: object
 *           description: Pagination information
 *           properties:
 *             totalResults:
 *               type: integer
 *               description: Total number of videos available
 *             resultsPerPage:
 *               type: integer
 *               description: Number of results per page
 *         fromCache:
 *           type: boolean
 *           description: Whether the data was served from cache (1 hour TTL)
 *
 * /user/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Returns the profile for the currently authenticated user. Requires a valid Bearer JWT.
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized or invalid token
 *       403:
 *         description: Forbidden - insufficient role permissions
 *
 * /user/videos:
 *   get:
 *     summary: List all videos from the YouTube channel (with database caching)
 *     tags: [User, Videos]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all videos from the YouTube channel with intelligent database caching. Videos are cached for 1 hour to reduce API calls. If no cache exists, fresh videos are fetched from YouTube API and stored in the database. Available to all authenticated users (SERVICE_PROVIDER and CAREGIVER).
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of videos per page
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: Pagination token from previous response
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [date, rating, relevance, title, videoCount, viewCount]
 *           default: date
 *         description: Order of videos in the response
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       $ref: '#/components/schemas/VideoListResponse'
 *                 message:
 *                   type: string
 *                   example: Videos retrieved successfully
 *       401:
 *         description: Unauthorized or invalid token
 *       403:
 *         description: Forbidden - insufficient role permissions
 *
 * /user/deactivate-account:
 *   post:
 *     summary: Deactivate the authenticated user's account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     description: Deactivates the currently authenticated user's account. This sets the account status to DEACTIVATED. The action is reversible by contacting support.
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: Account deactivated successfully
 *       401:
 *         description: Unauthorized or invalid token
 *       403:
 *         description: Forbidden - insufficient role permissions
 */
