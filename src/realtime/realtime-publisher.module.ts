import { Module } from '@nestjs/common';
import { RealtimeEventsPublisher } from './realtime-events.publisher';

@Module({
  providers: [RealtimeEventsPublisher],
  exports: [RealtimeEventsPublisher],
})
export class RealtimePublisherModule {}