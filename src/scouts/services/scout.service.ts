import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scout } from '../entities/scout.entity';
import { CreateScoutDto } from 'src/scouts/dto/create-scout.dto';
import { UpdateScoutDto } from 'src/scouts/dto/update-scout.dto';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ScoutService {
  private readonly logger = new Logger(ScoutService.name);

  constructor(
    @InjectRepository(Scout)
    private scoutRepository: Repository<Scout>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Create a new scout
   */
  async create(createScoutDto: CreateScoutDto): Promise<Scout> {
    this.logger.log(`Creating scout: ${createScoutDto.name}`);

    // Validate cron expression
    try {
      this.validateCronExpression(createScoutDto.schedule);
    } catch (error) {
      throw new Error(`Invalid schedule format: ${(error as Error).message}`);
    }

    // Create and save the new scout
    const scout = this.scoutRepository.create(createScoutDto);
    
    // Calculate the next run time based on the cron schedule
    scout.nextRunAt = this.calculateNextRunTime(createScoutDto.schedule);
    
    return this.scoutRepository.save(scout);
  }

  /**
   * Find all scouts
   */
  async findAll(): Promise<Scout[]> {
    return this.scoutRepository.find();
  }

  /**
   * Find all active scouts
   */
  async findActive(): Promise<Scout[]> {
    return this.scoutRepository.find({ where: { active: true } });
  }

  /**
   * Find a scout by ID
   */
  async findOne(id: string): Promise<Scout> {
    const scout = await this.scoutRepository.findOne({ where: { id } });
    
    if (!scout) {
      throw new NotFoundException(`Scout with ID "${id}" not found`);
    }
    
    return scout;
  }

  /**
   * Update a scout
   */
  async update(id: string, updateScoutDto: UpdateScoutDto): Promise<Scout> {
    this.logger.log(`Updating scout ${id}`);
    
    // Check if scout exists
    const scout = await this.findOne(id);
    
    // If schedule is being updated, validate and recalculate next run
    if (updateScoutDto.schedule) {
      try {
        this.validateCronExpression(updateScoutDto.schedule);
      } catch (error) {
        throw new Error(`Invalid schedule format: ${(error as Error).message}`);
      }
      
      // Calculate the next run time based on the new cron schedule
      updateScoutDto.nextRunAt = this.calculateNextRunTime(updateScoutDto.schedule);
    }
    
    // Update the scout
    Object.assign(scout, updateScoutDto);
    
    return this.scoutRepository.save(scout);
  }

  /**
   * Delete a scout
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing scout ${id}`);
    
    // Check if scout exists
    const scout = await this.findOne(id);
    
    // Delete the scout
    await this.scoutRepository.remove(scout);
  }

  /**
   * Update the last run time of a scout and calculate the next run time
   */
  async updateLastRun(id: string): Promise<Scout> {
    this.logger.log(`Updating last run time for scout ${id}`);
    
    // Check if scout exists
    const scout = await this.findOne(id);
    
    // Update the last run time to now
    scout.lastRunAt = new Date();
    
    // Calculate the next run time based on the cron schedule
    scout.nextRunAt = this.calculateNextRunTime(scout.schedule);
    
    return this.scoutRepository.save(scout);
  }

  /**
   * Validates a cron expression
   * @param cronExpression The cron expression to validate
   * @throws Error if the expression is invalid
   */
  private validateCronExpression(cronExpression: string): void {
    try {
      // Check if we can create a cron job with this expression
      const cronJob = this.schedulerRegistry.getCronJobs().get(cronExpression);
      if (cronJob === undefined) {
        // If the job doesn't exist, the expression is syntactically valid
        // but we need to create a temporary job to validate it
        const CronJob = require('cron').CronJob;
        new CronJob(cronExpression, () => {});
      }
    } catch (error) {
      this.logger.error(`Invalid cron expression: ${cronExpression}`);
      throw error;
    }
  }

  /**
   * Calculate the next run time based on a cron expression
   * @param cronExpression The cron expression to parse
   * @returns The next run time as a Date object, or null if the expression is invalid
   */
  private calculateNextRunTime(cronExpression: string): Date {
    try {
      // Use cron directly to get the next scheduled time
      const CronJob = require('cron').CronJob;
      const job = new CronJob(cronExpression);
      return job.nextDate().toDate();
    } catch (error) {
      this.logger.error(
        `Failed to calculate next run time: ${(error as Error).message}`,
      );
      // Return a far future date instead of null to avoid type issues
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    }
  }
} 