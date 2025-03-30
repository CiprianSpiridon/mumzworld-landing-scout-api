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

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

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

    // Get the scout
    const scout = await this.scoutService.findOne(scoutId);

    // Create a new session
    const session = this.sessionRepository.create({
      scoutId,
      startTime: new Date(),
      status: SessionStatus.RUNNING,
      totalPagesScanned: 0,
    });

    // Save the session to get an ID
    const savedSession = await this.sessionRepository.save(session);

    // Run the session asynchronously
    this.runSession(scout, savedSession).catch((error) => {
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
   * Execute a scouting session
   */
  private async runSession(scout: Scout, session: ScoutingSession): Promise<void> {
    this.logger.log(`Executing session ${session.id} for scout ${scout.id}`);
    
    // Set start time
    const startTime = Date.now();
    
    try {
      // Create browser and page
      const { page, context } = await this.browserService.createPage();
      
      try {
        // Process the starting URL
        await this.processUrl(page, scout.startUrl, session, scout);
        
        // Get the list of visited URLs to avoid duplicates
        const visitedUrls = new Set<string>([scout.startUrl]);
        
        // Navigate to the starting URL
        await page.goto(scout.startUrl, { waitUntil: 'domcontentloaded' });
        
        // Auto-scroll to load dynamic content
        await autoScroll(page);
        
        // Extract links from the page
        const links = await extractLinks(page, scout.startUrl);
        
        // Process each link until we reach the maximum pages to visit
        const maxPages = scout.maxPagesToVisit || 100;
        for (const link of links) {
          // Skip already visited URLs
          if (visitedUrls.has(link)) {
            continue;
          }
          
          // Check if we've reached the maximum pages
          if (visitedUrls.size >= maxPages) {
            this.logger.log(`Reached maximum pages to visit (${maxPages})`);
            break;
          }
          
          // Add to visited URLs
          visitedUrls.add(link);
          
          // Process the URL
          await this.processUrl(page, link, session, scout);
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
      }
    } catch (error) {
      // Handle session errors
      session.status = SessionStatus.FAILED;
      session.endTime = new Date();
      session.errorMessage = error.message;
      
      this.logger.error(`Session ${session.id} failed: ${error.message}`);
    } finally {
      // Calculate total processing time
      const processingTime = Date.now() - startTime;
      this.logger.log(`Session ${session.id} completed in ${processingTime}ms`);
      
      // Save the updated session
      await this.sessionRepository.save(session);
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
      // Navigate to the URL
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: scout.timeout || 30000 });
      
      // Auto-scroll to load dynamic content
      await autoScroll(page);
      
      // Identify the page type
      const pageType = await this.processorService.identifyPageType(page, scout.pageTypes);
      
      if (pageType) {
        // Process the page using the appropriate processor
        const result = await this.processorService.processPage(page, url, pageType);
        
        // Update the page result with the processor result
        Object.assign(pageResult, result);
      } else {
        // No matching page type found
        pageResult.pageType = 'UNKNOWN';
        pageResult.productCount = 0;
      }
      
      // Set processing time
      pageResult.processingTimeMs = Date.now() - startTime;
      
      // Save the page result
      return this.pageResultRepository.save(pageResult);
    } catch (error) {
      // Handle page processing errors
      pageResult.status = PageResultStatus.ERROR;
      pageResult.errorMessage = error.message;
      pageResult.processingTimeMs = Date.now() - startTime;
      
      this.logger.error(`Error processing URL ${url}: ${error.message}`);
      
      // Save the error page result
      return this.pageResultRepository.save(pageResult);
    }
  }
} 