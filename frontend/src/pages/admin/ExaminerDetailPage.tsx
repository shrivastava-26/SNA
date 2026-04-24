import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import HistoryIcon from '@mui/icons-material/History';
import { GridColDef } from '@mui/x-data-grid';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DetailPageHeader } from '../../components/DetailPageHeader';
import { RelatedDataGrid } from '../../components/RelatedDataGrid';
import { StatusChip } from '../../components/StatusChip';
import { DetailPageSkeleton } from '../../components/skeletons';
import { useExaminer } from '../../hooks/useExaminer';

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.3 }} color="text.primary">{value || '—'}</Typography>
    </Box>
  );
}

export function AdminExaminerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { examiner, loading, error } = useExaminer(id);

  const studyColumns: GridColDef[] = [
    { field: 'protocolId', headerName: 'Protocol ID', width: 120 },
    { field: 'title', headerName: 'Study Name', flex: 1, minWidth: 180 },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  const siteColumns: GridColDef[] = [
    { field: 'siteCode', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Site Name', flex: 1, minWidth: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'country', headerName: 'Country', width: 120 },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  return (
    <AdminLayout>
      {loading && <DetailPageSkeleton infoFields={4} relatedSections={2} />}
      {error && <Alert severity="error">{error.message}</Alert>}
      {!loading && !error && !examiner && <Alert severity="warning">Examiner not found.</Alert>}
      {!loading && !error && examiner && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0 }}>
            <Box sx={{ flex: 1 }}>
              <DetailPageHeader backTo="/admin/examiners" backLabel="Examiners" title={examiner.name} status={examiner.status} badge={examiner.examinerCode} subtitle={`${examiner.role} · ${examiner.specialty}`} />
            </Box>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate(`/admin/examiners/${id}/history`)}
              sx={{ mt: 0.5, ml: 2, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              History
            </Button>
          </Box>
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Examiner Details</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Code" value={examiner.examinerCode} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Role" value={examiner.role} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Specialty" value={examiner.specialty} /></Box>
              <Box sx={{ flex: '2 1 240px' }}><InfoField label="Email" value={examiner.email} /></Box>
            </Box>
          </Paper>
          <RelatedDataGrid title="Linked Studies" rows={examiner.studies ?? []} columns={studyColumns} emptyMessage="No studies linked" />
          <RelatedDataGrid title="Assigned Sites" rows={examiner.sites ?? []} columns={siteColumns} emptyMessage="No sites assigned" />
        </>
      )}
    </AdminLayout>
  );
}
