import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { ScoutsModule } from './scouts/scouts.module';
import { SessionsModule } from './sessions/sessions.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { BrowserModule } from './browser/browser.module';
import { DatabaseModule } from './database/database.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    BrowserModule,
    ScoutsModule,
    SessionsModule,
    SchedulerModule,
    ApiModule,
  ],
})
export class AppModule {}
