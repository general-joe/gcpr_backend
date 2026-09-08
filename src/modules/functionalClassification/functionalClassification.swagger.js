/**
 * @swagger
 * /functional-classification:
 *   post:
 *     summary: Record a GMFCS/MACS/CFCS/EDACS classification (verified providers; optionally linked to its assessment)
 *     tags: [Clinical Assessment]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Creates a severity classification for a patient. An optional
 *       assessmentId links back to the assessment session that produced it,
 *       and the previous latest record for the same scale is automatically
 *       chained via supersededById instead of being overwritten. Creation
 *       also recomputes the MotorFunctionOutcome for that scale. Assessment
 *       forms surface which scales apply per tool and flag stale (>12 month)
 *       records; submissions may reference a classification id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, classifier, level, assessedAt]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               classifier:
 *                 type: string
 *                 enum: [GMFCS, MACS, CFCS, EDACS, VIKING_SPEECH_SCALE, OTHER]
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               assessedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Cannot be in the future.
 *               assessmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional producing assessment (must belong to the same patient).
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Classification recorded.
 *
 * /functional-classification/patient/{patientId}:
 *   get:
 *     summary: List classifications for a patient (paginated, optional scale filter)
 *     tags: [Clinical Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: patientId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Classification records retrieved.
 *
 * /functional-classification/patient/{patientId}/summary:
 *   get:
 *     summary: Per-scale progress summary with trends and latest motor outcome
 *     tags: [Clinical Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: patientId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress summary retrieved.
 *
 * /functional-classification/{id}:
 *   get:
 *     summary: Get one classification record
 *     tags: [Clinical Assessment]
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
 *         description: Classification record retrieved.
 *   patch:
 *     summary: Update own classification record (recomputes the linked motor outcome)
 *     tags: [Clinical Assessment]
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
 *         description: Classification record updated.
 *   delete:
 *     summary: Delete own classification record (relinks history chain, recomputes outcome)
 *     tags: [Clinical Assessment]
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
 *         description: Classification record deleted.
 */
