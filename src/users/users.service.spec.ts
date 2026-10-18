import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: vi.fn().mockResolvedValue(0),
            },
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: vi.fn().mockResolvedValue('hash-simulado'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retorna o total de usuários', async () => {
    await expect(service.count()).resolves.toEqual({ total: 0 });
  });
});
