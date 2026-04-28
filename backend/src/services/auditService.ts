import { queryAll, queryOne } from '../db/query';
import { AuditLogRow } from '../types';

export interface AuditLogsPage {
  rows: AuditLogRow[];
  total: number;
}

export function getAuditLogs(
  entityType?: string,
  entityTypes?: string[],
  entityId?: number,
  page = 1,
  pageSize = 25
): AuditLogsPage {
  const offset = (page - 1) * pageSize;

  // Resolve the effective type filter: entityTypes array takes priority over single entityType
  const types = entityTypes?.length ? entityTypes : entityType ? [entityType] : null;

  if (types && entityId !== undefined) {
    const placeholders = types.map(() => '?').join(',');
    const rows = queryAll<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE entityType IN (${placeholders}) AND entityId = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...types, entityId, pageSize, offset]
    );
    const total = (queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM audit_logs WHERE entityType IN (${placeholders}) AND entityId = ?`,
      [...types, entityId]
    ) ?? { cnt: 0 }).cnt;
    return { rows, total };
  }

  if (types) {
    const placeholders = types.map(() => '?').join(',');
    const rows = queryAll<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE entityType IN (${placeholders}) ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...types, pageSize, offset]
    );
    const total = (queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM audit_logs WHERE entityType IN (${placeholders})`,
      types
    ) ?? { cnt: 0 }).cnt;
    return { rows, total };
  }

  const rows = queryAll<AuditLogRow>(
    `SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );
  const total = (queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM audit_logs`) ?? { cnt: 0 }).cnt;
  return { rows, total };
}
