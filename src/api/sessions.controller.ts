import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { SessionService } from '../sessions/services/session.service';

@Controller('sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  findAll() {
    return this.sessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Get('scout/:scoutId')
  findByScout(@Param('scoutId') scoutId: string) {
    return this.sessionService.findByScout(scoutId);
  }

  @Post('start/:scoutId')
  startSession(@Param('scoutId') scoutId: string) {
    return this.sessionService.startSession(scoutId);
  }

  @Post('cancel/:id')
  async cancelSession(@Param('id') id: string) {
    try {
      return await this.sessionService.cancelSession(id);
    } catch (error) {
      throw new NotFoundException(`Session with ID "${id}" not found or cannot be cancelled`);
    }
  }
} 