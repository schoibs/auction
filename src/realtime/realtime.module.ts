import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimePublisherModule } from './realtime-publisher.module';
import { RealtimeRedisSubscriber } from './realtime-redis.subscriber';
import { RealtimeSocketService } from './realtime-socket.service';

@Module({
  imports: [AuthModule, UsersModule, RealtimePublisherModule],
  providers: [RealtimeGateway, RealtimeSocketService, RealtimeRedisSubscriber],
  exports: [RealtimePublisherModule],
})
export class RealtimeModule {}
