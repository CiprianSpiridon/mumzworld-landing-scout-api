import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ScoutService } from '../scouts/services/scout.service';
import { CreateScoutDto } from '../scouts/dto/create-scout.dto';
import { UpdateScoutDto } from '../scouts/dto/update-scout.dto';

@Controller('scouts')
@UseInterceptors(ClassSerializerInterceptor)
export class ScoutsController {
  constructor(private readonly scoutService: ScoutService) {}

  @Post()
  create(@Body() createScoutDto: CreateScoutDto) {
    return this.scoutService.create(createScoutDto);
  }

  @Get()
  findAll() {
    return this.scoutService.findAll();
  }

  @Get('active')
  findActive() {
    return this.scoutService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scoutService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScoutDto: UpdateScoutDto) {
    return this.scoutService.update(id, updateScoutDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scoutService.remove(id);
  }
} 