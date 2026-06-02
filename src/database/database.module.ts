import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.getOrThrow<string>('DATABASE_HOST'),
            port: configService.getOrThrow<number>('DATABASE_PORT'),
            username: configService.getOrThrow<string>('DATABASE_USER'),
            password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
            database: configService.getOrThrow<string>('DATABASE_NAME'),
            autoLoadEntities: true,
            synchronize: false,
            migrationsRun: false,
          }),
        }),
      ],
})
export class DatabaseModule {}