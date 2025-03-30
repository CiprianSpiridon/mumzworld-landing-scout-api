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

## Installation

```bash
# Install dependencies
$ npm install

# Install Playwright browsers
$ npx playwright install chromium
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
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

## License

This project is [MIT licensed](LICENSE).
