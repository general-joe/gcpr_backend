/**
 * @swagger
 * /admin/assessment-tools:
 *   get:
 *     summary: List tool definitions with current published versions
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Admin view of the configurable tool engine. These definitions are the
 *       single runtime source the assessment form and submit endpoints read;
 *       the legacy config files are only the one-time migration seed.
 *     responses:
 *       200:
 *         description: Tool definitions retrieved.
 *   post:
 *     summary: Create a tool draft (code, name, scales, professions, scoring strategy)
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code:
 *                 type: string
 *                 description: UPPER_SNAKE unique code, e.g. GMFM_88.
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               applicableScales:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowedProfessions:
 *                 type: array
 *                 items:
 *                   type: string
 *               scoringStrategy:
 *                 type: string
 *                 enum: [SUM, WEIGHTED_SUM, RUBRIC, CUSTOM_FN_REF]
 *               customFnRef:
 *                 type: string
 *                 description: Registered scorer key when strategy is CUSTOM_FN_REF.
 *     responses:
 *       200:
 *         description: Tool draft created.
 *
 * /admin/assessment-tools/{id}:
 *   get:
 *     summary: Get a tool draft with sections, fields, and recent versions
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool definition retrieved.
 *   patch:
 *     summary: Edit tool draft metadata (never touches published versions)
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool draft updated.
 *
 * /admin/assessment-tools/{id}/preview:
 *   get:
 *     summary: Preview the client-facing form schema without a patient or submission
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool preview rendered.
 *
 * /admin/assessment-tools/{id}/publish:
 *   post:
 *     summary: Freeze the draft into a new immutable version (only published versions are submittable)
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Publishing snapshots the full field tree; later edits publish a new
 *       version instead of mutating history, so past submissions stay
 *       interpretable. Submissions record the exact version used.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool version published.
 *
 * /admin/assessment-tools/{id}/sections:
 *   post:
 *     summary: Add a section to a tool draft
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Section added.
 *
 * /admin/assessment-tools/sections/{sectionId}:
 *   patch:
 *     summary: Edit a draft section
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sectionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section updated.
 *   delete:
 *     summary: Delete a draft section (fields cascade)
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sectionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section deleted.
 *
 * /admin/assessment-tools/{id}/sections/{sectionId}/fields:
 *   post:
 *     summary: Add a field with a stable immutable fieldKey
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       fieldKey is assigned once at creation and can never change, so
 *       reordering fields cannot corrupt historical answer mappings.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: sectionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fieldKey, label, fieldType]
 *             properties:
 *               fieldKey:
 *                 type: string
 *               label:
 *                 type: string
 *               helpText:
 *                 type: string
 *               fieldType:
 *                 type: string
 *                 enum: [SINGLE_CHOICE, MULTI_CHOICE, SCALE_1_5, NUMBER, TEXT, DATE, BOOLEAN, FILE_UPLOAD]
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *               validation:
 *                 type: object
 *               scoringWeight:
 *                 type: number
 *     responses:
 *       200:
 *         description: Field added.
 *
 * /admin/assessment-tools/fields/{fieldId}:
 *   patch:
 *     summary: Edit a draft field (fieldKey itself is immutable)
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fieldId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field updated.
 *   delete:
 *     summary: Delete a draft field
 *     tags: [Admin & RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: fieldId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field deleted.
 */
