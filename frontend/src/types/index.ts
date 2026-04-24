export interface Study {
  id: string;
  protocolId: string;
  title: string;
  sponsor: string;
  phase: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  sites?: Site[];
  examiners?: Examiner[];
  studySites?: StudySite[];
}

export interface StudySite {
  site: Site;
  examiners: Examiner[];            // assigned to this study at this site
  availableExaminers: Examiner[];   // all examiners on the site
}

export interface Site {
  id: string;
  siteCode: string;
  name: string;
  city: string;
  country: string;
  status: string;
  studies?: Study[];
  examiners?: Examiner[];
}

export interface Examiner {
  id: string;
  examinerCode: string;
  name: string;
  specialty: string;
  email: string;
  role: string;
  status: string;
  studies?: Study[];
  sites?: Site[];
}

export interface AuditLog {
  id: string;
  actorUserId: number;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: number;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  rows: AuditLog[];
  total: number;
}

export interface AuthContextValue {
  isLoggedIn: boolean;
  isChecking: boolean;
  role: 'ADMIN' | 'VIEWER' | null;
}
