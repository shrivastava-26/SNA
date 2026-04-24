import { getDb } from './connection';
import { queryOne } from './query';
import { hashPassword } from '../utils/password';

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role     TEXT NOT NULL DEFAULT 'VIEWER' CHECK(role IN ('ADMIN','VIEWER'))
    );

    CREATE TABLE IF NOT EXISTS studies (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      protocolId  TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      sponsor     TEXT NOT NULL DEFAULT '',
      phase       TEXT NOT NULL DEFAULT '',
      startDate   TEXT NOT NULL DEFAULT '',
      endDate     TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','Active','Completed')),
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sites (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      siteCode  TEXT NOT NULL UNIQUE,
      name      TEXT NOT NULL,
      city      TEXT NOT NULL DEFAULT '',
      country   TEXT NOT NULL DEFAULT '',
      status    TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','Active','Closed'))
    );

    CREATE TABLE IF NOT EXISTS examiners (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      examinerCode TEXT NOT NULL UNIQUE,
      name         TEXT NOT NULL,
      specialty    TEXT NOT NULL DEFAULT '',
      email        TEXT NOT NULL DEFAULT '',
      role         TEXT NOT NULL DEFAULT 'Sub-Investigator' CHECK(role IN ('Principal Investigator','Sub-Investigator')),
      status       TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS study_sites (
      study_id INTEGER NOT NULL REFERENCES studies(id),
      site_id  INTEGER NOT NULL REFERENCES sites(id),
      PRIMARY KEY (study_id, site_id)
    );

    CREATE TABLE IF NOT EXISTS site_examiners (
      site_id     INTEGER NOT NULL REFERENCES sites(id),
      examiner_id INTEGER NOT NULL REFERENCES examiners(id),
      PRIMARY KEY (site_id, examiner_id)
    );

    CREATE TABLE IF NOT EXISTS study_site_examiners (
      study_id    INTEGER NOT NULL REFERENCES studies(id) ON DELETE RESTRICT,
      site_id     INTEGER NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
      examiner_id INTEGER NOT NULL REFERENCES examiners(id) ON DELETE RESTRICT,
      PRIMARY KEY (study_id, site_id, examiner_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      actorUserId INTEGER NOT NULL,
      actorEmail  TEXT NOT NULL,
      action      TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE')),
      entityType  TEXT NOT NULL,
      entityId    INTEGER NOT NULL,
      beforeJson  TEXT,
      afterJson   TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for search performance
    CREATE INDEX IF NOT EXISTS idx_studies_title    ON studies(title);
    CREATE INDEX IF NOT EXISTS idx_studies_sponsor  ON studies(sponsor);
    CREATE INDEX IF NOT EXISTS idx_studies_status   ON studies(status);
    CREATE INDEX IF NOT EXISTS idx_studies_phase    ON studies(phase);
    CREATE INDEX IF NOT EXISTS idx_sites_name       ON sites(name);
    CREATE INDEX IF NOT EXISTS idx_sites_city       ON sites(city);
    CREATE INDEX IF NOT EXISTS idx_sites_country    ON sites(country);
    CREATE INDEX IF NOT EXISTS idx_sites_status     ON sites(status);
    CREATE INDEX IF NOT EXISTS idx_examiners_name   ON examiners(name);
    CREATE INDEX IF NOT EXISTS idx_examiners_role   ON examiners(role);
    CREATE INDEX IF NOT EXISTS idx_audit_actor      ON audit_logs(actorUserId);
    CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_logs(entityType, entityId);
    CREATE INDEX IF NOT EXISTS idx_sse_study_site   ON study_site_examiners(study_id, site_id);
    CREATE INDEX IF NOT EXISTS idx_sse_examiner     ON study_site_examiners(examiner_id);
  `);

  // Migrate existing tables — add columns that may be missing from older DB files.
  // SQLite does not support IF NOT EXISTS on ALTER TABLE, so we catch the error.
  try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'VIEWER'`); } catch { /* already exists */ }
  try { db.exec(`ALTER TABLE examiners ADD COLUMN role TEXT NOT NULL DEFAULT 'Sub-Investigator'`); } catch { /* already exists */ }

  seedUsers(db);
  seedStudies(db);
  seedSites(db);
  seedExaminers(db);
  seedJunctions(db);
  seedStudySiteExaminers(db);
}

function seedUsers(db: ReturnType<typeof getDb>) {
  if (!queryOne('SELECT id FROM users WHERE email = ?', ['viewer@test.com'])) {
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
      'viewer@test.com', hashPassword('password123'), 'VIEWER'
    );
  }
  if (!queryOne('SELECT id FROM users WHERE email = ?', ['admin@test.com'])) {
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
      'admin@test.com', hashPassword('password123'), 'ADMIN'
    );
  }
}

function seedStudies(db: ReturnType<typeof getDb>) {
  const studies = [
    ['STUDY-001', 'Cardiovascular Outcomes Trial', 'Pharma Corp', 'Phase III', '2023-01-10', '2025-01-10', 'Active', 'Evaluating cardiovascular outcomes in high-risk patients'],
    ['STUDY-002', 'Oncology Immunotherapy Study', 'BioGen Labs', 'Phase II', '2023-03-15', '2024-09-15', 'Completed', 'Immunotherapy response in solid tumors'],
    ['STUDY-003', 'Diabetes Management Trial', 'MedResearch Inc', 'Phase III', '2024-02-01', '2026-02-01', 'Active', 'Long-term glycemic control evaluation'],
    ['STUDY-004', 'Alzheimer Prevention Study', 'NeuroPharm', 'Phase II', '2024-06-01', '2026-06-01', 'Active', 'Early intervention in Alzheimer risk patients'],
    ['STUDY-005', 'Hypertension Control Study', 'CardioMed', 'Phase III', '2022-11-01', '2024-11-01', 'Completed', 'Blood pressure management in elderly'],
    ['STUDY-006', 'Asthma Biologic Trial', 'RespiCare', 'Phase II', '2025-01-15', '2027-01-15', 'Planned', 'Biologic therapy for severe asthma'],
    ['STUDY-007', 'Rheumatoid Arthritis Study', 'ImmunoGen', 'Phase III', '2023-07-01', '2025-07-01', 'Active', 'JAK inhibitor efficacy in RA patients'],
    ['STUDY-008', 'Chronic Kidney Disease Trial', 'NephroLabs', 'Phase II', '2024-04-01', '2026-04-01', 'Active', 'Renal protection in CKD stage 3-4'],
    ['STUDY-009', 'Depression Treatment Study', 'MindCare Pharma', 'Phase III', '2023-09-01', '2025-09-01', 'Active', 'Novel antidepressant efficacy trial'],
    ['STUDY-010', 'Lung Cancer Screening Trial', 'OncoCare', 'Phase I', '2025-03-01', '2026-03-01', 'Planned', 'Early detection biomarker validation'],
    ['STUDY-011', 'Obesity Intervention Study', 'MetaboGen', 'Phase II', '2024-01-01', '2025-12-31', 'Active', 'GLP-1 agonist in morbid obesity'],
    ['STUDY-012', 'Stroke Prevention Trial', 'NeuroCare', 'Phase III', '2022-06-01', '2024-06-01', 'Completed', 'Anticoagulation in atrial fibrillation'],
    ['STUDY-013', 'HIV Treatment Study', 'ViralMed', 'Phase II', '2023-11-01', '2025-11-01', 'Active', 'Novel antiretroviral combination therapy'],
    ['STUDY-014', 'Osteoporosis Prevention Trial', 'BoneCare Inc', 'Phase III', '2024-08-01', '2026-08-01', 'Planned', 'Bone density preservation in postmenopausal women'],
    ['STUDY-015', 'Migraine Relief Study', 'PainFree Labs', 'Phase II', '2023-05-01', '2024-11-01', 'Completed', 'CGRP antagonist for chronic migraine'],
    ['STUDY-016', 'Psoriasis Biologic Trial', 'DermaCare', 'Phase III', '2024-03-01', '2026-03-01', 'Active', 'IL-17 inhibitor in moderate-severe psoriasis'],
    ['STUDY-017', 'Hepatitis C Cure Study', 'LiverMed', 'Phase III', '2022-09-01', '2024-03-01', 'Completed', 'Pan-genotypic DAA regimen evaluation'],
    ['STUDY-018', 'Parkinson Disease Trial', 'NeuroGen', 'Phase II', '2025-02-01', '2027-02-01', 'Planned', 'Neuroprotective therapy in early Parkinson'],
    ['STUDY-019', 'Colorectal Cancer Study', 'GastroPharm', 'Phase II', '2024-07-01', '2026-07-01', 'Active', 'Targeted therapy in KRAS-mutant CRC'],
    ['STUDY-020', 'Sepsis Management Trial', 'CriticalCare Inc', 'Phase III', '2023-12-01', '2025-12-01', 'Active', 'Immunomodulation in severe sepsis'],
  ];
  for (const s of studies) {
    if (!queryOne('SELECT id FROM studies WHERE protocolId = ?', [s[0]])) {
      db.prepare(`INSERT INTO studies (protocolId,title,sponsor,phase,startDate,endDate,status,description) VALUES (?,?,?,?,?,?,?,?)`).run(...s);
    }
  }
}

function seedSites(db: ReturnType<typeof getDb>) {
  // Status uses PRD enum: Planned | Active | Closed  (was Inactive → now Closed)
  const sites = [
    ['SITE-001', 'City General Hospital', 'New York', 'USA', 'Active'],
    ['SITE-002', 'Metro Medical Center', 'Los Angeles', 'USA', 'Active'],
    ['SITE-003', 'Riverside Clinical Institute', 'Chicago', 'USA', 'Active'],
    ['SITE-004', 'Lakeside Research Hospital', 'Houston', 'USA', 'Active'],
    ['SITE-005', 'Sunrise Health Clinic', 'Phoenix', 'USA', 'Active'],
    ['SITE-006', 'Northgate Medical Center', 'Toronto', 'Canada', 'Active'],
    ['SITE-007', 'Maple Leaf Hospital', 'Vancouver', 'Canada', 'Active'],
    ['SITE-008', 'Royal London Clinical Site', 'London', 'UK', 'Active'],
    ['SITE-009', 'Edinburgh Research Centre', 'Edinburgh', 'UK', 'Closed'],
    ['SITE-010', 'Berlin University Hospital', 'Berlin', 'Germany', 'Active'],
    ['SITE-011', 'Munich Clinical Research', 'Munich', 'Germany', 'Active'],
    ['SITE-012', 'Paris Medical Institute', 'Paris', 'France', 'Active'],
    ['SITE-013', 'Lyon Research Hospital', 'Lyon', 'France', 'Closed'],
    ['SITE-014', 'Tokyo Clinical Center', 'Tokyo', 'Japan', 'Active'],
    ['SITE-015', 'Osaka Medical University', 'Osaka', 'Japan', 'Active'],
    ['SITE-016', 'Sydney Research Hospital', 'Sydney', 'Australia', 'Active'],
    ['SITE-017', 'Melbourne Clinical Institute', 'Melbourne', 'Australia', 'Active'],
    ['SITE-018', 'Mumbai Medical Research', 'Mumbai', 'India', 'Active'],
    ['SITE-019', 'Delhi Clinical Centre', 'Delhi', 'India', 'Active'],
    ['SITE-020', 'São Paulo Research Hospital', 'São Paulo', 'Brazil', 'Active'],
  ];
  for (const s of sites) {
    if (!queryOne('SELECT id FROM sites WHERE siteCode = ?', [s[0]])) {
      db.prepare(`INSERT INTO sites (siteCode,name,city,country,status) VALUES (?,?,?,?,?)`).run(...s);
    }
  }
}

function seedExaminers(db: ReturnType<typeof getDb>) {
  // Added role field: alternating PI / Sub-I for variety
  const examiners = [
    ['EX-001', 'Dr. Alice Morgan', 'Cardiology', 'alice.morgan@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-002', 'Dr. Brian Chen', 'Oncology', 'brian.chen@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-003', 'Dr. Clara Davis', 'Neurology', 'clara.davis@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-004', 'Dr. David Kim', 'Endocrinology', 'david.kim@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-005', 'Dr. Elena Rossi', 'Pulmonology', 'elena.rossi@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-006', 'Dr. Frank Müller', 'Rheumatology', 'frank.muller@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-007', 'Dr. Grace Liu', 'Nephrology', 'grace.liu@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-008', 'Dr. Henry Patel', 'Psychiatry', 'henry.patel@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-009', 'Dr. Irene Nakamura', 'Dermatology', 'irene.nakamura@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-010', 'Dr. James Wilson', 'Gastroenterology', 'james.wilson@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-011', 'Dr. Karen Smith', 'Hematology', 'karen.smith@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-012', 'Dr. Leo Fernandez', 'Infectious Disease', 'leo.fernandez@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-013', 'Dr. Maria Santos', 'Orthopedics', 'maria.santos@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-014', 'Dr. Nathan Brown', 'Ophthalmology', 'nathan.brown@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-015', 'Dr. Olivia Taylor', 'Urology', 'olivia.taylor@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-016', 'Dr. Peter Zhang', 'Cardiology', 'peter.zhang@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-017', "Dr. Quinn O'Brien", 'Neurology', 'quinn.obrien@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-018', 'Dr. Rachel Green', 'Oncology', 'rachel.green@clinic.com', 'Sub-Investigator', 'Active'],
    ['EX-019', 'Dr. Samuel Park', 'Endocrinology', 'samuel.park@clinic.com', 'Principal Investigator', 'Active'],
    ['EX-020', 'Dr. Tina Hoffman', 'Pulmonology', 'tina.hoffman@clinic.com', 'Sub-Investigator', 'Active'],
  ];
  for (const e of examiners) {
    if (!queryOne('SELECT id FROM examiners WHERE examinerCode = ?', [e[0]])) {
      db.prepare(`INSERT INTO examiners (examinerCode,name,specialty,email,role,status) VALUES (?,?,?,?,?,?)`).run(...e);
    }
  }
}

function seedJunctions(db: ReturnType<typeof getDb>) {
  const hasLinks = queryOne('SELECT study_id FROM study_sites LIMIT 1');
  if (hasLinks) return;
  // Note: seedStudySiteExaminers runs separately and guards itself

  const studySiteLinks = [
    [1,1],[1,2],[1,5],[2,3],[2,4],[2,6],[3,1],[3,7],[3,8],[4,2],[4,9],[4,10],
    [5,3],[5,11],[5,12],[6,4],[6,13],[7,5],[7,14],[7,15],[8,6],[8,16],
    [9,7],[9,17],[9,18],[10,8],[10,19],[11,9],[11,20],[11,1],[12,10],[12,2],
    [13,11],[13,3],[13,4],[14,12],[14,5],[15,13],[15,6],[15,7],[16,14],[16,8],
    [17,15],[17,9],[17,10],[18,16],[18,11],[19,17],[19,12],[19,13],[20,18],[20,19],[20,20],
  ];
  const insertSS = db.prepare('INSERT OR IGNORE INTO study_sites (study_id, site_id) VALUES (?, ?)');
  for (const [studyId, siteId] of studySiteLinks) insertSS.run(studyId, siteId);

  const siteExaminerLinks = [
    [1,1],[1,2],[1,16],[2,3],[2,4],[3,5],[3,6],[3,17],[4,7],[4,8],
    [5,9],[5,10],[5,18],[6,11],[6,12],[7,13],[7,14],[7,19],[8,15],[8,16],
    [9,1],[9,17],[10,2],[10,18],[10,3],[11,4],[11,19],[12,5],[12,20],
    [13,6],[13,7],[14,8],[14,9],[14,20],[15,10],[15,11],[16,12],[16,13],
    [17,14],[17,15],[17,1],[18,16],[18,2],[19,17],[19,3],[19,4],[20,18],[20,19],
  ];
  const insertSE = db.prepare('INSERT OR IGNORE INTO site_examiners (site_id, examiner_id) VALUES (?, ?)');
  for (const [siteId, examinerId] of siteExaminerLinks) insertSE.run(siteId, examinerId);
}

// Seed study_site_examiners to demonstrate the manager scenario:
//
// Site 1 (id=1) has examiners: EX-001(1), EX-002(2), EX-016(16)  → 3 examiners
// Site 2 (id=2) has examiners: EX-003(3), EX-004(4)              → 2 examiners
// Study 1 (STUDY-001) runs at Site 1 & Site 2 — uses SUBSET: 2 from Site1, 1 from Site2
// Study 3 (STUDY-003) runs at Site 1 & Site 2 — uses ALL:    3 from Site1, 2 from Site2
function seedStudySiteExaminers(db: ReturnType<typeof getDb>) {
  const hasSSE = queryOne('SELECT study_id FROM study_site_examiners LIMIT 1');
  if (hasSSE) return;

  // Study 1 at Site 1 — subset: examiners 1 and 2 (not 16)
  // Study 1 at Site 2 — subset: examiner 3 only (not 4)
  // Study 3 at Site 1 — all:    examiners 1, 2, 16
  // Study 3 at Site 2 — all:    examiners 3, 4
  const rows: [number, number, number][] = [
    [1, 1, 1], [1, 1, 2],
    [1, 2, 3],
    [3, 1, 1], [3, 1, 2], [3, 1, 16],
    [3, 2, 3], [3, 2, 4],
  ];
  const insert = db.prepare(
    'INSERT OR IGNORE INTO study_site_examiners (study_id, site_id, examiner_id) VALUES (?, ?, ?)'
  );
  for (const [studyId, siteId, examinerId] of rows) {
    insert.run(studyId, siteId, examinerId);
  }
}
