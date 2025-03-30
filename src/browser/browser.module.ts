import { Module } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [BrowserService],
  exports: [BrowserService],
})
export class BrowserModule {} 