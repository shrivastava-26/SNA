import { queryAll, queryOne } from '../db/query';
import { AuditLogRow } from '../types';

export interface AuditLogsPage {
  rows: AuditLogRow[];
  total: number;
}

export function getAuditLogs(
  entityType?: string,
  entityId?: number,
  page = 1,
  pageSize = 25
): AuditLogsPage {
  const offset = (page - 1) * pageSize;

  if (entityType && entityId !== undefined) {
    const rows = queryAll<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE entityType = ? AND entityId = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [entityType, entityId, pageSize, offset]
    );
    const total = (queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM audit_logs WHERE entityType = ? AND entityId = ?`,
      [entityType, entityId]
    ) ?? { cnt: 0 }).cnt;
    return { rows, total };
  }

  if (entityType) {
    const rows = queryAll<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE entityType = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [entityType, pageSize, offset]
    );
    const total = (queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM audit_logs WHERE entityType = ?`,
      [entityType]
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
