import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PageType } from '../entities/scout.entity';

export class PageTypeDto implements PageType {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  countSelector: string;

  @IsString()
  @IsOptional()
  fallbackProductSelectors?: string;
}

export class CreateScoutDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  startUrl: string;

  @IsString()
  @IsNotEmpty()
  schedule: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageTypeDto)
  pageTypes: PageTypeDto[];

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;

  @IsNumber()
  @IsOptional()
  maxPagesToVisit?: number;

  @IsNumber()
  @IsOptional()
  timeout?: number;
} 