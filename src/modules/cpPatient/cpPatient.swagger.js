/**
 * @swagger
 * /cp-patient:
 *   post:
 *     summary: Create a CP patient
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, dateOfBirth, gender, address, placeOfBirth, relationToCaregiver, householdSize]
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               address:
 *                 type: string
 *               placeOfBirth:
 *                 type: string
 *               birthWeight:
 *                 type: number
 *               numberOfSiblings:
 *                 type: number
 *               relationToCaregiver:
 *                 type: string
 *                 enum: [PARENT, GUARDIAN, SIBLING, OTHER]
 *               householdSize:
 *                 type: number
 *               schoolEnrollmmentStatus:
 *                 type: boolean
 *               typeOfSchool:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, SPECIAL_NEEDS]
 *     responses:
 *       200:
 *         description: CP patient created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *   get:
 *     summary: Get CP patients for authenticated caregiver
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only)
 *       404:
 *         description: Caregiver profile not found
 *
 * /cp-patient/{patientId}/assigned-tasks:
 *   get:
 *     summary: Get assigned rehabilitation tasks for a CP patient
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the CP patient
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                 total:
 *                   type: number
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       instructions:
 *                         type: string
 *                       frequencyPerDay:
 *                         type: number
 *                       durationDays:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [PENDING, ASSIGNED, COMPLETED]
 *                       progress:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 100
 *                       completedStepIndexes:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         description: Zero-based step indexes completed by caregiver
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       caregiverMarkedDoneAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       provider:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               phoneNumber:
 *                                 type: string
 *                           profession:
 *                             type: string
 *                           facilityName:
 *                             type: string
 *       400:
 *         description: Bad request (Patient ID missing)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (CAREGIVER only or no access to patient)
 *       404:
 *         description: Patient not found or caregiver profile not found
 *
 * /cp-patient/{patientId}/assigned-tasks/{taskId}/steps/done:
 *   patch:
 *     summary: Mark one instruction step as done for a patient's assigned task
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stepIndex]
 *             properties:
 *               stepIndex:
 *                 type: integer
 *                 minimum: 0
 *                 description: Zero-based index of instruction step
 *           example:
 *             stepIndex: 0
 *     responses:
 *       200:
 *         description: Task step marked as done successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient or task not found
 *       422:
 *         description: Task has no instruction steps or invalid step index
 *
 * /cp-patient/{patientId}/assigned-tasks/{taskId}/done:
 *   patch:
 *     summary: Mark a patient's assigned task as fully completed
 *     tags: [CP Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task marked as completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Patient or task not found
 *       422:
 *         description: Task is not yet assigned
 */
