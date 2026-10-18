import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
