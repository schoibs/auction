import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // in NestJS, an application context is Nest without an HTTP server: useful for running bg tasks
  await NestFactory.createApplicationContext(AppModule);
  console.log('Auction worker started');
}

bootstrap();