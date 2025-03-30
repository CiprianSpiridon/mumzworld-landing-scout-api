import { Module } from '@nestjs/common';
import { ScoutsController } from './scouts.controller';
import { SessionsController } from './sessions.controller';
import { ScoutsModule } from '../scouts/scouts.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [ScoutsModule, SessionsModule],
  controllers: [ScoutsController, SessionsController],
})
export class ApiModule {} 