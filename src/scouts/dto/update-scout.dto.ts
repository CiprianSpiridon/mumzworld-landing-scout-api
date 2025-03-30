import { PartialType } from '@nestjs/mapped-types';
import { CreateScoutDto } from './create-scout.dto';
import { IsDate, IsOptional } from 'class-validator';

export class UpdateScoutDto extends PartialType(CreateScoutDto) {
  @IsDate()
  @IsOptional()
  lastRunAt?: Date;

  @IsDate()
  @IsOptional()
  nextRunAt?: Date;
} 