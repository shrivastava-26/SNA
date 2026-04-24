import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../../types';
import { getDb } from '../../db/connection';

export function requireAuth(context: GraphQLContext): void {
  if (!context.user) {
    throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
  }
}

export function requireAdmin(context: GraphQLContext): void {
  requireAuth(context);
  if (context.user!.role !== 'ADMIN') {
    throw new GraphQLError('Forbidden: admin access required', { extensions: { code: 'FORBIDDEN' } });
  }
}

export function logAudit(
  context: GraphQLContext,
  action: 'CREATE' | 'UPDATE',
  entityType: string,
  entityId: number,
  beforeJson: string | null,
  afterJson: string | null
): void {
  const user = context.user!;
  const db = getDb();
  // Fetch actor email for the log record
  const actor = db.prepare('SELECT email FROM users WHERE id = ?').get(user.userId) as { email: string } | undefined;
  const actorEmail = actor?.email ?? 'unknown';
  db.prepare(
    `INSERT INTO audit_logs (actorUserId, actorEmail, action, entityType, entityId, beforeJson, afterJson)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(user.userId, actorEmail, action, entityType, entityId, beforeJson, afterJson);
}
