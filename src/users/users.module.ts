import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  // TypeORM automatically gives this module the Repository<User> here
  imports: [TypeOrmModule.forFeature([User])], 
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
