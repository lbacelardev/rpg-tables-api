import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async count() {
    const total = await this.prisma.user.count();

    return { total };
  }

  create(body: CreateUserDto) {
    return {
      message: 'Dados recebidos. O usuário ainda não foi salvo.',
      data: {
        name: body.name,
        email: body.email,
      },
    };
  }
}
