# Architecture Documentation

## Overview

This project follows a clean, layered architecture pattern with clear separation of concerns and no code duplication. The structure is designed to be maintainable, testable, and scalable.

## Architectural Layers

### 1. Routes Layer (`src/routes/`)

**Responsibility**: Define API endpoints and route HTTP requests to controllers

**Principles**:
- Maps HTTP methods to controller actions
- Groups related endpoints logically
- Applies middleware at route level
- No business logic

**Example**:
```javascript
router.post('/register', registerValidation, authController.register);
```

### 2. Controllers Layer (`src/controllers/`)

**Responsibility**: Handle HTTP request/response cycle

**Principles**:
- Thin layer - minimal logic
- Extract data from requests
- Call service layer for business logic
- Format and return responses
- NO business logic or data access

**Example**:
```javascript
register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  const user = await authService.register({ email, password, name });
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: { user },
  });
});
```

### 3. Services Layer (`src/services/`)

**Responsibility**: Business logic and orchestration

**Principles**:
- Single responsibility per service
- Reusable across different controllers
- No knowledge of HTTP layer
- Orchestrates models and utilities
- Where the "how" happens

**Example**:
```javascript
async register(userData) {
  const existingUser = await User.findByEmail(userData.email);
  if (existingUser) throw new Error(ERROR_MESSAGES.USER_ALREADY_EXISTS);

  const hashedPassword = await this.hashPassword(userData.password);
  const user = await User.create({...userData, password: hashedPassword});

  return this.sanitizeUser(user);
}
```

### 4. Models Layer (`src/models/`)

**Responsibility**: Data access and persistence

**Principles**:
- Abstract database operations
- Provide clean API for data access
- Validate data structure
- Independent of business logic
- Easily swappable (in-memory → database)

**Example**:
```javascript
static async findByEmail(email) {
  return Array.from(users.values()).find(user => user.email === email) || null;
}
```

### 5. Middleware Layer (`src/middleware/`)

**Responsibility**: Cross-cutting concerns

**Types**:
- **Authentication**: Verify tokens, attach user
- **Validation**: Input validation before controllers
- **Error Handling**: Centralized error processing

**Principles**:
- Single responsibility
- Reusable across routes
- Next() to continue chain

### 6. Utils Layer (`src/utils/`)

**Responsibility**: Reusable helper functions

**Principles**:
- Pure functions when possible
- No business logic
- Framework agnostic
- Prevents duplication

## Data Flow

```
Request → Routes → Middleware → Controller → Service → Model → Database
                                     ↓
                              Response ← Format ← Result
```

### Request Flow Example

1. **Request arrives**: `POST /api/v1/auth/register`

2. **Route matches**: `authRoutes.js`
   - Applies validation middleware
   - Routes to controller

3. **Validation middleware**: `validators.js`
   - Validates input format
   - Returns 400 if invalid
   - Calls next() if valid

4. **Controller**: `authController.register()`
   - Extracts data from request
   - Calls service layer
   - Wraps in asyncHandler for error catching

5. **Service**: `authService.register()`
   - Checks if user exists (via Model)
   - Hashes password (via bcrypt)
   - Creates user (via Model)
   - Sanitizes user object
   - Returns clean data

6. **Model**: `User.create()`
   - Persists user data
   - Returns created user

7. **Response**: Controller formats and sends
   - HTTP 201 Created
   - JSON with user data (no password)

## Design Patterns

### 1. Singleton Pattern

Services are instantiated once and exported:
```javascript
class AuthService { ... }
module.exports = new AuthService();
```

**Benefits**: Single source of truth, shared state if needed

### 2. Factory Pattern

Models use static methods as factories:
```javascript
static async create(userData) { ... }
```

**Benefits**: Consistent object creation, encapsulation

### 3. Middleware Pattern

Express middleware chain:
```javascript
router.post('/register', validation, controller);
```

**Benefits**: Composable, reusable, separation of concerns

### 4. Repository Pattern

Models abstract data access:
```javascript
User.findByEmail(email)  // Same interface regardless of DB
```

**Benefits**: Easy to swap databases, testable

## DRY Principle Implementation

### Problem: Repeated Error Handling

**Without DRY**:
```javascript
async register(req, res) {
  try {
    const user = await authService.register(req.body);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**With DRY** (asyncHandler):
```javascript
register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.json({ user });
});
```

### Problem: Repeated Validation Logic

**Without DRY**: Validation in every controller

**With DRY**: Reusable validation middleware
```javascript
const registerValidation = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  validate,
];
```

### Problem: Repeated Constants

**Without DRY**: Magic numbers and strings everywhere

**With DRY**: Centralized constants
```javascript
const { HTTP_STATUS, ERROR_MESSAGES } = require('./config/constants');
```

### Problem: Repeated Authentication Logic

**Without DRY**: Token verification in every protected route

**With DRY**: Authentication middleware
```javascript
router.get('/me', authenticate, authController.getProfile);
```

## Security Considerations

### 1. Password Handling
- Never store plain text passwords
- Hash with bcrypt (configurable rounds)
- Never return passwords in responses

### 2. Token Management
- JWT with configurable expiration
- Verify on every protected route
- Include minimal user data in token

### 3. Input Validation
- Validate ALL inputs
- Sanitize to prevent injection
- Use express-validator

### 4. Error Messages
- Don't leak sensitive information
- Generic messages in production
- Detailed logs server-side

### 5. Security Headers
- Helmet middleware
- CORS configuration
- Rate limiting

## Testing Strategy

### Unit Tests
- Test services independently
- Mock model layer
- Test business logic

### Integration Tests
- Test API endpoints
- Full request/response cycle
- Use supertest

### Test Organization
```
tests/
├── unit/
│   ├── services/
│   └── utils/
└── integration/
    └── auth.test.js
```

## Configuration Management

### Environment-based Config
```javascript
config = {
  env: process.env.NODE_ENV,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
};
```

### Benefits
- Different configs per environment
- Secrets not in code
- Easy to modify without code changes

## Error Handling Strategy

### Centralized Error Handler
All errors flow to single handler:
```javascript
app.use(errorHandler);
```

### Custom Error Types
```javascript
if (err.message === ERROR_MESSAGES.USER_ALREADY_EXISTS) {
  statusCode = HTTP_STATUS.CONFLICT;
}
```

### Benefits
- Consistent error responses
- Easy to modify error handling
- Single source of truth

## Extensibility

### Adding New Features

1. **New Model**: Add to `models/`
2. **New Service**: Add to `services/`
3. **New Controller**: Add to `controllers/`
4. **New Routes**: Add to `routes/`
5. **Update main router**: Import new routes

### Example: Adding Posts Feature

```
1. models/post.js      - Data access
2. services/postService.js - Business logic
3. controllers/postController.js - HTTP handling
4. routes/postRoutes.js - Route definitions
5. routes/index.js     - Import: router.use('/posts', postRoutes)
```

## Summary

This architecture achieves:
- **Separation of Concerns**: Each layer has single responsibility
- **No Duplication**: Shared logic in services, utils, middleware
- **Testability**: Independent layers can be tested in isolation
- **Maintainability**: Changes isolated to specific layers
- **Scalability**: Easy to add features following pattern
- **Security**: Built-in security best practices
