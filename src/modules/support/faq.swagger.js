/**
 * @swagger
 * tags:
 *   - name: FAQ
 *     description: Public and authenticated FAQ access
 *   - name: Admin FAQ
 *     description: Admin management of FAQ content and categories
 */

/**
 * @swagger
 * /faq/search:
 *   get:
 *     summary: Search published FAQs
 *     tags: [FAQ]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved
 */

/**
 * @swagger
 * /faq/categories:
 *   get:
 *     summary: List active FAQ categories
 *     tags: [FAQ]
 *     responses:
 *       200:
 *         description: FAQ categories retrieved
 */

/**
 * @swagger
 * /faq:
 *   get:
 *     summary: List published FAQs grouped by category
 *     tags: [FAQ]
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQs retrieved
 */

/**
 * @swagger
 * /faq/{id}:
 *   get:
 *     summary: Get FAQ details by ID
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ retrieved
 */

/**
 * @swagger
 * /faq/{id}/helpful:
 *   post:
 *     summary: Mark FAQ as helpful (authenticated users only)
 *     tags: [FAQ]
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
 *         description: Helpful count updated
 */

/**
 * @swagger
 * /admin/faq:
 *   get:
 *     summary: List FAQs for admin management
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: FAQs retrieved
 *   post:
 *     summary: Create FAQ
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, question, answer]
 *             properties:
 *               categoryId:
 *                 type: string
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: FAQ created
 */

/**
 * @swagger
 * /admin/faq/{id}:
 *   patch:
 *     summary: Update FAQ
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: FAQ updated
 *   delete:
 *     summary: Delete FAQ
 *     tags: [Admin FAQ]
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
 *         description: FAQ deleted
 */

/**
 * @swagger
 * /admin/faq/{id}/publish:
 *   post:
 *     summary: Publish FAQ
 *     tags: [Admin FAQ]
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
 *         description: FAQ published
 */

/**
 * @swagger
 * /admin/faq/{id}/unpublish:
 *   post:
 *     summary: Unpublish FAQ
 *     tags: [Admin FAQ]
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
 *         description: FAQ unpublished
 */

/**
 * @swagger
 * /admin/faq/categories:
 *   post:
 *     summary: Create FAQ category
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category created
 */

/**
 * @swagger
 * /admin/faq/categories/{id}:
 *   patch:
 *     summary: Update FAQ category
 *     tags: [Admin FAQ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 *   delete:
 *     summary: Delete FAQ category
 *     tags: [Admin FAQ]
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
 *         description: Category deleted
 */
