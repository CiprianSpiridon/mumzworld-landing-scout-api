import { Controller, Get, Param, Res, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('sessions/:sessionId/csv')
  async exportSessionToCsv(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Res() res: Response,
  ) {
    try {
      const csv = await this.exportsService.exportSessionToCsv(sessionId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="session-${sessionId}.csv"`,
      );
      
      return res.status(HttpStatus.OK).send(csv);
    } catch (error) {
      // If there's an error, return a JSON response with error details
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'Failed to export session data',
      });
    }
  }
} 