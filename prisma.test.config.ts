import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const result = config({
  path: '.env.test',
  override: true,
});

if (result.error) {
  throw result.error;
}

const databaseUrl = result.parsed?.DATABASE_URL;

if (
  !databaseUrl ||
  new URL(databaseUrl).pathname !== '/rpg_tables_test'
) {
  throw new Error('Esta configuração exige o banco rpg_tables_test.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});