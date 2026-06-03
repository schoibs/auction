import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
async function bootstrap() {
  // in NestJS, an application context is Nest runtime without an HTTP server: useful for running bg tasks
  await NestFactory.createApplicationContext(WorkerModule);
  console.log('Auction worker started');
}

bootstrap();
