import { env, reset } from 'cloudflare:test';
import schemaSql from '../../schema.sql?raw';

// D1 prepare() accepts one statement at a time, so split schema.sql into runnable statements.
function getSchemaStatements(sql) {
  return sql
    .replace(/--[^\n]*(\n|$)/g, '\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function resetTestDatabase() {
  await reset();

  for (const statement of getSchemaStatements(schemaSql)) {
    await env.watchtower_db.prepare(statement).run();
  }
}
