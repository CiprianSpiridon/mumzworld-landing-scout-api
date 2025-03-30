import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoutingSession } from './entities/scouting-session.entity';
import { PageResult } from './entities/page-result.entity';
import { SessionService } from './services/session.service';
import { ScoutsModule } from '../scouts/scouts.module';
import { BrowserModule } from '../browser/browser.module';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScoutingSession, PageResult]),
    ScoutsModule,
    BrowserModule,
    ConfigModule,
  ],
  providers: [SessionService],
  exports: [TypeOrmModule, SessionService],
})
export class SessionsModule {} 