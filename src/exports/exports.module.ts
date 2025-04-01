import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { PageResult } from '../sessions/entities/page-result.entity';
import { ScoutingSession } from '../sessions/entities/scouting-session.entity';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageResult, ScoutingSession]),
    ConfigModule,
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {} 