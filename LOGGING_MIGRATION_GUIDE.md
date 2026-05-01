# Adding Logging to Existing Modules - Migration Guide

This guide helps you add comprehensive logging to your existing modules following the patterns demonstrated in the schedule appointment module.

## Step-by-Step Process

### Step 1: Update Controllers

For each controller file, follow this pattern:

#### 1.1 Import (already in place globally)
No import needed - `WRITE` is available globally as `WRITE`

#### 1.2 Add Request ID Generation
At the start of each controller method:

```javascript
static methodName = catchAsync(async (req, res) => {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const userId = res.locals.user?.id;
  
  // ... rest of method
});
```

#### 1.3 Add Debug Log on Entry
Log when the endpoint is called:

```javascript
WRITE.debug("GET /your-endpoint started", {
  requestId,
  userId,
  query: req.query,  // for GET
  params: req.params, // if any
  timestamp: new Date().toISOString(),
});
```

#### 1.4 Add Validation Error Logging
When validating input:

```javascript
if (!parsedData.success) {
  const errors = parsedData.error.issues.map(/* ... */);
  
  WRITE.warn("Validation error: GET /your-endpoint", {
    requestId,
    userId,
    errors,
    timestamp: new Date().toISOString(),
  });
  
  return res.status(400).json({ success: false, errors });
}
```

#### 1.5 Add Success Logging
After successful operation:

```javascript
WRITE.info("GET /your-endpoint completed successfully", {
  requestId,
  userId,
  resultCount: result?.length || 0,
  resultId: result?.id, // if single item
  timestamp: new Date().toISOString(),
});

return UtilFunctions.outputSuccess(res, result, "Message");
```

### Step 2: Update Services

For each service file, add comprehensive operation logging:

#### 2.1 Generate Operation ID
At the start of static async methods:

```javascript
static async methodName(userId, payload) {
  const operationId = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // ... rest of method
  } catch (error) {
    // ... error handling
  }
}
```

#### 2.2 Log Operation Start
```javascript
WRITE.debug("Operation description", {
  operationId,
  userId,
  resourceId: payload?.id,
  action: "create|update|delete|fetch",
});
```

#### 2.3 Log Validation Steps
```javascript
const resource = await findResource(id);
if (!resource) {
  WRITE.warn("Resource not found", {
    operationId,
    userId,
    resourceId: id,
  });
  throw new gcprError(HttpStatus.NOT_FOUND, "Message");
}

WRITE.debug("Resource found and validated", {
  operationId,
  resourceId: resource.id,
});
```

#### 2.4 Log Business Logic Decisions
```javascript
if (resource.status === "ACTIVE") {
  WRITE.warn("Cannot delete active resource", {
    operationId,
    resourceId: id,
    currentStatus: resource.status,
  });
  throw new gcprError(HttpStatus.CONFLICT, "Message");
}
```

#### 2.5 Log Database Operations
```javascript
const createdItem = await prisma.model.create({
  data: payload,
});

WRITE.info("Item created in database", {
  operationId,
  itemId: createdItem.id,
  userId,
});
```

#### 2.6 Log Errors
```javascript
} catch (error) {
  WRITE.error("Operation failed", {
    operationId,
    userId,
    error: error.message,
    errorCode: error.status || 500,
  });
  throw error;
}
```

### Step 3: Update Middleware (if not done)

#### 3.1 Update auth.js
Add logging for auth issues (see auth.js for current implementation)

#### 3.2 Update catchAsync.js
Add error context logging (see catchAsync.js for current implementation)

## Modules to Update (Priority Order)

### High Priority (User-facing operations)
- [ ] `auth/` - Authentication/login operations
- [ ] `user/` - User management
- [ ] `cpPatient/` - Patient management
- [ ] `careGiver/` - Caregiver operations
- [ ] `serviceProvider/` - Provider management
- [ ] `assessment/` - Assessment operations

### Medium Priority (Important features)
- [ ] `scheduleAppointment/` - ✅ Already done
- [ ] `notification/` - Notification handling
- [ ] `community/` - Community operations
- [ ] `directMessage/` - Messaging
- [ ] `resource/` - Resource management

### Lower Priority (Supporting features)
- [ ] `files/` - File upload/download
- [ ] `scheduleAppointment/` (other methods) - Additional endpoints

## Quick Checklist for Each Module

For each module, ensure:

- [ ] Controller methods have requestId generation
- [ ] Controller methods log on entry (DEBUG)
- [ ] Validation errors are logged (WARN)
- [ ] Successful operations are logged (INFO)
- [ ] Service methods have operationId generation
- [ ] Service methods log operation start (DEBUG)
- [ ] Service methods log validation failures (WARN)
- [ ] Service methods log database operations (INFO)
- [ ] Service methods log errors (ERROR)
- [ ] Error responses include unique error IDs
- [ ] No sensitive data is logged
- [ ] All logs include timestamp
- [ ] Logs tested by running operation and checking logs/

## Example: Converting a Method

### Before (No Logging)
```javascript
// auth.controller.js
static loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await AuthService.login(email, password);
  
  UtilFunctions.outputSuccess(res, user, "Login successful");
});
```

### After (With Logging)
```javascript
// auth.controller.js
static loginUser = catchAsync(async (req, res) => {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  WRITE.debug("Login attempt", {
    requestId,
    email: req.body.email,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  const user = await AuthService.login(req.body.email, req.body.password);
  
  WRITE.info("User login successful", {
    requestId,
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString(),
  });
  
  UtilFunctions.outputSuccess(res, user, "Login successful");
});
```

### Service Layer Update
```javascript
// auth.service.js
static async login(email, password) {
  const operationId = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    WRITE.debug("Login operation started", {
      operationId,
      email,
    });
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });
    
    if (!user) {
      WRITE.warn("Login failed: user not found", {
        operationId,
        email,
      });
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    
    const passwordMatch = await validatePassword(password, user.password);
    if (!passwordMatch) {
      WRITE.warn("Login failed: invalid password", {
        operationId,
        userId: user.id,
        email,
      });
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    
    WRITE.info("Login successful", {
      operationId,
      userId: user.id,
    });
    
    return user;
  } catch (error) {
    WRITE.error("Login operation failed", {
      operationId,
      email,
      error: error.message,
    });
    throw error;
  }
}
```

## Testing Your Logging

After adding logging to a module:

1. **Start the application**
   ```bash
   npm start
   # or
   pnpm start
   ```

2. **Perform an operation** that exercises your new logging

3. **Check the log file**
   ```bash
   tail -f logs/$(date +%Y-%m-%d).log
   ```

4. **Verify you see:**
   - Request/Operation IDs in a consistent format
   - Timestamps for all entries
   - User IDs where applicable
   - Operation start (DEBUG)
   - Operation completion (INFO)
   - Any errors with full context (ERROR)

5. **Look for issues:**
   - Missing request IDs (should always be present)
   - Sensitive data in logs (remove immediately)
   - Missing context information
   - Inconsistent log levels

## Common Patterns to Use

### Pattern 1: Simple Read Operation
```javascript
WRITE.debug("GET /resource started", { requestId, userId, resourceId });
const resource = await Service.getResource(resourceId);
WRITE.info("GET /resource completed", { requestId, resourceId });
```

### Pattern 2: Create with Validation
```javascript
WRITE.debug("POST /create started", { requestId, userId });
if (!isValid) {
  WRITE.warn("Validation failed", { requestId, errors });
  throw new Error("Invalid");
}
const item = await Service.create(data);
WRITE.info("POST /create completed", { requestId, itemId: item.id });
```

### Pattern 3: Update with Verification
```javascript
WRITE.debug("PATCH /update started", { requestId, userId, itemId });
const item = await Service.getItem(itemId);
if (item.userId !== userId) {
  WRITE.warn("Permission denied", { requestId, userId, itemId });
  throw new Error("Forbidden");
}
const updated = await Service.update(itemId, data);
WRITE.info("PATCH /update completed", { requestId, itemId });
```

### Pattern 4: Delete with Cascade
```javascript
WRITE.debug("DELETE /item started", { requestId, userId, itemId });
const item = await Service.getItem(itemId);
// Delete related items
await Service.deleteRelated(itemId);
WRITE.debug("Deleted related items", { requestId, relatedCount: 5 });
// Delete main item
await Service.delete(itemId);
WRITE.info("DELETE /item completed", { requestId, itemId });
```

## Guidelines for Consistency

1. **Use consistent naming** - requestId, operationId, userId, timestamp
2. **Use consistent levels** - DEBUG for start, INFO for success, WARN for handled errors, ERROR for unexpected
3. **Include context** - What is being operated on, by whom, and why
4. **Never log passwords/tokens** - Use user ID instead
5. **Keep metadata lean** - Include what's relevant, not everything
6. **Use ISO timestamps** - `new Date().toISOString()`
7. **Use unique IDs** - All requests/operations get unique IDs

## Questions?

Refer to:
- `LOGGING_GUIDE.md` - Full documentation
- `LOGGING_QUICK_REFERENCE.md` - Quick syntax reference
- `src/modules/scheduleAppointment/` - Complete working example
- `src/middlewares/auth.js` - Auth logging example
- `src/server.js` - Error handling logging example
