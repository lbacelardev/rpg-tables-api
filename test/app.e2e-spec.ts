import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { PasswordService } from '../src/users/password.service.js';
import { SessionsService } from '../src/auth/sessions.service.js';
import { createHash } from 'node:crypto';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    const prisma = app.get(PrismaService);

    const rows = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;

    if (rows[0]?.database !== 'rpg_tables_test') {
      throw new Error('Limpeza permitida apenas em rpg_tables_test.');
    }

    await prisma.user.deleteMany();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      application: 'rpg-tables-api',
    });
  });

  it('aceita dados válidos e remove espaços do nome', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: '  Lucas  ',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        name: 'Lucas',
        email: 'lucas@example.com',
        createdAt: expect.any(String),
      },
    });

    const prisma = app.get(PrismaService);

    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'lucas@example.com' },
    });

    const passwordService = app.get(PasswordService);

    expect(storedUser.id).toBe(response.body.data.id);
    expect(storedUser.passwordHash).not.toBe('senha-de-exemplo');

    await expect(
      passwordService.verify(storedUser.passwordHash, 'senha-de-exemplo'),
    ).resolves.toBe(true);
  });

  it('rejeita e-mail duplicado sem criar outro usuário', async () => {
    const body = {
      name: 'Lucas',
      email: 'lucas@example.com',
      password: 'senha-de-exemplo',
    };

    await request(app.getHttpServer()).post('/users').send(body).expect(201);

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(body)
      .expect(409);

    expect(response.body.message).toBe('Este e-mail já está cadastrado.');

    const prisma = app.get(PrismaService);

    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it('rejeita e-mail inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'abc',
        password: 'senha-de-exemplo',
      })
      .expect(400);

    expect(response.body.message).toContain('O Email deve ser válido.');
  });

  it('rejeita nome muito curto', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: '   ',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'O nome deve ter pelo menos dois caracteres.',
    );
  });

  it('rejeita nome que não é um texto', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 123,
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(400);

    expect(response.body.message).toContain('O nome deve ser um texto.');
  });

  it('rejeita senha muito curta', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: '123',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'A senha deve ter pelo menos 8 caracteres.',
    );
  });

  it('rejeita senha que não seja texto', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
      })
      .expect(400);

    expect(response.body.message).toContain('A senha deve ser um texto.');
  });

  it('rejeita campos inválidos', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
        isAdmin: true,
      })
      .expect(400);

    expect(response.body.message).toContain(
      'property isAdmin should not exist',
    );
  });

  it('usa o banco exclusivo de testes', async () => {
    const prisma = app.get(PrismaService);

    const rows = await prisma.$queryRaw<Array<{ database: string }>>`
    SELECT current_database() AS database
  `;

    expect(rows[0]?.database).toBe('rpg_tables_test');
  });

  it('aceita login após cadastro', async () => {
    const loginBody = {
      email: 'teste@example.com',
      password: 'senha-valida',
    };

    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Exemplo',
        email: 'teste@example.com',
        password: 'senha-valida',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginBody)
      .expect(200);

    expect(response.body).toEqual({
      data: {
        id: registration.body.data.id,
        name: 'Exemplo',
        email: 'teste@example.com',
      },
    });
  });

  it('verifica senha inválida', async () => {
    const loginBody = {
      email: 'teste@example.com',
      password: 'senha-invalida',
    };

    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Exemplo',
        email: 'teste@example.com',
        password: 'senha-valida',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginBody)
      .expect(401);

    expect(response.body.message).toContain('E-mail ou senha inválidos.');
  });

  it('tentar login sem cadastrar', async () => {
    const loginBody = {
      email: 'teste@example.com',
      password: 'senha-invalida',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginBody)
      .expect(401);

    expect(response.body.message).toContain('E-mail ou senha inválidos.');
  });

  it('login com email inválido', async () => {
    const loginBody = {
      email: 'abc',
      password: 'senha-invalida',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginBody)
      .expect(400);

    expect(response.body.message).toContain('Informe um e-mail válido.');
  });

  it('campo de senha ausente', async () => {
    const loginBody = {
      email: 'teste@example.com',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginBody)
      .expect(400);

    expect(response.body.message).toContain('Informe a senha.');
  });

  it('encontra o usuário de uma sessão válida', async () => {
    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201);

    const sessionsService = app.get(SessionsService);
    const session = await sessionsService.create(registration.body.data.id);
    const user = await sessionsService.findUser(session.token);

    expect(user).toEqual({
      id: registration.body.data.id,
      name: 'Lucas',
      email: 'lucas@example.com',
    });
  });

  it('rejeita token desconhecido', async () => {
    const sessionsService = app.get(SessionsService);

    await expect(
      sessionsService.findUser('token-inexistente'),
    ).resolves.toBeNull();
  });

  it('token salvo difere do original', async () => {
    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201);

    const sessionsService = app.get(SessionsService);
    const session = await sessionsService.create(registration.body.data.id);
    const prisma = app.get(PrismaService);

    const storedSession = await prisma.session.findFirstOrThrow({
      where: { userId: registration.body.data.id },
    });

    const expectedHash = createHash('sha256')
      .update(session.token)
      .digest('hex');

    expect(storedSession.tokenHash).toBe(expectedHash);
    expect(storedSession.tokenHash).not.toBe(session.token);
  });

  it('sessão expirada', async () => {
    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201);

    const sessionsService = app.get(SessionsService);
    const session = await sessionsService.create(registration.body.data.id);

    const prisma = app.get(PrismaService);
    await prisma.session.updateMany({
      where: { userId: registration.body.data.id },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await expect(sessionsService.findUser(session.token)).resolves.toBeNull();
  });

  it('revogação de token não deve falhar', async () => {
    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Lucas',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201);

    const sessionsService = app.get(SessionsService);
    const session = await sessionsService.create(registration.body.data.id);

    await sessionsService.revoke(session.token);
    await expect(sessionsService.findUser(session.token)).resolves.toBeNull();
    await expect(
      sessionsService.revoke(session.token),
    ).resolves.toBeUndefined();

    const prisma = app.get(PrismaService);

    await expect(
      prisma.session.count({
        where: { userId: registration.body.data.id },
      }),
    ).resolves.toBe(0);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
