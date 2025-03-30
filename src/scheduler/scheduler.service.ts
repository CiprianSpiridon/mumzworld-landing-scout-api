import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';
import { ScoutService } from '../scouts/services/scout.service';
import { SessionService } from '../sessions/services/session.service';
import { ConfigService } from '../common/config/config.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly checkInterval: number;
  private readonly schedulerEnabled: boolean;

  constructor(
    private readonly scoutService: ScoutService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.checkInterval =
      this.configService.schedulerConfig.checkInterval || 60000;
    this.schedulerEnabled = this.configService.schedulerConfig.enabled !== false;
  }

  /**
   * Initialize scheduler on module init
   */
  onModuleInit() {
    if (this.schedulerEnabled) {
      this.logger.log(`Scheduler initialized with check interval: ${this.checkInterval}ms`);
    } else {
      this.logger.log('Scheduler is disabled');
    }
  }

  /**
   * Periodically check for scouts that need to be executed
   */
  @Interval(60000) // Use numeric value in milliseconds instead of string
  async checkScheduledScouts() {
    // Skip if scheduler is disabled
    if (!this.schedulerEnabled) {
      return;
    }

    this.logger.debug('Checking for scheduled scouts...');

    try {
      // Get all active scouts
      const scouts = await this.scoutService.findActive();

      // Check if any scouts need to be run
      const now = new Date();
      const scoutsToRun = scouts.filter((scout) => {
        // Skip scouts without a next run time
        if (!scout.nextRunAt) {
          return false;
        }

        // Check if the next run time is in the past
        return scout.nextRunAt <= now;
      });

      // Start sessions for scouts that need to be run
      for (const scout of scoutsToRun) {
        this.logger.log(`Starting scheduled session for scout: ${scout.name} (${scout.id})`);
        
        try {
          // Start a new session
          await this.sessionService.startSession(scout.id);

          // Update the scout's last run time
          await this.scoutService.updateLastRun(scout.id);
        } catch (error) {
          this.logger.error(
            `Error starting scheduled session for scout ${scout.id}: ${(error as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error checking scheduled scouts: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate when a scout should next run based on its cron schedule
   */
  calculateNextRunTime(cronExpression: string): Date {
    try {
      // Use cron directly to get the next scheduled time
      const CronJob = require('cron').CronJob;
      const job = new CronJob(cronExpression);
      return job.nextDate().toDate();
    } catch (error) {
      this.logger.error(`Invalid cron expression: ${cronExpression}`);
      // Return a far future date instead of null to avoid type issues
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }
  }
} 