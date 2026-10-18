import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

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
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      application: 'rpg-tables-api',
    });
  });

  it('aceita dados válidos e remove espaços do nome', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: '  Lucas  ',
        email: 'lucas@example.com',
        password: 'senha-de-exemplo',
      })
      .expect(201)
      .expect({
        message: 'Dados recebidos. O usuário ainda não foi salvo.',
        data: {
          name: 'Lucas',
          email: 'lucas@example.com',
        },
      });
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

  afterEach(async () => {
    await app.close();
  });
});
