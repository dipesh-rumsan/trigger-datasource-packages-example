# Mock API - GLOFAS & GFH Data Simulator

A NestJS-based mock API server that simulates external data sources (GLOFAS, GFH, DHM) for testing and development purposes. This mock server eliminates the need to call real external APIs during development and testing, providing fast, reliable, and predictable responses.

## 🎯 Overview

The Mock API is built with NestJS and provides mock endpoints that replicate the behavior of external flood forecasting systems. It uses the `mock` database schema to store and serve test data, allowing developers to test trigger systems without depending on external API availability, rate limits, or network connectivity.

## 🚀 Purpose

**Why Mock API?**

Instead of calling real external APIs during development/testing:

- ❌ **Real APIs**: Slow, rate-limited, require authentication, unstable
- ✅ **Mock API**: Fast, unlimited calls, no auth needed, always available

This mock server enables:

- 🧪 **Isolated Testing**: Test without external dependencies
- ⚡ **Fast Development**: No network latency or API delays
- 🎭 **Scenario Simulation**: Test edge cases (high floods, API failures, etc.)
- 💰 **Cost Savings**: No API usage costs or rate limit concerns
- 🔒 **Offline Development**: Work without internet connection

## ✨ Features

- **Mock Forecast Endpoints**: Simulates GLOFAS and GFH flood forecast APIs
- **Mock Trigger Management**: CRUD operations for testing trigger workflows
- **Database Integration**: Uses `@lib/database` with `mock` schema
- **Swagger Documentation**: Interactive API documentation at `/swagger`
- **Winston Logging**: Structured logging for debugging
- **CORS Enabled**: Cross-origin requests supported
- **Global Validation**: Request data validation with class-validator
- **Exception Handling**: Comprehensive error handling filters

## 📁 Project Structure

```text
src/
├── app.controller.ts              # Main application controller
├── app.module.ts                  # Root module with database & HTTP setup
├── app.service.ts                 # Application service
├── main.ts                        # Bootstrap file (port: 3005)
├── all-exceptions.filter.ts       # Global exception handler
├── helpers/
│   └── winston.logger.ts          # Winston logger configuration
├── forecast/
│   ├── forecast.controller.ts     # Mock forecast endpoints (GLOFAS, GFH)
│   ├── forecast.service.ts        # Forecast data service
│   └── forecast.module.ts         # Forecast module
├── triggers/
│   ├── triggers.controller.ts     # Mock trigger CRUD endpoints
│   ├── trigger.service.ts         # Trigger business logic
│   ├── trigger.module.ts          # Triggers module
│   └── dto/
│       └── trigger.dto.ts         # Trigger data transfer objects
├── constants/                     # Application constants
├── types/                         # TypeScript type definitions
└── utils/                         # Utility functions
```

## 🔌 API Endpoints

### Forecast Endpoints (Mock External APIs)

| Method | Endpoint                                  | Description               | Mocks            |
| ------ | ----------------------------------------- | ------------------------- | ---------------- |
| `GET`  | `/v1/forecast/river`                      | Get river forecast data   | DHM River Watch  |
| `GET`  | `/v1/forecast/glofas`                     | Get GLOFAS forecast data  | GLOFAS WMS API   |
| `POST` | `/v1/forecast/gauges:searchGaugesByArea`  | Search GFH gauges by area | Google Flood Hub |
| `GET`  | `/v1/forecast/gaugeModels:batchGet`       | Get GFH gauge metadata    | Google Flood Hub |
| `GET`  | `/v1/forecast/gauges:queryGaugeForecasts` | Get GFH gauge forecasts   | Google Flood Hub |

### Trigger Management Endpoints (Testing)

| Method   | Endpoint           | Description        |
| -------- | ------------------ | ------------------ |
| `GET`    | `/v1/triggers`     | Get all triggers   |
| `GET`    | `/v1/triggers/:id` | Get trigger by ID  |
| `POST`   | `/v1/triggers`     | Create new trigger |
| `PATCH`  | `/v1/triggers/:id` | Update trigger     |
| `DELETE` | `/v1/triggers/:id` | Delete trigger     |

### Health Check

| Method | Endpoint | Description        |
| ------ | -------- | ------------------ |
| `GET`  | `/v1`    | Basic health check |

## 🛠️ Environment Configuration

Copy the environment example file and update the values:

```bash
cp .env.example .env
```

Update the `.env` file:

```bash
# Database Configuration (uses mock schema)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=rahat_triggers

# Application Configuration
PORT=3005
NODE_ENV=development

# Optional: Direct DATABASE_URL
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rahat_triggers?schema=mock
```

**Note:** The mock API uses the same database as the triggers app but operates in the `mock` schema for data isolation.

## 📦 Installation & Setup

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Setup Database

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm --filter @lib/database db:generate

# Run migrations
pnpm --filter @lib/database db:migrate

# Optional: Seed mock data
pnpm --filter @lib/database seed
```

### 3. Build the Package

```bash
# Build mock-api
pnpm --filter mock-api build

# Or build all packages
pnpm build
```

## 🚀 Running the Application

### Development Mode

```bash
# From monorepo root
pnpm --filter mock-api dev

# Or from app directory
cd apps/mock-api
pnpm dev
```

The server will start at: **`http://localhost:3005`**

### Production Mode

```bash
# Build first
pnpm --filter mock-api build

# Start production server
pnpm --filter mock-api start:prod
```

### Debug Mode

```bash
pnpm --filter mock-api dev:debug
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run end-to-end tests
pnpm test:e2e

# Generate test coverage report
pnpm test:cov
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Format code with Prettier
pnpm format
```

## API Endpoints

The application provides the following main endpoints:

### Health Check

- `GET /v1` - Basic health check endpoint
- `GET /v1/health` - Detailed health status

## API Documentation

When the application is running, you can access the interactive Swagger documentation at:

```
http://localhost:3000/swagger
```

The Swagger UI provides detailed information about all available endpoints, request/response schemas, and allows you to test the API directly from the browser.

## Database Integration

The application uses the shared `@lib/database` package which provides:

- **Prisma ORM Integration**: Type-safe database operations
- **Connection Management**: Automatic database connection handling
- **Exception Handling**: Comprehensive error handling for database operations
- **Migration Support**: Database schema migrations

The database configuration is handled automatically through environment variables, supporting both direct DATABASE_URL and individual connection parameters.

## Error Handling

The application includes comprehensive error handling:

- **Global Exception Filter**: Catches and formats all unhandled exceptions
- **Prisma Exception Filter**: Specifically handles database-related errors
- **Validation Errors**: Automatic validation of request data
- **Structured Error Responses**: Consistent error response format

## Logging

The application uses Winston for structured logging with different log levels:

- **Development**: Detailed logs with query information
- **Production**: Optimized logging for performance
- **Error Tracking**: Comprehensive error logging with context

## Development Workflow

1. **Start the database**: Ensure PostgreSQL is running
2. **Set up environment**: Configure your `.env` file
3. **Install dependencies**: Run `pnpm install` from the root
4. **Generate Prisma client**: Run `pnpm --filter @lib/database db:generate`
5. **Run migrations**: Run `pnpm --filter @lib/database db:migrate`
6. **Start development server**: Run `pnpm dev`

## Configuration

The application can be configured through environment variables:

- **Database Configuration**: Connection details for PostgreSQL
- **Application Settings**: Port, environment mode, etc.
- **Logging Configuration**: Log levels and output formats

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the PORT environment variable
2. **Database Connection Failed**: Verify database configuration and ensure PostgreSQL is running
3. **Build Errors**: Clear node_modules and reinstall dependencies
4. **Migration Issues**: Check database permissions and connection string

### Debug Mode

To run the application in debug mode:

```bash
pnpm start:debug
```

This enables the Node.js debugger and provides detailed logging for troubleshooting issues.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Configure production database settings
3. Build the application: `pnpm build`
4. Start with: `pnpm start:prod`

The application includes production-optimized logging and error handling when running in production mode.
