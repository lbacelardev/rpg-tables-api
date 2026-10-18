import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PasswordService } from './password.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PasswordService],
  imports: [PrismaModule],
})
export class UsersModule {}
