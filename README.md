# LandingScout

A powerful tool for monitoring e-commerce landing pages and tracking product counts across different page types.

## Overview

LandingScout allows you to create multiple "scouts" that monitor different parts of your e-commerce website. Each scout can be scheduled to run at specific intervals and will track product counts on various page types.

Key features:
- Multiple configurable scouts
- Scheduled monitoring
- Automatic page type detection
- Product counting across different page layouts
- Historical data tracking
- Export to CSV

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

- `POST /scouts` - Create a new scout
- `GET /scouts` - List all scouts
- `GET /scouts/:id` - Get a specific scout
- `PATCH /scouts/:id` - Update a scout
- `DELETE /scouts/:id` - Delete a scout
- `POST /sessions/:scoutId` - Manually run a scout
- `GET /sessions` - Get all scouting sessions
- `GET /sessions/:id` - Get details of a specific session

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
