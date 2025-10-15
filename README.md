# NestJS, Prisma Monorepo Seed

A monorepo containing the Nestjs Seed system built with NestJS and Turborepo. This project provides a scalable architecture for handling data triggers and database operations.

## Project Structure

This monorepo contains the following applications and packages:

### Applications

- **api** - Main Seed NestJS application

### Packages

- **@lib/database** - Shared database package with Prisma integration and NestJS modules
- **@workspace/eslint-config** - Shared ESLint configurations
- **@workspace/typescript-config** - Shared TypeScript configurations

## Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (version 18 or higher)
- pnpm (recommended package manager)
- PostgreSQL database

## Getting Started

1. **Clone the repository**
   ```bash
   git clone git@github.com:dipesh-rumsan/turbo-setup.git
   cd turbo-setup
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the environment example files and configure them:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   
   Update the database configuration in the `.env` file. See the `.env.example` file for required variables.

4. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm --filter @lib/database db:generate
   
   # Run database migrations
   pnpm --filter @lib/database db:migrate
   ```

5. **Build all packages**
   ```bash
   pnpm build
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

The triggers application will be available at `http://localhost:8000/v1` with Swagger documentation at `http://localhost:8000/swagger`.

## Development Commands

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm --filter @lib/database build
pnpm --filter triggers build
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter api dev
```

### Database Operations

```bash
# Generate Prisma client
pnpm --filter @lib/database db:generate

# Run migrations
pnpm --filter @lib/database db:migrate

# Deploy migrations (production)
pnpm --filter @lib/database db:deploy
```

### Testing

```bash
# Run tests for all packages
pnpm test

# Run tests for specific package
pnpm --filter api test
```

## Architecture

The project follows a modular architecture with shared packages:

- **Database Layer**: Centralized database operations using Prisma ORM
- **API Layer**: RESTful APIs built with NestJS
- **Shared Utilities**: Common functionality across packages
- **Configuration**: Centralized ESLint and TypeScript configurations

## Key Features

- **Type Safety**: Full TypeScript support across all packages
- **Database Integration**: Prisma ORM with PostgreSQL
- **Exception Handling**: Comprehensive error handling for database operations
- **API Documentation**: Auto-generated Swagger documentation
- **Logging**: Structured logging with Winston
- **Development Tools**: Hot reload, debugging support, and comprehensive tooling

## Package Dependencies

The packages have the following dependency relationships:

- `api` app depends on `@lib/database`
- `@lib/database` is a standalone package that can be used by multiple applications
- Configuration packages are shared across all applications

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify your database is running
2. Check the environment variables in your `.env` file
3. Ensure the database URL format is correct
4. Run database migrations if needed

### Build Issues

If builds fail:

1. Clear node_modules and reinstall: `pnpm clean` or `rm -rf node_modules && pnpm install`
2. Clear Turborepo cache: `pnpm turbo clean`
3. Rebuild all packages: `pnpm build`

### Port Conflicts

If the default port (3000) is in use:

1. Update the `PORT` environment variable in your `.env` file
2. Restart the development server

## License

This project is licensed under the MIT License.
