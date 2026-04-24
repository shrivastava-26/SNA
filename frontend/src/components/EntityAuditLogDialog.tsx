import { useQuery } from '@apollo/client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { GET_AUDIT_LOGS_QUERY } from '../services/adminService';
import { AuditLog } from '../types';

interface EntityAuditLogDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: 'Study' | 'Site' | 'Examiner';
  entityId: number;
  entityLabel: string; // e.g. "STUDY-001" or "City General Hospital"
}

// ── Field label map — makes raw JSON keys human-readable ──────────────────
const FIELD_LABELS: Record<string, string> = {
  protocolId: 'Protocol ID',
  title: 'Study Name',
  sponsor: 'Sponsor',
  phase: 'Phase',
  startDate: 'Start Date',
  endDate: 'End Date',
  status: 'Status',
  description: 'Description',
  siteCode: 'Site Code',
  name: 'Name',
  city: 'City',
  country: 'Country',
  examinerCode: 'Examiner Code',
  specialty: 'Specialty',
  email: 'Email',
  role: 'Role',
};

function label(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

// ── Parse JSON safely ─────────────────────────────────────────────────────
function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Compute changed fields between before and after ───────────────────────
interface FieldChange {
  field: string;
  before: string;
  after: string;
}

function diffObjects(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): FieldChange[] {
  if (!after) return [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  // Skip internal DB fields
  const skip = new Set(['id', 'password']);
  const changes: FieldChange[] = [];
  for (const key of keys) {
    if (skip.has(key)) continue;
    const bVal = String(before?.[key] ?? '');
    const aVal = String(after[key] ?? '');
    if (bVal !== aVal) {
      changes.push({ field: key, before: bVal, after: aVal });
    }
  }
  return changes;
}

// ── Single log entry ──────────────────────────────────────────────────────
function AuditEntry({ log }: { log: AuditLog }) {
  const before = parseJson(log.beforeJson);
  const after = parseJson(log.afterJson);
  const changes = diffObjects(before, after);
  const isCreate = log.action === 'CREATE';

  return (
    <Box sx={{ mb: 2.5 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Chip
          label={log.action}
          size="small"
          color={isCreate ? 'success' : 'warning'}
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{log.createdAt}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">{log.actorEmail}</Typography>
        </Box>
      </Box>

      {/* Changes */}
      {isCreate && after ? (
        // CREATE: show all fields from afterJson
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {Object.entries(after)
            .filter(([k]) => !['id', 'password'].includes(k))
            .map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', minWidth: 120 }}>
                  {label(k)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ px: 0.8, py: 0.2, bgcolor: '#f0fdf4', color: '#15803d', borderRadius: 0.5, fontFamily: 'monospace' }}
                >
                  {String(v ?? '—')}
                </Typography>
              </Box>
            ))}
        </Box>
      ) : changes.length > 0 ? (
        // UPDATE: show only changed fields with before → after
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {changes.map((c) => (
            <Box key={c.field} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', minWidth: 120 }}>
                {label(c.field)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ px: 0.8, py: 0.2, bgcolor: '#fef2f2', color: '#b91c1c', borderRadius: 0.5, fontFamily: 'monospace', textDecoration: 'line-through' }}
              >
                {c.before || '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled">→</Typography>
              <Typography
                variant="caption"
                sx={{ px: 0.8, py: 0.2, bgcolor: '#f0fdf4', color: '#15803d', borderRadius: 0.5, fontFamily: 'monospace' }}
              >
                {c.after || '—'}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No field changes recorded.
        </Typography>
      )}
    </Box>
  );
}

// ── Dialog ────────────────────────────────────────────────────────────────
export function EntityAuditLogDialog({
  open, onClose, entityType, entityId, entityLabel,
}: EntityAuditLogDialogProps) {
  const { data, loading, error } = useQuery(GET_AUDIT_LOGS_QUERY, {
    variables: { entityType, entityId, limit: 100 },
    skip: !open,
    fetchPolicy: 'network-only',
  });

  const logs: AuditLog[] = data?.getAuditLogs ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon sx={{ color: '#0f766e' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Change History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entityType} · {entityLabel}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 200 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {error && <Alert severity="error">{error.message}</Alert>}
        {!loading && !error && logs.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.disabled' }}>
            <HistoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">No history recorded yet.</Typography>
          </Box>
        )}
        {!loading && !error && logs.length > 0 && (
          <Box>
            {logs.map((log, i) => (
              <Box key={log.id}>
                <AuditEntry log={log} />
                {i < logs.length - 1 && <Divider sx={{ mb: 2.5 }} />}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Typography variant="caption" color="text.disabled" sx={{ flex: 1 }}>
          {logs.length} record{logs.length !== 1 ? 's' : ''} found
        </Typography>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
