import 'dotenv/config';
import { initConnection } from './db/connection';
import { initDb } from './db/migrate';
import { createApp } from './app';
import { envSchema } from './validation/envSchema';

function validateEnv(): void {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
}

async function start() {
  validateEnv();

  initConnection(process.env.DB_PATH ?? './data/app.db');
  initDb();

  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/graphql`);
  });
}

start().catch(console.error);
