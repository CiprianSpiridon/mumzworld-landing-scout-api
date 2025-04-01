import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResult } from '../sessions/entities/page-result.entity';
import { ScoutingSession } from '../sessions/entities/scouting-session.entity';
import { ConfigService } from '../common/config/config.service';

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(PageResult)
    private pageResultRepository: Repository<PageResult>,
    @InjectRepository(ScoutingSession)
    private sessionRepository: Repository<ScoutingSession>,
    private configService: ConfigService,
  ) {}

  async exportSessionToCsv(sessionId: string): Promise<string> {
    // Check if session exists
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Get all page results for this session
    const pageResults = await this.pageResultRepository.find({
      where: { sessionId },
      order: { scanTime: 'ASC' },
    });

    if (!pageResults.length) {
      throw new NotFoundException(`No page results found for session ${sessionId}`);
    }

    // Get base URL for screenshots
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    // Define CSV headers
    const headers = [
      'URL',
      'Type',
      'Status',
      'Product Count',
      'Scan Time',
      'Error Message',
      'Screenshot URL',
    ];

    // Prepare data rows for CSV
    const rows = pageResults.map(result => [
      result.url,
      result.pageType || '',
      result.status,
      result.productCount?.toString() || '0',
      result.scanTime?.toISOString() || '',
      result.errorMessage || '',
      result.screenshotPath ? `${baseUrl}/${result.screenshotPath}` : '',
    ]);

    // Generate CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if the value contains commas or quotes
          cell.includes(',') || cell.includes('"') 
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }
} 