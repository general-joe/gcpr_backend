/**

* @swagger
* tags:
* name: Schedule Appointment
* description: Appointment scheduling and management endpoints
*
* components:
* securitySchemes:
* ```
  bearerAuth:
  ```
* ```
    type: http
  ```
* ```
    scheme: bearer
  ```
* ```
    bearerFormat: JWT
  ```
*
* schemas:
*
* ```
  ProviderUser:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      id:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      fullName:
  ```
* ```
        type: string
  ```
* ```
      phoneNumber:
  ```
* ```
        type: string
  ```
* ```
      email:
  ```
* ```
        type: string
  ```
*
* ```
  Provider:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      id:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      profession:
  ```
* ```
        type: string
  ```
* ```
      facilityName:
  ```
* ```
        type: string
  ```
* ```
      facilityAddress:
  ```
* ```
        type: string
  ```
* ```
      user:
  ```
* ```
        $ref: '#/components/schemas/ProviderUser'
  ```
*
* ```
  Patient:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      id:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      fullName:
  ```
* ```
        type: string
  ```
*
* ```
  Appointment:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      id:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      patientId:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      providerId:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      appointmentDate:
  ```
* ```
        type: string
  ```
* ```
        format: date-time
  ```
* ```
      reasonText:
  ```
* ```
        type: string
  ```
* ```
      reasonAudio:
  ```
* ```
        type: string
  ```
* ```
      status:
  ```
* ```
        type: string
  ```
* ```
        enum: [PENDING, APPROVED, DECLINED, COMPLETED, RESCHEDULED]
  ```
* ```
      patient:
  ```
* ```
        $ref: '#/components/schemas/Patient'
  ```
* ```
      provider:
  ```
* ```
        $ref: '#/components/schemas/Provider'
  ```
*
* ```
  ProviderAvailabilitySlot:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      id:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      dayOfWeek:
  ```
* ```
        type: integer
  ```
* ```
      startTime:
  ```
* ```
        type: string
  ```
* ```
      endTime:
  ```
* ```
        type: string
  ```
*
* ```
  ProviderAvailabilityResponse:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      providerId:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
      date:
  ```
* ```
        type: string
  ```
* ```
        format: date
  ```
* ```
      message:
  ```
* ```
        type: string
  ```
* ```
        nullable: true
  ```
* ```
      slots:
  ```
* ```
        type: array
  ```
* ```
        items:
  ```
* ```
          $ref: '#/components/schemas/ProviderAvailabilitySlot'
  ```
*
* ```
  AvailableProvidersResponse:
  ```
* ```
    type: object
  ```
* ```
    properties:
  ```
* ```
      date:
  ```
* ```
        type: string
  ```
* ```
      time:
  ```
* ```
        type: string
  ```
* ```
      total:
  ```
* ```
        type: integer
  ```
* ```
      providers:
  ```
* ```
        type: array
  ```
* ```
        items:
  ```
* ```
          $ref: '#/components/schemas/Provider'
  ```
*

*/

/**

* @swagger
* /schedule-appointment/available-providers:
* get:
* ```
  summary: Get providers available at a specific date and time
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  parameters:
  ```
* ```
    - in: query
  ```
* ```
      name: date
  ```
* ```
      required: true
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        example: "2026-03-10"
  ```
* ```
    - in: query
  ```
* ```
      name: time
  ```
* ```
      required: true
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        example: "10:30"
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Available providers retrieved
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            $ref: '#/components/schemas/AvailableProvidersResponse'
  ```

*/

/**

* @swagger
* /schedule-appointment:
* post:
* ```
  summary: Create a new appointment
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  requestBody:
  ```
* ```
    required: true
  ```
* ```
    content:
  ```
* ```
      application/json:
  ```
* ```
        schema:
  ```
* ```
          type: object
  ```
* ```
          required:
  ```
* ```
            - patientId
  ```
* ```
            - providerId
  ```
* ```
            - appointmentDate
  ```
* ```
          properties:
  ```
* ```
            patientId:
  ```
* ```
              type: string
  ```
* ```
              format: uuid
  ```
* ```
            providerId:
  ```
* ```
              type: string
  ```
* ```
              format: uuid
  ```
* ```
            appointmentDate:
  ```
* ```
              type: string
  ```
* ```
              format: date-time
  ```
* ```
            reasonText:
  ```
* ```
              type: string
  ```
* ```
            reasonAudio:
  ```
* ```
              type: string
  ```
* ```
  responses:
  ```
* ```
    201:
  ```
* ```
      description: Appointment created successfully
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            $ref: '#/components/schemas/Appointment'
  ```

*/

/**

* @swagger
* /schedule-appointment/provider-availability:
* get:
* ```
  summary: Get availability slots for a provider
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  parameters:
  ```
* ```
    - in: query
  ```
* ```
      name: providerId
  ```
* ```
      required: true
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        format: uuid
  ```
* ```
    - in: query
  ```
* ```
      name: date
  ```
* ```
      required: true
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        format: date
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Provider availability retrieved
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            $ref: '#/components/schemas/ProviderAvailabilityResponse'
  ```

*/

/**

* @swagger
* /schedule-appointment/approve:
* patch:
* ```
  summary: Approve an appointment
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  requestBody:
  ```
* ```
    required: true
  ```
* ```
    content:
  ```
* ```
      application/json:
  ```
* ```
        schema:
  ```
* ```
          type: object
  ```
* ```
          properties:
  ```
* ```
            appointmentId:
  ```
* ```
              type: string
  ```
* ```
              format: uuid
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Appointment approved
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            $ref: '#/components/schemas/Appointment'
  ```

*/

/**

* @swagger
* /schedule-appointment/reschedule:
* patch:
* ```
  summary: Reschedule an appointment
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  requestBody:
  ```
* ```
    required: true
  ```
* ```
    content:
  ```
* ```
      application/json:
  ```
* ```
        schema:
  ```
* ```
          type: object
  ```
* ```
          properties:
  ```
* ```
            appointmentId:
  ```
* ```
              type: string
  ```
* ```
              format: uuid
  ```
* ```
            newDate:
  ```
* ```
              type: string
  ```
* ```
              example: "2026-04-10"
  ```
* ```
            newTime:
  ```
* ```
              type: string
  ```
* ```
              example: "11:30"
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Appointment rescheduled
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            $ref: '#/components/schemas/Appointment'
  ```

*/

/**

* @swagger
* /schedule-appointment/provider:
* get:
* ```
  summary: Get appointments for the authenticated provider
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  parameters:
  ```
* ```
    - in: query
  ```
* ```
      name: date
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        example: "2026-03-10"
  ```
* ```
    - in: query
  ```
* ```
      name: month
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
        example: "2026-03"
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Provider appointments retrieved
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            type: array
  ```
* ```
            items:
  ```
* ```
              $ref: '#/components/schemas/Appointment'
  ```

*/

/**

* @swagger
* /schedule-appointment/caregiver:
* get:
* ```
  summary: Get appointments for caregiver patients
  ```
* ```
  tags: [Schedule Appointment]
  ```
* ```
  security:
  ```
* ```
    - bearerAuth: []
  ```
* ```
  parameters:
  ```
* ```
    - in: query
  ```
* ```
      name: date
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
    - in: query
  ```
* ```
      name: month
  ```
* ```
      schema:
  ```
* ```
        type: string
  ```
* ```
  responses:
  ```
* ```
    200:
  ```
* ```
      description: Caregiver appointments retrieved
  ```
* ```
      content:
  ```
* ```
        application/json:
  ```
* ```
          schema:
  ```
* ```
            type: array
  ```
* ```
            items:
  ```
* ```
              $ref: '#/components/schemas/Appointment'
  ```

*/
