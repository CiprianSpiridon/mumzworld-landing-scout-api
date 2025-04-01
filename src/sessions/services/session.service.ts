import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoutingSession } from '../entities/scouting-session.entity';
import { PageResult } from '../entities/page-result.entity';
import { SessionStatus } from '../entities/scouting-session.entity';
import { PageResultStatus } from '../entities/page-result.entity';
import { ScoutService } from '../../scouts/services/scout.service';
import { ProcessorService } from '../../scouts/processors/processor.service';
import { BrowserService } from '../../browser/browser.service';
import { extractLinks } from '../../common/utils/link-extractor';
import { autoScroll } from '../../common/utils/auto-scroll';
import { ConfigService } from '../../common/config/config.service';
import { Scout } from '../../scouts/entities/scout.entity';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private urlQueue: Record<string, string[]> = {};

  constructor(
    @InjectRepository(ScoutingSession)
    private readonly sessionRepository: Repository<ScoutingSession>,
    @InjectRepository(PageResult)
    private readonly pageResultRepository: Repository<PageResult>,
    private readonly scoutService: ScoutService,
    private readonly processorService: ProcessorService,
    private readonly browserService: BrowserService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get all scouting sessions
   */
  async findAll(): Promise<ScoutingSession[]> {
    return this.sessionRepository.find({
      relations: ['scout'],
      order: { startTime: 'DESC' },
    });
  }

  /**
   * Get all currently running sessions
   */
  async findRunning(): Promise<ScoutingSession[]> {
    return this.sessionRepository.find({
      where: { status: SessionStatus.RUNNING },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Get a session by ID
   */
  async findOne(id: string): Promise<ScoutingSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: { scout: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID "${id}" not found`);
    }

    // For running sessions, calculate the totalPagesScanned based on all page results
    if (session.status === SessionStatus.RUNNING) {
      // Count all page results
      const allResults = await this.pageResultRepository.count({
        where: { sessionId: id },
      });

      // Update totalPagesScanned with the total number of processed pages
      if (allResults > session.totalPagesScanned) {
        session.totalPagesScanned = allResults;
        await this.sessionRepository.save(session);
      }
    }

    return session;
  }

  /**
   * Get sessions for a specific scout
   */
  async findByScout(scoutId: string): Promise<ScoutingSession[]> {
    return this.sessionRepository.find({
      where: { scoutId },
      relations: ['scout'],
      order: { startTime: 'DESC' },
    });
  }

  /**
   * Start a new scouting session for a scout
   */
  async startSession(scoutId: string): Promise<ScoutingSession> {
    this.logger.log(`Starting session for scout ${scoutId}`);

    // Get the scout to validate it exists
    await this.scoutService.findOne(scoutId);

    // Create a new session
    const session = this.sessionRepository.create({
      scoutId,
      startTime: new Date(),
      status: SessionStatus.RUNNING,
      totalPagesScanned: 0,
    });

    // Save the session to get an ID
    const savedSession = await this.sessionRepository.save(session);
    this.logger.log(`Created session with ID ${savedSession.id}`);

    // Initialize the URL queue for this session
    this.urlQueue[savedSession.id] = [];

    // Run the session asynchronously
    this.runSession(savedSession.id).catch((error: Error) => {
      this.logger.error(`Error during session execution: ${error.message}`);
    });

    return savedSession;
  }

  /**
   * Cancel a running session
   */
  async cancelSession(id: string): Promise<ScoutingSession> {
    const session = await this.findOne(id);

    if (
      session.status !== SessionStatus.RUNNING &&
      session.status !== SessionStatus.PENDING
    ) {
      throw new Error(`Session is not running or pending, cannot cancel`);
    }

    session.status = SessionStatus.CANCELLED;
    session.endTime = new Date();

    return this.sessionRepository.save(session);
  }

  /**
   * Main scouting session execution function.
   * This runs in a background thread and processes URLs one by one.
   */
  private async runSession(sessionId: string): Promise<void> {
    this.logger.log(`Executing session ${sessionId}`);

    // Set start time
    const startTime = Date.now();
    let page: any = null;
    let context: any = null;
    let pagesScanned = 0; // Counter for successfully scanned pages

    try {
      // Get the session and scout
      const session = await this.findOne(sessionId);
      this.logger.log(`Starting session for scout ${session.scoutId} with session ID ${session.id}`);
      
      const scout = await this.scoutService.findOne(session.scoutId);

      // Create screenshots directory for this session if needed
      if (this.configService.areScreenshotsEnabled) {
        await this.createSessionScreenshotsDirectory(session.id);
      }

      // Create browser and page
      try {
        const browser = await this.browserService.createPage();
        page = browser.page;
        context = browser.context;
      } catch (browserError) {
        throw new Error(`Failed to create browser: ${browserError instanceof Error ? browserError.message : 'unknown error'}`);
      }

      if (!page) {
        throw new Error('Failed to create browser page');
      }

      try {
        // Navigate to the starting URL
        await page.goto(scout.startUrl, { waitUntil: 'domcontentloaded' });

        // Auto-scroll to load dynamic content
        await autoScroll(page);

        // Initialize visited URLs set
        const visitedUrls = new Set<string>([scout.startUrl]);

        // Process the starting URL
        try {
          const result = await this.processUrl(page, scout.startUrl, session, scout);
          if (result && result.status === PageResultStatus.SUCCESS) {
            pagesScanned++;
            
            // Update the session with the count of successfully processed pages
            session.totalPagesScanned = pagesScanned;
            await this.sessionRepository.save(session);
          }
        } catch (startUrlError) {
          this.logger.error(`Failed to process starting URL: ${startUrlError instanceof Error ? startUrlError.message : 'unknown error'}`);
          // Continue anyway to extract links if possible
        }

        // Extract links from the page
        const links = await extractLinks(page, []);

        // Add links to the URL queue
        this.urlQueue[sessionId] = links.filter(
          (link) => !visitedUrls.has(link),
        );

        // Process each link until we reach the maximum pages to visit
        const maxPages = scout.maxPagesToVisit || 100;
        while (
          visitedUrls.size < maxPages &&
          this.urlQueue[sessionId]?.length > 0
        ) {
          // Refresh our session reference to ensure it's valid
          const currentSession = await this.findOne(sessionId);
          
          // Check if session was cancelled
          if (currentSession.status === SessionStatus.CANCELLED) {
            await this.sessionRepository.save(currentSession);
            break;
          }
          
          // Get next URL from queue
          const nextUrl = this.urlQueue[sessionId].shift();
          if (!nextUrl) break;
          
          // Skip already visited URLs
          if (visitedUrls.has(nextUrl)) {
            continue;
          }
          
          // Add to visited URLs
          visitedUrls.add(nextUrl);
          
          // Process the URL - wrap in try/catch to continue even if one URL fails
          try {
            if (!currentSession || !currentSession.id) {
              throw new Error(`Invalid session: missing session ID for ${sessionId}`);
            }
            
            const result = await this.processUrl(page, nextUrl, currentSession, scout);
            
            // If a new page and context were created in processUrl, update our references
            if (result.newPage) {
              page = result.newPage;
              context = result.newContext;
            }
            
            // Increment pages scanned regardless of success or failure
            pagesScanned++;
            currentSession.totalPagesScanned = pagesScanned;
            await this.sessionRepository.save(currentSession);
            this.logger.log(`Updated totalPagesScanned to ${pagesScanned} for session ${sessionId}`);
          } catch (urlError) {
            this.logger.error(`Failed to process URL ${nextUrl}: ${urlError instanceof Error ? urlError.message : 'unknown error'}`);
            // Continue with next URL
            continue;
          }
          
          // Extract more links if needed
          try {
            const newLinks = await extractLinks(page, []);
            for (const link of newLinks) {
              if (!visitedUrls.has(link) && !this.urlQueue[sessionId].includes(link)) {
                this.urlQueue[sessionId].push(link);
              }
            }
          } catch (error) {
            if (error instanceof Error) {
              this.logger.warn(`Error extracting links from ${nextUrl}: ${error.message}`);
            }
          }
        }
        
        // Update the session status at the end of processing
        const finalSession = await this.findOne(sessionId);
        finalSession.status = SessionStatus.COMPLETED;
        finalSession.endTime = new Date();
        finalSession.totalPagesScanned = pagesScanned;
        
        // Save the updated session
        await this.sessionRepository.save(finalSession);
        
        // Update the scout's last run time
        await this.scoutService.updateLastRun(scout.id);
      } finally {
        // Shorter delay before closing the browser
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
          if (page && context) {
            await this.browserService.closePage(page, context);
          }
        } catch (closeError) {
          this.logger.warn(`Error closing browser: ${closeError instanceof Error ? closeError.message : 'unknown error'}`);
        }
        
        // Clean up the URL queue for this session
        delete this.urlQueue[sessionId];
      }
    } catch (error) {
      // Handle session errors
      const session = await this.findOne(sessionId);
      session.status = SessionStatus.FAILED;
      session.endTime = new Date();
      session.totalPagesScanned = pagesScanned; // Ensure we save any pages that were scanned
      
      if (error instanceof Error) {
        session.errorMessage = error.message;
        this.logger.error(`Session ${session.id} failed: ${error.message}`);
      } else {
        session.errorMessage = 'Unknown error';
        this.logger.error(`Session ${session.id} failed with unknown error`);
      }
      
      // Save the updated session
      await this.sessionRepository.save(session);
    } finally {
      // Calculate total processing time
      const processingTime = Date.now() - startTime;
      
      // Get the session one more time to ensure we have the latest state
      try {
        const session = await this.findOne(sessionId);
        this.logger.log(`Session ${session.id} completed in ${processingTime}ms`);
        
        // Save the updated session if not already saved
        if (session.status === SessionStatus.RUNNING) {
          session.status = SessionStatus.COMPLETED;
          session.endTime = new Date();
          await this.sessionRepository.save(session);
        }
      } catch (finalError) {
        this.logger.error(`Error in session cleanup: ${finalError instanceof Error ? finalError.message : 'unknown error'}`);
      }
    }
  }

  /**
   * Process a URL during a scouting session
   */
  private async processUrl(
    page: any,
    url: string,
    session: ScoutingSession,
    scout: Scout,
  ): Promise<PageResult & { newPage?: any; newContext?: any }> {
    const startTime = Date.now();
    let context: any = null;
    let createdNewPage = false;
    
    // Validate session and get a fresh reference
    if (!session || !session.id) {
      throw new Error(`Invalid session: session is null or missing ID`);
    }
    
    // Create a page result entry with valid sessionId
    const pageResult = this.pageResultRepository.create({
      sessionId: session.id, // Use the provided session ID directly
      url,
      scanTime: new Date(),
      status: PageResultStatus.SUCCESS,
      processingTimeMs: 0, // Initialize with 0, will be updated in finally block
    });
    
    try {
      this.logger.log(`Processing URL: ${url}`);
      
      // Check if the page is still valid before continuing
      if (!this.browserService.isPageValid(page)) {
        this.logger.warn(`Page is invalid or closed, creating a new one for session ${session.id}`);
        
        try {
          const browser = await this.browserService.createPage();
          page = browser.page;
          context = browser.context;
          createdNewPage = true;
        } catch (browserError) {
          this.logger.error(`Failed to create new page: ${browserError instanceof Error ? browserError.message : 'unknown error'}`);
          pageResult.status = PageResultStatus.ERROR;
          pageResult.errorMessage = `Failed to create browser page: ${browserError instanceof Error ? browserError.message : 'unknown error'}`;
          await this.pageResultRepository.save(pageResult);
          return Object.assign(pageResult, { newPage: null, newContext: null });
        }
      }
      
      // Navigate to the URL with better error handling
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: Math.min(15000, scout.timeout || 30000)
        });
      } catch (navError) {
        this.logger.error(`Navigation error for ${url}: ${navError.message}`);
        pageResult.status = PageResultStatus.ERROR;
        pageResult.errorMessage = `Navigation failed: ${navError.message}`;
        
        // Save the page result even if navigation failed
        await this.pageResultRepository.save(pageResult);
        
        if (createdNewPage) {
          return Object.assign(pageResult, { newPage: page, newContext: context });
        }
        return pageResult;
      }
      
      // Let's wrap all page operations in try/catch to handle any potential browser closure
      try {
        // Wait for content to load and scroll to load dynamic content
        await page.waitForLoadState('networkidle', { 
          timeout: Math.min(3000, scout.timeout || 3000)  // Reduced from 5000ms to 3000ms max
        }).catch(() => {
          this.logger.warn(`Network idle timeout for ${url}`);
        });
      
        // Use shorter delays for homepage scrolling
        const isHomepage = url === scout.startUrl;
        const scrollDelay = isHomepage ? 200 : 50; // Reduced from 500/100 to 200/50
        const finalTimeout = isHomepage ? 10000 : 500; // Reduced from 10000/1000 to 5000/500
      
        await autoScroll(page, 100, scrollDelay, 50, finalTimeout);
      
        // First, identify the page type
        const identifiedPageType = await this.processorService.identifyPageType(page, scout.pageTypes);
      
        if (identifiedPageType) {
          // Process the page to get product count
          const pageTypeResult = await this.processorService.processPage(
            page, 
            url,
            identifiedPageType
          );
          
          if (pageTypeResult) {
            // Found a matching page type
            pageResult.pageType = pageTypeResult.pageType || 'UNKNOWN';
            pageResult.productCount = pageTypeResult.productCount || 0;
            pageResult.status = PageResultStatus.SUCCESS;
            this.logger.log(`Found ${pageResult.productCount} products on ${url} (${pageResult.pageType})`);
          } else {
            // Processing failed
            pageResult.pageType = identifiedPageType.type || 'UNKNOWN';
            pageResult.productCount = 0;
            pageResult.status = PageResultStatus.ERROR;
            pageResult.errorMessage = 'Failed to process page content';
          }
        } else {
          // Unknown page type
          pageResult.pageType = 'UNKNOWN';
          pageResult.status = PageResultStatus.ERROR;
          pageResult.errorMessage = 'Unknown page type';
        }
      } catch (pageProcessError) {
        // Handle any errors that occur during page processing
        this.logger.error(`Error processing page content for ${url}: ${pageProcessError instanceof Error ? pageProcessError.message : 'unknown error'}`);
        pageResult.status = PageResultStatus.ERROR;
        pageResult.errorMessage = `Page processing error: ${pageProcessError instanceof Error ? pageProcessError.message : 'unknown error'}`;
      }
      
      // Try to take a screenshot if enabled
      if (this.configService.areScreenshotsEnabled) {
        try {
          // Create a unique filename based on timestamp and URL
          const timestamp = Date.now();
          const urlSafeFilename = url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
          const filename = `${timestamp}_${urlSafeFilename}.png`;
          const screenshotDir = `${this.configService.screenshotsDir}/${session.id}`;
          const screenshotPath = `${screenshotDir}/${filename}`;
          
          await page.screenshot({ path: screenshotPath, fullPage: true });
          
          // Store relative path in the database
          pageResult.screenshotPath = `screenshots/${session.id}/${filename}`;
        } catch (screenshotError) {
          this.logger.warn(`Failed to capture screenshot for ${url}: ${screenshotError instanceof Error ? screenshotError.message : 'unknown error'}`);
          // Don't fail the whole process due to screenshot failure
        }
      }
      
      // Get HTML snapshot if enabled
      if (this.configService.isHtmlSnapshotEnabled) {
        try {
          pageResult.htmlSnapshot = await page.content();
        } catch (htmlError) {
          this.logger.warn(
            `Failed to capture HTML for ${url}: ${htmlError instanceof Error ? htmlError.message : 'unknown error'}`,
          );
          // Don't fail the whole process due to HTML capture failure
        }
      }
    } catch (error) {
      // Handle any other unexpected errors
      this.logger.error(
        `Unexpected error processing ${url}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      pageResult.status = PageResultStatus.ERROR;
      pageResult.errorMessage = `Unexpected error: ${error instanceof Error ? error.message : 'unknown error'}`;
    } finally {
      // Record the processing time
      pageResult.processingTimeMs = Date.now() - startTime;

      // Save the page result
      try {
        await this.pageResultRepository.save(pageResult);
      } catch (saveError) {
        this.logger.error(
          `Failed to save page result for ${url}: ${saveError instanceof Error ? saveError.message : 'unknown error'}`,
        );
      }
    }

    // Return the result, including any new page and context references
    return Object.assign(
      pageResult,
      createdNewPage
        ? {
            newPage: page,
            newContext: context,
      } : {},
    );
  }

  /**
   * Create a directory for storing screenshots for a specific session
   */
  private async createSessionScreenshotsDirectory(
    sessionId: string,
  ): Promise<void> {
    try {
      const dirPath = this.getSessionScreenshotsDirectory(sessionId);

      // Create parent screenshots directory if it doesn't exist
      await fs.mkdir(this.configService.screenshotsDir, { recursive: true });

      // Create session-specific directory
      await fs.mkdir(dirPath, { recursive: true });

      this.logger.log(`Created screenshots directory for session ${sessionId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create screenshots directory: ${error.message}`,
        );
      }
    }
  }

  /**
   * Get the path to the screenshots directory for a specific session
   */
  private getSessionScreenshotsDirectory(sessionId: string): string {
    return join(this.configService.screenshotsDir, sessionId);
  }

  /**
   * Check if a URL should be skipped based on exclusion patterns
   */
  private shouldSkipUrl(url: string, pageTypes: any[]): boolean {
    // Implementation based on your exclusion logic
    return false;
  }
} 