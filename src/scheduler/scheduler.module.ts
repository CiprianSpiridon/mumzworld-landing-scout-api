import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ScoutsModule } from '../scouts/scouts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ScoutsModule,
    SessionsModule,
    ConfigModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {} 