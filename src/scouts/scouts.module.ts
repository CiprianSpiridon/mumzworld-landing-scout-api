import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scout } from './entities/scout.entity';
import { ScoutHistory } from './entities/scout-history.entity';
import { CategoryProcessor } from './processors/category.processor';
import { CollectionProcessor } from './processors/collection.processor';
import { ProcessorService } from './processors/processor.service';
import { ScoutService } from './services/scout.service';
import { ProductDetailsProcessor } from './processors/product-details.processor';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scout, ScoutHistory]),
    ConfigModule,
  ],
  providers: [
    CategoryProcessor,
    CollectionProcessor,
    ProcessorService,
    ScoutService,
    ProductDetailsProcessor,
  ],
  exports: [
    TypeOrmModule,
    ProcessorService,
    ScoutService,
  ],
})
export class ScoutsModule {} 