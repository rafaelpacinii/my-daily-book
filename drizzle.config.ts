import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/database/schema',
  out: './src/database/migrations',
  breakpoints: true,
});
