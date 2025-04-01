import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('nodeEnv') || 'development';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get<number>('port') || 3000;
  }

  get appName(): string {
    return this.configService.get<string>('appName') || 'landingscout';
  }

  get databaseConfig(): Record<string, any> {
    return this.configService.get('database') || {};
  }

  get schedulerConfig(): Record<string, any> {
    return this.configService.get('scheduler') || {};
  }

  get maxConcurrentScouts(): number {
    return this.configService.get<number>('scheduler.maxConcurrentScouts') || 10;
  }

  get playwrightConfig(): Record<string, any> {
    return this.configService.get('playwright') || {};
  }

  get userAgent(): string {
    return (
      this.configService.get<string>('playwright.userAgent') ||
      'LandingScout/1.0 (+https://github.com/CiprianSpiridon/mumzworld-landing-scout-api)'
    );
  }

  get selectorsConfig(): Record<string, any> {
    return this.configService.get('selectors') || {};
  }

  get defaultProductSelectors(): string {
    return (
      this.configService.get<string>('selectors.defaultProductSelectors') ||
      '.product-item, .product-card, [data-product-id], .collection-item, .product'
    );
  }

  get captureConfig(): Record<string, any> {
    return this.configService.get('capture') || {};
  }

  get areScreenshotsEnabled(): boolean {
    return !!this.configService.get<boolean>('capture.screenshotsEnabled');
  }

  get screenshotsDir(): string {
    return (
      this.configService.get<string>('capture.screenshotsDir') ||
      './screenshots'
    );
  }

  get isHtmlSnapshotEnabled(): boolean {
    return !!this.configService.get<boolean>('capture.htmlSnapshotEnabled');
  }

  get loggingConfig(): Record<string, any> {
    return this.configService.get('logging') || {};
  }
} 