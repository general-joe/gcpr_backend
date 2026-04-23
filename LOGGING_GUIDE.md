# Comprehensive Logging Guide for GCPR Backend

## Overview
This guide explains how to use the logger effectively to track errors, debug issues, and monitor application flow across the GCPR backend.

## Logger Utility

The logger is available globally via `WRITE` and provides four log levels:

### Log Levels
- **DEBUG**: Detailed information for development/debugging (disabled in production)
- **INFO**: General informational messages about successful operations
- **WARN**: Warning messages for unexpected but handled situations
- **ERROR**: Error messages for failures that need attention

### Usage Syntax
```javascript
WRITE.debug(message, metadata);  // Debug logs (dev only)
WRITE.info(message, metadata);   // Info logs
WRITE.warn(message, metadata);   // Warning logs
WRITE.error(message, metadata);  // Error logs
```

### Metadata Structure
Always include relevant metadata as objects:
```javascript
{
  operationId: "OP-xxx",      // Unique operation identifier
  userId: "user-123",         // User performing action
  resourceId: "resource-456", // Resource being acted upon
  timestamp: ISO string,      // When the action occurred
  error: "Error message",     // Error details if applicable
  statusCode: 400,            // HTTP status code if relevant
}
```

## Log File Storage

Logs are stored automatically in `/home/sam/Documents/gcpr_backend/logs/` with:
- **File naming**: `YYYY-MM-DD.log` (one file per day)
- **Format**: `[ISO-TIMESTAMP] [LEVEL] message {"metadata": "as json"}`
- **Rotation**: Daily files (automatic)

## Implementation Patterns

### 1. Middleware Logging

#### Example: Auth Middleware
```javascript
// Log auth attempts
WRITE.warn("Insufficient permissions", {
  userId: decoded.id,
  userRole: decoded.role,
  requiredRoles: allowedRoles,
  method: rq.method,
  path: rq.path,
  timestamp: new Date().toISOString(),
});

// Log validation errors
WRITE.warn("Missing or invalid authorization header", {
  method: rq.method,
  path: rq.path,
  ip: rq.ip,
  timestamp: new Date().toISOString(),
});
```

### 2. Controller Logging

#### Generate Unique Request IDs
```javascript
const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const userId = res.locals.user?.id;

// Log on entry
WRITE.debug("GET /endpoint started", {
  requestId,
  userId,
  query: req.query,
  timestamp: new Date().toISOString(),
});

// Log validation errors
WRITE.warn("Validation error: GET /endpoint", {
  requestId,
  userId,
  errors: validationErrors,
  timestamp: new Date().toISOString(),
});

// Log on success
WRITE.info("GET /endpoint completed successfully", {
  requestId,
  userId,
  resultCount: result?.length || 0,
  timestamp: new Date().toISOString(),
});
```

### 3. Service Layer Logging

#### Operation Logging
```javascript
static async createResource(userId, payload) {
  const operationId = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Log operation start
    WRITE.debug("Creating resource", {
      operationId,
      userId,
      resourceType: payload.type,
    });

    // Log validation steps
    const user = await validateUser(userId);
    WRITE.debug("User validated", { operationId, userId });

    // Log business logic
    if (await resourceExists(payload.name)) {
      WRITE.warn("Resource already exists", {
        operationId,
        resourceName: payload.name,
      });
      throw new Error("Resource exists");
    }

    // Log database operations
    const resource = await prisma.resource.create({
      data: payload,
    });
    WRITE.info("Resource created", {
      operationId,
      resourceId: resource.id,
      userId,
    });

    return resource;
  } catch (error) {
    WRITE.error("Resource creation failed", {
      operationId,
      userId,
      error: error.message,
    });
    throw error;
  }
}
```

### 4. Error Handling Middleware

Errors are automatically logged with comprehensive context in `server.js`:

```javascript
app.use((err, req, res, next) => {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Context includes:
  // - errorId: Unique error identifier
  // - method, path, query: Request details
  // - userId: Who triggered the error
  // - ip: Client IP address
  // - userAgent: Browser/client info
  // - errorMessage, errorStack: Error details
  // - statusCode: HTTP status

  // Logged with WRITE.error() or WRITE.warn()
  // Error ID is returned in response for client reference
});
```

## What to Log: Best Practices

### ALWAYS LOG:
1. **Authentication & Authorization**
   - Successful auth (DEBUG level)
   - Failed auth attempts (WARN level)
   - Permission denials (WARN level)

2. **Database Operations**
   - Create/Update/Delete operations (DEBUG start, INFO success, ERROR if failed)
   - Important queries (DEBUG)
   - Transaction failures (ERROR)

3. **Business Logic Decisions**
   - Validation failures (WARN)
   - Business rule violations (WARN)
   - Resource not found (WARN)
   - Status changes (INFO)

4. **External Service Calls**
   - Email sending (INFO/ERROR)
   - SMS sending (INFO/ERROR)
   - Firebase operations (DEBUG/ERROR)
   - Third-party API calls (DEBUG/ERROR)

5. **Errors & Exceptions**
   - All exceptions (ERROR)
   - Validation errors (WARN)
   - Timeout/retry situations (WARN)

### DO NOT LOG:
- Passwords or tokens (ever)
- Credit card numbers or sensitive PII
- Large payloads (summarize instead)
- Request/response bodies (unless necessary, sanitize)

## Query Log Files

### View Today's Logs
```bash
tail -f logs/$(date +%Y-%m-%d).log
```

### View Specific Time Range
```bash
grep "2026-04-23T14:" logs/2026-04-23.log
```

### View Error Logs Only
```bash
grep "\[ERROR\]" logs/2026-04-23.log
```

### View Specific User's Activity
```bash
grep "userId.*user-123" logs/2026-04-23.log
```

### View Specific Operation
```bash
grep "operationId.*OP-1234567890" logs/2026-04-23.log
```

### Trace All Steps of a Request
```bash
grep "requestId.*REQ-1234567890" logs/2026-04-23.log
```

## Error Tracking Workflow

### When an Error Occurs:
1. **Error ID** is logged and returned to client
2. **Look up error ID** in logs to get complete context

Example error response:
```json
{
  "status": 500,
  "message": "Internal server error",
  "errorId": "ERR-1713898765432-abc123"
}
```

### Find Complete Error Details:
```bash
grep "ERR-1713898765432-abc123" logs/2026-04-23.log
```

This shows:
- Full error stack trace
- Request method/path
- User ID involved
- Client IP
- User agent
- All metadata

## Module Implementation Checklist

When adding logging to a new module, follow this checklist:

- [ ] Import logger (globally available as `WRITE`)
- [ ] Add request ID generation in controllers
- [ ] Log operation start with DEBUG
- [ ] Log validation errors with WARN
- [ ] Log each step in service layer with DEBUG
- [ ] Log business logic decisions with INFO/WARN
- [ ] Log database queries with DEBUG
- [ ] Log successful operations with INFO
- [ ] Log errors with ERROR and include operation ID
- [ ] Add error IDs to error responses
- [ ] Avoid logging sensitive data
- [ ] Test logs by running operation and checking logs/

## Example: Complete Module with Logging

See [scheduleAppointment module](./src/modules/scheduleAppointment/) for a complete implementation example.

### Key Files:
1. **scheduleAppointment.controller.js** - Request logging pattern
2. **scheduleAppointment.service.js** - Operation logging pattern
3. **src/middlewares/auth.js** - Auth logging pattern
4. **src/middlewares/catchAsync.js** - Error logging pattern
5. **src/server.js** - Global error handling pattern

## Monitoring and Debugging

### Common Scenarios

**Scenario: User reports appointment not created**
```bash
# Find all appointment creation attempts
grep "POST /appointments" logs/2026-04-23.log
grep "createAppointment" logs/2026-04-23.log

# Look for specific user
grep "userId.*user-123" logs/2026-04-23.log | grep "Appointment"

# Find error with operation ID
grep "OP-xxxxx" logs/2026-04-23.log
```

**Scenario: Database error occurred**
```bash
# Find all database errors
grep "Database Error" logs/2026-04-23.log

# Find specific error
grep "ERR-xxxxx" logs/2026-04-23.log
```

**Scenario: Auth failures**
```bash
# Find all auth failures
grep "Insufficient permissions\|Missing.*authorization" logs/2026-04-23.log

# Find specific user's failures
grep "userId.*user-123" logs/2026-04-23.log | grep "\[WARN\]"
```

## Performance Considerations

- Logger is **non-blocking** (async file writes)
- Metadata objects are serialized to JSON
- Large metadata objects are automatically converted to JSON strings
- Logs are written daily to prevent large files
- DEBUG logs disabled in production (controlled by NODE_ENV)

## Questions?

For logging-related questions or to add logging to additional modules, follow the patterns demonstrated in the schedule appointment module and this guide.
