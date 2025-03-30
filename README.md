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

## Core Functionality

### Scout Configuration

Scouts are the central entities in LandingScout, each configured with:

- **Starting URL**: The entry point for crawling
- **Schedule**: Cron expression for automated execution
- **Page Types**: Definitions for different types of pages to analyze
- **Maximum Pages**: Limit on the number of pages to visit per session
- **Timeout**: Maximum time to spend on each page

Example scout configuration:
```json
{
  "name": "Homepage Scout",
  "startUrl": "https://www.example.com/en",
  "schedule": "0 */12 * * *",
  "pageTypes": [
    {
      "type": "category",
      "identifier": "div[id=\"category_label\"]",
      "countSelector": "#category_label span.text-tertiary-grey"
    },
    {
      "type": "collection",
      "identifier": "main .product-listing",
      "countSelector": ".product-count"
    }
  ],
  "active": true,
  "maxPagesToVisit": 25,
  "timeout": 60000
}
```

### Crawling and Link Extraction

The scouting process involves:

1. **Starting from the seed URL**: Each scout begins crawling from its defined starting URL
2. **Link extraction**: Identifying and collecting all internal links on the page
3. **URL filtering**: Applying exclusion patterns to avoid navigation, utility, and irrelevant pages
4. **Breadth-first crawling**: Methodically visiting links and collecting more URLs as it goes
5. **Page identification**: Determining the type of each visited page using selectors

The link extractor implements sophisticated filtering to avoid non-content areas:
- Navigation menus and headers/footers
- Login, cart, and account pages
- Multi-language versions of the same utility pages
- Proper handling of relative URLs

### Page Type Detection and Analysis

For each visited page, LandingScout:

1. **Identifies the page type**: Using CSS selectors to determine if it's a category, collection, or other page type
2. **Extracts product counts**: Finding and parsing the total product count from the page
3. **Fallback counting**: If a direct count isn't available, counting individual product elements
4. **Screenshot capture**: Taking full-page screenshots organized in session-specific folders
5. **Result storage**: Saving all relevant data, including URL, page type, product count, and processing time

### Scheduling and Automation

The built-in scheduler:

1. **Parses cron expressions**: Converting cron syntax into scheduled execution times
2. **Manages multiple scouts**: Running different scouts according to their schedules
3. **Calculates next run time**: Determining and storing when each scout will run next
4. **Handles errors gracefully**: Ensuring system stability even when individual scouts fail

### Data Organization

Results are organized hierarchically:

1. **Scouts**: Top-level entities defining what to monitor
2. **Sessions**: Individual scouting runs at specific times
3. **Page Results**: Detailed information about each visited page
4. **Screenshots**: Visual records organized by session ID and timestamp

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
  - `GET /api/scouts/:id/lastrun` - Get the last run time of a scout

- **Sessions Management**
  - `POST /api/sessions` - Create a new scouting session
  - `POST /api/sessions/start/:scoutId` - Manually run a scout
  - `GET /api/sessions` - Get all scouting sessions
  - `GET /api/sessions/:id` - Get details of a specific session
  - `GET /api/sessions/scout/:scoutId` - Get sessions for a specific scout
  - `POST /api/sessions/cancel/:id` - Cancel a running session

- **Page Results**
  - `GET /api/page-results` - Get all page results
  - `GET /api/page-results/:id` - Get a specific page result
  - `GET /api/page-results/session/:sessionId` - Get all results for a specific session

- **Exports and Statistics**
  - `GET /api/exports/sessions/:sessionId/csv` - Export session results to CSV
  - `GET /api/stats/scouts/:scoutId/trends` - Get product count trends for a scout

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
