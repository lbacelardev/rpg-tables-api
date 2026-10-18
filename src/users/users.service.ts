import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async count() {
    const total = await this.prisma.user.count();

    return { total };
  }

  async create(body: CreateUserDto) {
    const passwordHash = await this.passwordService.hash(body.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return { data: user };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }

      throw error;
    }
  }
}
