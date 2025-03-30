# LandingScout

A powerful tool for monitoring e-commerce landing pages and tracking product counts across different page types.

## Overview

LandingScout allows you to create multiple "scouts" that monitor different parts of your e-commerce website. Each scout can be scheduled to run at specific intervals and will track product counts on various page types.

Key features:
- Multiple configurable scouts with individual schedules
- Smart URL crawling with customizable exclusion patterns
- Automatic page type detection for different layouts
- Product counting across category and collection pages
- Screenshot capturing with session-based organization
- Historical data tracking with detailed session results
- Export to CSV functionality
- Flexible scheduling with cron expressions
- Docker-based development and deployment

## Data Model

LandingScout uses a hierarchical data model:

```
Scout 1 ──┬── Session 1 ──┬── Page Result 1
          │               ├── Page Result 2
          │               └── Page Result 3
          │
          ├── Session 2 ──┬── Page Result 4
          │               ├── Page Result 5
          │               └── Page Result 6
          │
          └── Session 3 ──┬── Page Result 7
                          └── Page Result 8

Scout 2 ──┬── Session 4 ──┬── Page Result 9
          │               └── Page Result 10
          │
          └── Session 5 ──┬── Page Result 11
                          └── Page Result 12
```

- **Scouts**: Configured monitoring entities with unique starting URLs and schedules
- **Scouting Sessions**: Individual runs of a scout at a specific time
- **Page Results**: Individual pages visited during a session with their product counts

## Features

### URL Exclusion Patterns

LandingScout implements smart URL exclusion to avoid crawling irrelevant pages:

- Global exclusion patterns for common non-content pages (cart, login, etc.)
- Language-specific exclusion patterns (e.g., `/en/cart`, `/ar/cart`)
- CSS selector-based exclusions for navigation elements
- Exact path matching with `$` ending pattern support

### Page Type Detection

The system automatically identifies different page types:

- Category pages with product listings
- Collection pages with featured products
- Custom selectors for product counting on different page layouts

### Screenshots

LandingScout captures screenshots of visited pages:

- Organized in session-specific folders for easy browsing
- Automatic screenshot directory creation
- Filename includes timestamp and sanitized URL
- Full-page screenshots for complete content capture

### Data Persistence

All scouting data is stored for historical analysis:

- Scout configurations with schedules
- Session details with status and timing information
- Individual page results with product counts
- Screenshot paths for visual reference

## Documentation

For detailed requirements and architecture, see [Requirements](./docs/requirements.md).

## Setup

### Environment Configuration

1. Create a `.env` file based on the provided example configuration:

```bash
# Copy the example environment file
$ cp .env.example .env

# Edit the .env file to match your configuration
$ nano .env
```

2. Make sure Docker and Docker Compose are installed on your system.

## Running the App

### Docker Development

```bash
# Start development containers (with hot-reload)
$ npm run docker:dev

# Rebuild and start development containers
$ npm run docker:dev:build
```

### Docker Production

```bash
# Run database migrations first
$ ./docker/migrate.sh

# Start production containers
$ npm run docker:prod

# Rebuild and start production containers
$ npm run docker:prod:build
```

### Build Performance

For better build performance, the project is configured to use Docker Compose with Buildx Bake. This is enabled by default in the `.env` file with:

```
COMPOSE_BAKE=true
```

This setting allows Docker Compose to delegate builds to Buildx Bake, which:
- Uses BuildKit for faster, more efficient builds
- Supports better caching mechanisms
- Enables parallel building of multiple containers

To disable this feature, set `COMPOSE_BAKE=false` or remove the setting from your `.env` file.

## Database Migrations

LandingScout uses TypeORM migrations to manage the database schema:

```bash
# Generate a new migration
$ npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
$ npm run migration:run

# Revert the most recent migration
$ npm run migration:revert
```

When using Docker, run migrations using the provided script:

```bash
$ ./docker/migrate.sh
```

## API Endpoints

Once running, you can access the following endpoints:

- **Scouts Management**
  - `POST /api/scouts` - Create a new scout
  - `GET /api/scouts` - List all scouts
  - `GET /api/scouts/:id` - Get a specific scout
  - `PATCH /api/scouts/:id` - Update a scout
  - `DELETE /api/scouts/:id` - Delete a scout

- **Sessions Management**
  - `POST /api/sessions/start/:scoutId` - Manually run a scout
  - `GET /api/sessions` - Get all scouting sessions
  - `GET /api/sessions/:id` - Get details of a specific session
  - `GET /api/sessions/scout/:scoutId` - Get sessions for a specific scout

## Docker Configuration

### Development Environment
- Hot-reloading enabled
- Code changes reflect immediately
- Source code mounted from host system
- Debug port (9229) exposed for debugging

### Production Environment
- Optimized for deployment
- Separate migration process for controlled database updates
- Application built during Docker image creation

## License

This project is [MIT licensed](LICENSE).
