import { queryAll } from '../db/query';
import { StudyRow, SiteRow, ExaminerRow } from '../types';

export interface SearchFilters {
  entityType?: 'Study' | 'Site' | 'Examiner';
  studyStatus?: string;
  studyPhase?: string;
  siteCity?: string;
  siteCountry?: string;
  examinerRole?: string;
}

export function globalSearch(keyword: string, filters: SearchFilters = {}) {
  const kw = `%${keyword.toLowerCase()}%`;
  const { entityType } = filters;

  // Studies — only query if entityType is unset or 'Study'
  let studies: StudyRow[] = [];
  if (!entityType || entityType === 'Study') {
    const studyParams: unknown[] = [kw, kw, kw];
    let studyWhere = `(LOWER(title) LIKE ? OR LOWER(sponsor) LIKE ? OR LOWER(protocolId) LIKE ?)`;
    if (filters.studyStatus) { studyWhere += ` AND status = ?`; studyParams.push(filters.studyStatus); }
    if (filters.studyPhase)  { studyWhere += ` AND phase = ?`;  studyParams.push(filters.studyPhase); }
    studies = queryAll<StudyRow>(`SELECT * FROM studies WHERE ${studyWhere} ORDER BY id ASC`, studyParams);
  }

  // Sites — only query if entityType is unset or 'Site'
  let sites: SiteRow[] = [];
  if (!entityType || entityType === 'Site') {
    const siteParams: unknown[] = [kw, kw, kw];
    let siteWhere = `(LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(country) LIKE ?)`;
    if (filters.siteCity)    { siteWhere += ` AND LOWER(city) = LOWER(?)`; siteParams.push(filters.siteCity); }
    if (filters.siteCountry) { siteWhere += ` AND LOWER(country) = LOWER(?)`; siteParams.push(filters.siteCountry); }
    sites = queryAll<SiteRow>(`SELECT * FROM sites WHERE ${siteWhere} ORDER BY id ASC`, siteParams);
  }

  // Examiners — only query if entityType is unset or 'Examiner'
  let examiners: ExaminerRow[] = [];
  if (!entityType || entityType === 'Examiner') {
    const examParams: unknown[] = [kw, kw];
    let examWhere = `(LOWER(name) LIKE ? OR LOWER(specialty) LIKE ?)`;
    if (filters.examinerRole) { examWhere += ` AND role = ?`; examParams.push(filters.examinerRole); }
    examiners = queryAll<ExaminerRow>(`SELECT * FROM examiners WHERE ${examWhere} ORDER BY id ASC`, examParams);
  }

  return { studies, sites, examiners };
}
