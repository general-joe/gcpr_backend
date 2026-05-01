# Quick Logging Reference Card

## Logger Methods (Global: `WRITE`)

```javascript
WRITE.debug(message, metadata)  // Development only
WRITE.info(message, metadata)   // Success/info
WRITE.warn(message, metadata)   // Warnings/issues
WRITE.error(message, metadata)  // Errors
```

## Controller Template

```javascript
static methodName = catchAsync(async (req, res) => {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userId = res.locals.user?.id;
  
  // START
  WRITE.debug("Endpoint description", {
    requestId,
    userId,
    params: req.query || req.params,
    timestamp: new Date().toISOString(),
  });

  // VALIDATION ERRORS
  if (validationFails) {
    WRITE.warn("Validation error message", {
      requestId,
      userId,
      errors: details,
      timestamp: new Date().toISOString(),
    });
    return res.status(400).json({ ... });
  }

  // EXECUTE SERVICE
  const result = await Service.method(userId, payload);

  // SUCCESS
  WRITE.info("Operation completed", {
    requestId,
    userId,
    resultIdentifier: result?.id,
    timestamp: new Date().toISOString(),
  });

  return UtilFunctions.outputSuccess(res, result, "Message");
});
```

## Service Layer Template

```javascript
static async methodName(userId, payload) {
  const operationId = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    WRITE.debug("Operation started", {
      operationId,
      userId,
      action: "description",
    });

    // VALIDATION
    if (!isValid) {
      WRITE.warn("Validation failed", {
        operationId,
        userId,
        reason: "why",
      });
      throw new Error("Message");
    }

    // DATABASE OPERATION
    const result = await prisma.model.create({ data: payload });

    WRITE.info("Database operation successful", {
      operationId,
      userId,
      itemId: result.id,
    });

    return result;
  } catch (error) {
    WRITE.error("Operation failed", {
      operationId,
      userId,
      error: error.message,
      statusCode: error.status,
    });
    throw error;
  }
}
```

## Auth Middleware Template

```javascript
// Log successful auth
WRITE.debug("User authenticated", {
  userId: decoded.id,
  role: decoded.role,
});

// Log failed auth
WRITE.warn("Auth failed reason", {
  error: err.message,
  ip: req.ip,
  timestamp: new Date().toISOString(),
});
```

## What NOT to Log
```javascript
// ❌ DO NOT LOG
WRITE.info("User data", { password });
WRITE.info("User data", { token });
WRITE.info("Card info", { cardNumber });
WRITE.info("Full payload", largeObjectWithSensitiveData);

// ✅ DO LOG
WRITE.info("User authenticated", { userId, role });
WRITE.debug("Card processed", { last4Digits: "4242" });
WRITE.info("Data saved", { recordCount: 5, timestamp });
```

## Error IDs

Errors automatically get unique IDs in format:
```
ERR-{timestamp}-{randomString}
```

Log them:
```javascript
WRITE.error("Operation failed", {
  errorId: "ERR-1234567-abc",
  userId,
  error: message,
});
```

## Reading Logs

```bash
# Today's logs
tail -f logs/$(date +%Y-%m-%d).log

# Find by error ID
grep "ERR-1234567-abc" logs/2026-04-23.log

# Find by user
grep "userId.*user-123" logs/2026-04-23.log

# Find by request
grep "requestId.*REQ-1234567" logs/2026-04-23.log

# Find by operation
grep "operationId.*OP-1234567" logs/2026-04-23.log

# Find errors only
grep "\[ERROR\]" logs/2026-04-23.log

# Find warnings
grep "\[WARN\]" logs/2026-04-23.log
```

## Metadata Essentials

Always include:
```javascript
{
  requestId: "REQ-xxx",         // or operationId: "OP-xxx"
  userId: "user-123",            // Who is this for?
  timestamp: ISO string,         // When?
  error: "message",              // What went wrong? (errors only)
  resourceId: "resource-456",    // What resource? (if applicable)
}
```

## File Locations

- **Logger utility**: `src/utils/logger.js`
- **Example implementations**:
  - Controller: `src/modules/scheduleAppointment/scheduleAppointment.controller.js`
  - Service: `src/modules/scheduleAppointment/scheduleAppointment.service.js`
  - Auth: `src/middlewares/auth.js`
  - Error handler: `src/server.js`
- **Full guide**: `LOGGING_GUIDE.md`
- **Log files**: `logs/` directory

## Key Principles

1. **Every request gets a unique ID** (REQ- prefix)
2. **Every operation gets a unique ID** (OP- prefix)
3. **Every error gets a unique ID** (ERR- prefix)
4. **Include timestamp** for all logs
5. **Include userId** for all user-related operations
6. **Include context** (what, why, what happened)
7. **Never log sensitive data**
8. **Errors include full stack trace** (automatic)

---

For full details, see `LOGGING_GUIDE.md`
