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
   * Get a session by ID
   */
  async findOne(id: string): Promise<ScoutingSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['scout', 'pageResults'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID "${id}" not found`);
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

    if (session.status !== SessionStatus.RUNNING && session.status !== SessionStatus.PENDING) {
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
    
    try {
      // Get the session and scout
      const session = await this.findOne(sessionId);
      const scout = await this.scoutService.findOne(session.scoutId);
      
      // Create screenshots directory for this session if needed
      if (this.configService.areScreenshotsEnabled) {
        await this.createSessionScreenshotsDirectory(session.id);
      }
      
      // Create browser and page
      const { page, context } = await this.browserService.createPage();
      
      try {
        // Navigate to the starting URL
        await page.goto(scout.startUrl, { waitUntil: 'domcontentloaded' });
        
        // Auto-scroll to load dynamic content
        await autoScroll(page);
        
        // Process the starting URL
        await this.processUrl(page, scout.startUrl, session, scout);
        
        // Get the list of visited URLs to avoid duplicates
        const visitedUrls = new Set<string>([scout.startUrl]);
        
        // Extract links from the page
        const links = await extractLinks(page, []);
        
        // Add links to the URL queue
        this.urlQueue[sessionId] = links.filter(link => !visitedUrls.has(link));
        
        // Process each link until we reach the maximum pages to visit
        const maxPages = scout.maxPagesToVisit || 100;
        while (
          visitedUrls.size < maxPages && 
          this.urlQueue[sessionId]?.length > 0
        ) {
          // Check if session was cancelled
          const updatedSession = await this.findOne(sessionId);
          if (updatedSession.status === SessionStatus.CANCELLED) {
            session.status = SessionStatus.CANCELLED;
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
          
          // Process the URL
          await this.processUrl(page, nextUrl, session, scout);
          
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
        
        // Update the session status
        session.status = SessionStatus.COMPLETED;
        session.endTime = new Date();
        session.totalPagesScanned = visitedUrls.size;
        
        // Update the scout's last run time
        await this.scoutService.updateLastRun(scout.id);
      } finally {
        // Close the browser context
        await this.browserService.closePage(page, context);
        
        // Clean up the URL queue for this session
        delete this.urlQueue[sessionId];
      }
    } catch (error) {
      // Handle session errors
      const session = await this.findOne(sessionId);
      session.status = SessionStatus.FAILED;
      session.endTime = new Date();
      
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
      const session = await this.findOne(sessionId);
      this.logger.log(`Session ${session.id} completed in ${processingTime}ms`);
      
      // Save the updated session if not already saved
      if (session.status === SessionStatus.RUNNING) {
        session.status = SessionStatus.COMPLETED;
        session.endTime = new Date();
        await this.sessionRepository.save(session);
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
  ): Promise<PageResult> {
    const startTime = Date.now();
    
    // Create a page result entry
    const pageResult = this.pageResultRepository.create({
      sessionId: session.id,
      url,
      scanTime: new Date(),
      status: PageResultStatus.SUCCESS,
    });
    
    try {
      this.logger.log(`Processing URL: ${url}`);
      
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: scout.timeout || 30000
      });
      
      // Wait for content to load and scroll to load dynamic content
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      // Use longer delay for homepage (startUrl) to ensure all content loads
      const isHomepage = url === scout.startUrl;
      const scrollDelay = isHomepage ? 300 : 100;
      const finalTimeout = isHomepage ? 5000 : 1000;
      
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
      
      // Take a screenshot if configured
      if (this.configService.areScreenshotsEnabled) {
        try {
          // Create a page-specific filename with timestamp and sanitized URL
          const timestamp = Date.now();
          const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
          const filename = `${timestamp}_${sanitizedUrl}.png`;
          
          // Save to the session-specific directory
          const screenshotPath = join(this.getSessionScreenshotsDirectory(session.id), filename);
          
          await page.screenshot({ path: screenshotPath, fullPage: true });
          
          // Store relative path in the database for easier access
          const relativeScreenshotPath = screenshotPath.replace(this.configService.screenshotsDir, '');
          pageResult.screenshotPath = relativeScreenshotPath;
        } catch (error) {
          if (error instanceof Error) {
            this.logger.warn(`Failed to take screenshot: ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      // Handle errors during page processing
      pageResult.status = PageResultStatus.ERROR;
      
      if (error instanceof Error) {
        pageResult.errorMessage = error.message;
        this.logger.error(`Error processing ${url}: ${error.message}`);
      } else {
        pageResult.errorMessage = 'Unknown error';
        this.logger.error(`Error processing ${url}: Unknown error`);
      }
    } finally {
      // Calculate processing time
      pageResult.processingTimeMs = Date.now() - startTime;
      
      // Save the page result
      return this.pageResultRepository.save(pageResult);
    }
  }
  
  /**
   * Create a directory for storing screenshots for a specific session
   */
  private async createSessionScreenshotsDirectory(sessionId: string): Promise<void> {
    try {
      const dirPath = this.getSessionScreenshotsDirectory(sessionId);
      
      // Create parent screenshots directory if it doesn't exist
      await fs.mkdir(this.configService.screenshotsDir, { recursive: true });
      
      // Create session-specific directory
      await fs.mkdir(dirPath, { recursive: true });
      
      this.logger.log(`Created screenshots directory for session ${sessionId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to create screenshots directory: ${error.message}`);
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