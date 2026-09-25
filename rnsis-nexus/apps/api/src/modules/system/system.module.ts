import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesController } from './files.controller';
import { SystemController } from './system.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [NotificationsModule],
  controllers: [SystemController, FilesController, UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class SystemModule {}
