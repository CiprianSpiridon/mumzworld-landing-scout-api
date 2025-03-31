import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResult } from '../sessions/entities/page-result.entity';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { ConfigService } from '../common/config/config.service';

@Controller('page-results')
@UseInterceptors(ClassSerializerInterceptor)
export class PageResultsController {
  constructor(
    @InjectRepository(PageResult)
    private readonly pageResultsRepository: Repository<PageResult>,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(): Promise<PageResult[]> {
    return this.pageResultsRepository.find({
      order: {
        scanTime: 'DESC',
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PageResult> {
    const pageResult = await this.pageResultsRepository.findOne({
      where: { id },
    });

    if (!pageResult) {
      throw new NotFoundException(`Page result with ID ${id} not found`);
    }

    return pageResult;
  }

  @Get('session/:sessionId')
  async findBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<PageResult[]> {
    return this.pageResultsRepository.find({
      where: { sessionId },
      order: {
        scanTime: 'ASC',
      },
    });
  }

  @Get(':id/screenshot')
  async getScreenshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const pageResult = await this.pageResultsRepository.findOne({
      where: { id },
    });

    if (!pageResult || !pageResult.screenshotPath) {
      throw new NotFoundException(
        `Screenshot for page result with ID ${id} not found`,
      );
    }

    // Build path from screenshotsDir and relative path in database
    const fullPath = join(
      this.configService.screenshotsDir,
      pageResult.screenshotPath,
    );
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      throw new NotFoundException(
        `Screenshot file not found: ${pageResult.screenshotPath}`,
      );
    }

    // Send the file as response
    response.sendFile(fullPath, { root: '/' });
  }
} 