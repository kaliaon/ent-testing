# ENT Testing Backend

This is the backend server for the ENT (Единое национальное тестирование) Testing application. It provides APIs for authentication, test management, and AI-powered feedback.

## Features

- User authentication (register, login, logout)
- Test management (get tests, view test details)
- Test results tracking
- Performance analytics
- AI-powered feedback on test performance
- Swagger API documentation

## Prerequisites

- Node.js (v14.x or higher)
- PostgreSQL (v12.x or higher)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ent-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a PostgreSQL database:

```sql
CREATE DATABASE ent_testing;
```

4. Create a `.env` file in the root directory and add the following environment variables:

```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ent_testing
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## API Documentation

The API is documented using Swagger. You can access the documentation at:

```
http://localhost:5000/api-docs
```

This interactive documentation allows you to:

- View all available endpoints
- Understand request/response formats
- Test the API directly from the browser

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `POST /auth/logout` - Logout a user
- `GET /auth/current-user` - Get current user
- `POST /auth/test-history` - Add test to user history

### Tests

- `GET /tests` - Get all tests
- `GET /tests/:id` - Get a test by ID
- `POST /tests/results` - Submit test results
- `GET /tests/results` - Get all test results for a user
- `GET /tests/:testId/results` - Get results for a specific test
- `GET /tests/performance` - Get performance analytics

### AI

- `POST /ai/feedback` - Get AI-generated feedback based on test performance

## Security

- Authentication is handled using JSON Web Tokens (JWT)
- Passwords are securely hashed using bcrypt
- Protected routes require valid JWT token

## Database Schema

### User

- `id`: Auto-increment primary key
- `username`: String (unique)
- `password`: String (hashed)
- `fullName`: String
- `email`: String (unique)
- Has many TestAttempts

### TestAttempt

- `id`: Auto-increment primary key
- `testId`: Integer
- `date`: String
- `score`: Float
- `totalQuestions`: Integer
- `answers`: Array of Integers
- Belongs to a User

### Test

- `id`: Integer (unique)
- `title`: String
- `description`: Text
- Has many Questions

### Question

- `id`: Integer
- `text`: Text
- `options`: Array of Strings
- `correctAnswer`: Integer
- Belongs to a Test
