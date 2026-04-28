import { GraphQLError } from 'graphql';
import { queryAll, queryOne } from '../db/query';
import { getDb } from '../db/connection';
import { ExaminerRow, ExaminerCertificateRow, StudyRow, SiteRow } from '../types';

export function getExaminersPaged(page: number, pageSize: number): { rows: ExaminerRow[]; total: number } {
  const offset = (page - 1) * pageSize;
  const rows = queryAll<ExaminerRow>('SELECT * FROM examiners ORDER BY id ASC LIMIT ? OFFSET ?', [pageSize, offset]);
  const total = (queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM examiners') ?? { cnt: 0 }).cnt;
  return { rows, total };
}

export function getExaminerById(id: number): ExaminerRow | null {
  return queryOne<ExaminerRow>('SELECT * FROM examiners WHERE id = ?', [id]) ?? null;
}

export function getStudiesByExaminer(examinerId: number): StudyRow[] {
  return queryAll<StudyRow>(
    `SELECT DISTINCT s.* FROM studies s
     JOIN study_sites ss ON ss.study_id = s.id
     JOIN site_examiners se ON se.site_id = ss.site_id
     WHERE se.examiner_id = ? ORDER BY s.id ASC`,
    [examinerId]
  );
}

export function getSitesByExaminer(examinerId: number): SiteRow[] {
  return queryAll<SiteRow>(
    `SELECT si.* FROM sites si JOIN site_examiners se ON se.site_id = si.id WHERE se.examiner_id = ? ORDER BY si.id ASC`,
    [examinerId]
  );
}

export interface CreateExaminerInput {
  examinerCode: string;
  name: string;
  specialty: string;
  email: string;
  role: string;
  status?: string;
}

export function createExaminer(input: CreateExaminerInput): ExaminerRow {
  if (queryOne('SELECT id FROM examiners WHERE examinerCode = ?', [input.examinerCode])) {
    throw new GraphQLError(`Examiner code ${input.examinerCode} already exists`, { extensions: { code: 'BAD_USER_INPUT' } });
  }
  const status = input.status ?? 'Active';
  const result = getDb().prepare(
    `INSERT INTO examiners (examinerCode, name, specialty, email, role, status) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(input.examinerCode, input.name, input.specialty, input.email, input.role, status);
  return getExaminerById(result.lastInsertRowid as number)!;
}

export interface UpdateExaminerInput {
  name?: string;
  specialty?: string;
  email?: string;
  role?: string;
  status?: string;
}

// Permitted column names for dynamic UPDATE
const EXAMINER_UPDATE_COLUMNS = new Set(['name', 'specialty', 'email', 'role', 'status']);

export function updateExaminer(id: number, input: UpdateExaminerInput): ExaminerRow {
  const existing = getExaminerById(id);
  if (!existing) throw new GraphQLError('Examiner not found', { extensions: { code: 'BAD_USER_INPUT' } });

  const fields = Object.entries(input).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return existing;

  // Safety: only allow known columns in the SET clause
  const invalidKey = fields.find(([k]) => !EXAMINER_UPDATE_COLUMNS.has(k));
  if (invalidKey) throw new GraphQLError('Failed to update examiner', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([, v]) => v);
  getDb().prepare(`UPDATE examiners SET ${setClauses} WHERE id = ?`).run(...values, id);
  return getExaminerById(id)!;
}

// ── Certificate functions ─────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCertificatesByExaminer(examinerId: number): ExaminerCertificateRow[] {
  return queryAll<ExaminerCertificateRow>(
    'SELECT * FROM examiner_certificates WHERE examiner_id = ? ORDER BY expiresOn DESC',
    [examinerId]
  );
}

export function getCertificateById(id: number): ExaminerCertificateRow | null {
  return queryOne<ExaminerCertificateRow>('SELECT * FROM examiner_certificates WHERE id = ?', [id]) ?? null;
}

export function hasValidCertificate(examinerId: number): boolean {
  const today = todayUTC();
  const row = queryOne<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM examiner_certificates WHERE examiner_id = ? AND expiresOn >= ?',
    [examinerId, today]
  );
  return (row?.cnt ?? 0) > 0;
}

export interface CreateCertificateInput {
  certificateId: string;
  expiresOn: string;
}

export function addExaminerCertificate(examinerId: number, input: CreateCertificateInput): ExaminerCertificateRow {
  if (!getExaminerById(examinerId)) {
    throw new GraphQLError('Examiner not found', { extensions: { code: 'BAD_USER_INPUT' } });
  }
  const existing = queryOne(
    'SELECT id FROM examiner_certificates WHERE examiner_id = ? AND certificateId = ?',
    [examinerId, input.certificateId]
  );
  if (existing) {
    throw new GraphQLError('Certificate ID already exists for this examiner', {
      extensions: { code: 'BAD_USER_INPUT', fieldErrors: { certificateId: 'This certificate ID already exists for this examiner.' } },
    });
  }
  const result = getDb().prepare(
    'INSERT INTO examiner_certificates (examiner_id, certificateId, expiresOn) VALUES (?, ?, ?)'
  ).run(examinerId, input.certificateId, input.expiresOn);
  return getCertificateById(result.lastInsertRowid as number)!;
}

export interface UpdateCertificateInput {
  certificateId?: string;
  expiresOn?: string;
}

export function updateExaminerCertificate(id: number, input: UpdateCertificateInput): ExaminerCertificateRow {
  const existing = getCertificateById(id);
  if (!existing) throw new GraphQLError('Certificate not found', { extensions: { code: 'BAD_USER_INPUT' } });

  const fields = Object.entries(input).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return existing;

  // Check uniqueness if certificateId is being changed
  if (input.certificateId && input.certificateId !== existing.certificateId) {
    const dup = queryOne(
      'SELECT id FROM examiner_certificates WHERE examiner_id = ? AND certificateId = ? AND id != ?',
      [existing.examiner_id, input.certificateId, id]
    );
    if (dup) {
      throw new GraphQLError('Certificate ID already exists for this examiner', {
        extensions: { code: 'BAD_USER_INPUT', fieldErrors: { certificateId: 'This certificate ID already exists for this examiner.' } },
      });
    }
  }

  const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
  const values = fields.map(([, v]) => v);
  getDb().prepare(`UPDATE examiner_certificates SET ${setClauses} WHERE id = ?`).run(...values, id);
  return getCertificateById(id)!;
}
