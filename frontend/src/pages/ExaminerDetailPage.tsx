import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { GridColDef } from '@mui/x-data-grid';
import { Layout } from '../components/Layout';
import { DetailPageHeader } from '../components/DetailPageHeader';
import { RelatedDataGrid } from '../components/RelatedDataGrid';
import { StatusChip } from '../components/StatusChip';
import { useExaminers } from '../hooks/useExaminers';

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.3 }} color="text.primary">
        {value || '—'}
      </Typography>
    </Box>
  );
}

export function ExaminerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { examiners, loading, error } = useExaminers();

  const examiner = examiners.find((e) => e.id === id);

  const studyColumns: GridColDef[] = [
    { field: 'protocolId', headerName: 'Protocol ID', width: 120 },
    { field: 'title', headerName: 'Study Name', flex: 1, minWidth: 180 },
    { field: 'sponsor', headerName: 'Sponsor', width: 140 },
    { field: 'phase', headerName: 'Phase', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  const siteColumns: GridColDef[] = [
    { field: 'siteCode', headerName: 'Site Code', width: 120 },
    { field: 'name', headerName: 'Site Name', flex: 1, minWidth: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'country', headerName: 'Country', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  return (
    <Layout>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && !error && !examiner && (
        <Alert severity="warning">Examiner not found.</Alert>
      )}

      {!loading && !error && examiner && (
        <>
          <DetailPageHeader
            backTo="/examiners"
            backLabel="Examiners"
            title={examiner.name}
            status={examiner.status}
            badge={examiner.examinerCode}
            subtitle={`${examiner.specialty} · ${examiner.email}`}
          />

          {/* Examiner info card */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }} color="text.primary">
              Examiner Details
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Examiner Code" value={examiner.examinerCode} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Specialty" value={examiner.specialty} /></Box>
              <Box sx={{ flex: '2 1 240px' }}><InfoField label="Email" value={examiner.email} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Status" value={examiner.status} /></Box>
            </Box>
          </Paper>

          {/* Studies table */}
          <RelatedDataGrid
            title="Linked Studies"
            rows={examiner.studies ?? []}
            columns={studyColumns}
            emptyMessage="No studies linked to this examiner"
            emptySubMessage="This examiner has not been assigned to any studies yet."
          />

          {/* Sites table */}
          <RelatedDataGrid
            title="Assigned Sites"
            rows={examiner.sites ?? []}
            columns={siteColumns}
            emptyMessage="No sites linked to this examiner"
            emptySubMessage="This examiner has not been assigned to any clinical sites yet."
          />
        </>
      )}
    </Layout>
  );
}
