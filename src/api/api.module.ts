import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoutsController } from './scouts.controller';
import { SessionsController } from './sessions.controller';
import { PageResultsController } from './page-results.controller';
import { Scout } from '../scouts/entities/scout.entity';
import { PageResult } from '../sessions/entities/page-result.entity';
import { ScoutsModule } from '../scouts/scouts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scout, PageResult]),
    ConfigModule,
    ScoutsModule,
    SessionsModule,
  ],
  controllers: [ScoutsController, SessionsController, PageResultsController],
})
export class ApiModule {}
