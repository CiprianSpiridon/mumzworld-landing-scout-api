# LandingScout Requirements

## Overview

LandingScout is a tool designed to monitor e-commerce landing pages and track product counts across different page types. The system will allow creating multiple "scouts" that can be scheduled to run at specified intervals, each with its own starting point and configuration.

## Core Functionality

1. **Multiple Scouts**:
   - Create and manage multiple scout configurations
   - Each scout has its own starting URL and schedule
   - Scouts can be activated/deactivated independently

2. **Page Analysis**:
   - Extract internal links from the starting page
   - Navigate to each link and identify page type
   - Count products using appropriate selectors for that page type
   - Record results including URL, page type, and product count

3. **Scheduling**:
   - Each scout's schedule is stored in the database
   - Schedules are defined using cron expressions for flexibility
   - Changes to schedules take effect without requiring application restart
   - Scheduler service periodically checks for scouts that need to be run
   - Manual triggering of scouts is supported for on-demand sessions

4. **Common Exclusions**:
   - System-wide exclusion patterns for navigation, headers, footers, etc.
   - These apply to all scouts since they target the same platform

5. **Data Storage**:
   - Each scout execution creates a new "scouting session" record in the database
   - All pages visited during a session are stored with their product counts
   - Historical data is preserved for trend analysis
   - Support for exporting results to CSV

## System Architecture

```
landingscout/
├── src/
│   ├── common/                     # Shared resources
│   │   ├── constants/              
│   │   │   └── exclusions.ts       # Common exclusion patterns
│   │   └── utils/                 
│   │       ├── auto-scroll.ts
│   │       └── link-extractor.ts
│   │
│   ├── scouts/                     # Scout definitions
│   │   ├── scouts.module.ts
│   │   ├── scouts.service.ts       # Manages all scouts
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   ├── create-scout.dto.ts
│   │   │   └── update-scout.dto.ts
│   │   ├── entities/
│   │   │   └── scout.entity.ts     # Scout database model
│   │   └── processors/             # Page type processors
│   │       ├── category.processor.ts
│   │       ├── collection.processor.ts
│   │       └── processor.interface.ts
│   │
│   ├── sessions/                   # Scouting session functionality
│   │   ├── sessions.module.ts
│   │   ├── sessions.service.ts     # Executes scouting sessions
│   │   └── entities/
│   │       ├── scouting-session.entity.ts
│   │       └── page-result.entity.ts
│   │
│   ├── scheduler/                  # Scheduling module
│   │   ├── scheduler.module.ts
│   │   ├── scheduler.service.ts    # Manages scheduled scout runs
│   │   └── interfaces/
│   │       └── schedule.interface.ts
│   │
│   ├── api/                        # API Controllers
│   │   ├── api.module.ts
│   │   ├── scouts.controller.ts    # CRUD for scouts
│   │   └── sessions.controller.ts  # Manage and view scouting sessions
│   │
│   ├── database/                   # Database configuration
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   │
│   ├── app.module.ts               # Main module
│   └── main.ts                     # Entry point
```

## Database Schema

### Scout Entity
Represents a configured scout to monitor a specific starting point.

```
Scout {
  id: UUID (PK)
  name: String                // Display name for this scout
  startUrl: String            // Starting URL for crawling
  schedule: String            // Cron expression for scheduling (dynamically configurable)
  pageTypes: JSON             // Array of page types to look for with their selectors
  active: Boolean             // Whether this scout is currently active
  maxPagesToVisit: Integer    // Maximum number of pages to visit per session (optional)
  timeout: Integer            // Timeout in ms for page loads (optional)
  lastRunAt: DateTime         // When this scout was last run (optional)
  nextRunAt: DateTime         // When this scout should next run (calculated field)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Scouting Session Entity
Represents a single execution of a scout.

```
ScoutingSession {
  id: UUID (PK)
  scoutId: UUID (FK → Scout)
  startTime: DateTime         // When the session started
  endTime: DateTime           // When the session completed
  totalPagesScanned: Integer  // Total number of pages analyzed
  status: String              // COMPLETED, FAILED, TIMEOUT, etc.
  errorMessage: String        // Error details if status is FAILED (optional)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Page Result Entity
Individual page results from a scouting session.

```
PageResult {
  id: UUID (PK)
  sessionId: UUID (FK → ScoutingSession)
  url: String                 // Full URL of the page
  pageType: String            // CATEGORY, COLLECTION, UNKNOWN, etc.
  productCount: Integer       // Number of products found
  scanTime: DateTime          // When this specific page was scanned
  processingTimeMs: Integer   // How long it took to process this page
  status: String              // SUCCESS, ERROR, etc.
  errorMessage: String        // Error details if status is ERROR (optional)
  screenshotPath: String      // Path to screenshot if enabled (optional)
  htmlSnapshot: Text          // HTML snapshot if enabled (optional)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Scout History Entity
Aggregated historical data for trend analysis.

```
ScoutHistory {
  id: UUID (PK)
  scoutId: UUID (FK → Scout)
  date: Date                  // Date of this history record
  totalSessions: Integer      // Number of sessions on this date
  successfulSessions: Integer // Number of successful sessions
  failedSessions: Integer     // Number of failed sessions
  avgPagesScanned: Float      // Average number of pages scanned
  avgProductCount: Float      // Average product count across all pages
  maxProductCount: Integer    // Maximum product count found
  minProductCount: Integer    // Minimum product count found
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Scheduler Implementation

The scheduler will:
1. Periodically query the database for active scouts
2. Check each scout's schedule (cron expression) to determine if it should run
3. Track the last run time to prevent duplicate executions
4. Calculate the next scheduled run time
5. Handle schedule changes dynamically without requiring application restart

This approach allows for:
- Dynamic scheduling through database configuration
- Immediate application of schedule changes
- Resilience in case of application restart
- Centralized scheduling logic

## Example Scout Configuration

```json
{
  "id": "uuid-here",
  "name": "Mumzworld Homepage Scout",
  "startUrl": "https://www.mumzworld.com/en",
  "schedule": "0 0 * * *", // Daily at midnight (stored in database)
  "pageTypes": [
    {
      "type": "category",
      "identifier": "#category_label",
      "countSelector": "#category_label span.text-tertiary-grey"
    },
    {
      "type": "collection",
      "identifier": "#category_label",
      "countSelector": "#category_label span.text-tertiary-grey"
    }
  ],
  "maxPagesToVisit": 100,
  "timeout": 30000,
  "active": true,
  "lastRunAt": "2023-07-01T00:00:00Z",
  "nextRunAt": "2023-07-02T00:00:00Z"
}
```

## Common Exclusion Patterns

The system will have standard exclusion patterns to filter out non-content elements:

```javascript
const commonExclusions = [
  'nav', // Exclude navigation
  'header', // Exclude header
  'footer', // Exclude footer
  '.cookie-banner', // Exclude cookie banner
  '.newsletter-popup', // Exclude newsletter popup
  'a[href*="/cart"]', // Exclude cart links
  'a[href*="/sign-in"]', // Exclude sign-in links
  'a[href*="/login"]' // Exclude login links
];
```

## Page Processors

Each page type will have a dedicated processor that knows how to:
1. Identify if a page matches that type
2. Extract the relevant product count
3. Handle any type-specific parsing needs

## Data Export and Reporting

The system will support:
1. CSV export of scouting session results
2. Basic reporting on scout performance
3. Trend analysis for product counts over time
4. Anomaly detection for sudden changes in product counts

## Tech Stack

- NestJS: Backend framework
- Playwright: Browser automation for scraping
- TypeORM: Database ORM for PostgreSQL
- PostgreSQL: Database for storing scout configurations and session results
- @nestjs/schedule: Task scheduling
- CSV Writer: For exporting results to CSV 