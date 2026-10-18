import { config } from 'dotenv';

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
  throw new Error('Os testes e2e exigem o banco rpg_tables_test.');
}

process.env.DATABASE_URL = databaseUrl;