import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CardTypesModule } from './card-types/card-types.module';
import { CardsModule } from './cards/cards.module';
import { AuctionJobsModule } from './auction-jobs/auction-jobs.module';
import { AuctionsModule } from './auctions/auctions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        CORS_ORIGIN: Joi.string().required(),
        AUCTION_MIN_DURATION_SECONDS: Joi.number().required(),
        AUCTION_MAX_DURATION_SECONDS: Joi.number().required(),
        AUCTION_SCANNER_INTERVAL_SECONDS: Joi.number().required(),
      }),
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CardTypesModule,
    CardsModule,
    AuctionJobsModule,
    AuctionsModule,
  ],
})
export class AppModule {}