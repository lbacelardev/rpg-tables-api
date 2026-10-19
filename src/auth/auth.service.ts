import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from '../users/password.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SessionsService } from './sessions.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionsService: SessionsService,
  ) {}

  async login(body: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (user) {
      const passwordMatches = await this.passwordService.verify(
        user.passwordHash,
        body.password,
      );

      if (passwordMatches) {
        const session = await this.sessionsService.create(user.id);

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          session,
        };
      }
    }

    throw new UnauthorizedException('E-mail ou senha inválidos.');
  }
}
