# Node.js Authentication API

A well-structured, production-ready Node.js REST API with authentication, built following best practices and clean architecture principles.

## Features

- User registration and authentication
- JWT-based authorization
- Password hashing with bcrypt
- Input validation and sanitization
- Comprehensive error handling
- Security best practices (Helmet, CORS)
- Clean architecture with proper separation of concerns
- No code duplication (DRY principle)
- Well-organized project structure

## Project Structure

```
project/
├── src/
│   ├── app.js                  # Application entry point
│   ├── config/                 # Configuration files
│   │   ├── index.js            # Main config
│   │   └── constants.js        # App constants
│   ├── controllers/            # Request handlers (thin layer)
│   │   └── authController.js   # Auth endpoints
│   ├── middleware/             # Express middleware
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validators.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── models/                 # Data models
│   │   └── user.js             # User model
│   ├── routes/                 # Route definitions
│   │   ├── index.js            # Main router
│   │   └── authRoutes.js       # Auth routes
│   ├── services/               # Business logic layer
│   │   └── authService.js      # Auth business logic
│   └── utils/                  # Utility functions
│       ├── asyncHandler.js     # Async error handling
│       └── responseFormatter.js # Response formatting
├── tests/                      # Test files
│   └── auth.test.js            # Auth tests
├── docs/                       # Documentation
├── .env.example                # Environment variables example
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Architecture Highlights

### Separation of Concerns

1. **Controllers** - Handle HTTP requests/responses (thin layer)
2. **Services** - Contain business logic (reusable)
3. **Models** - Data access layer
4. **Middleware** - Cross-cutting concerns (auth, validation, errors)
5. **Routes** - API endpoint definitions
6. **Utils** - Reusable helper functions

### No Code Duplication

- **Single Source of Truth**: All authentication logic is in `authService.js`
- **Reusable Utilities**: Common functions like `asyncHandler` prevent repetition
- **Centralized Configuration**: All configs in `config/` directory
- **Shared Constants**: HTTP status codes and messages in one place
- **DRY Validation**: Validation rules defined once and reused

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=24h
   ```

5. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Current User Profile
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Health Check
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Validation Rules

### Registration
- **email**: Must be valid email format
- **password**: Minimum 6 characters, must contain at least one number
- **name**: 2-50 characters, letters and spaces only

### Login
- **email**: Must be valid email format
- **password**: Required

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials, missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## Testing

Run tests with:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run validation (lint + test)
npm run validate
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Helmet for security headers
- CORS protection
- Input validation and sanitization
- Rate limiting (configurable)
- Environment-based configuration

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | 10 |
| `CORS_ORIGIN` | CORS allowed origins | * |

## Best Practices Implemented

1. **Clean Architecture**: Clear separation between layers
2. **DRY Principle**: No code duplication
3. **SOLID Principles**: Single responsibility, dependency injection
4. **Error Handling**: Centralized error handling with async wrapper
5. **Security**: Industry-standard security practices
6. **Validation**: Input validation at API boundary
7. **Configuration**: Environment-based configuration
8. **Testing**: Comprehensive test coverage
9. **Documentation**: Well-documented code and API

## Future Enhancements

- Database integration (MongoDB, PostgreSQL)
- Email verification
- Password reset functionality
- Refresh tokens
- Role-based access control (RBAC)
- API documentation with Swagger
- Logging with Winston
- Docker containerization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC
