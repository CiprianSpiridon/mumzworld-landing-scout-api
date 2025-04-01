import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ApiModule } from './api/api.module';
import { ScoutsModule } from './scouts/scouts.module';
import { SessionsModule } from './sessions/sessions.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { BrowserModule } from './browser/browser.module';
import { DatabaseModule } from './database/database.module';
import { ExportsModule } from './exports/exports.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'screenshots'),
      serveRoot: '/screenshots',
      serveStaticOptions: {
        index: false,
      },
    }),
    DatabaseModule,
    BrowserModule,
    ScoutsModule,
    SessionsModule,
    SchedulerModule,
    ApiModule,
    ExportsModule,
  ],
})
export class AppModule {}
