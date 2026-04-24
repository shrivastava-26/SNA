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
import { useStudies } from '../hooks/useStudies';

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

export function StudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { studies, loading, error } = useStudies();

  const study = studies.find((s) => s.id === id);

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

  const examinerColumns: GridColDef[] = [
    { field: 'examinerCode', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'specialty', headerName: 'Specialty', width: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
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

      {!loading && !error && !study && (
        <Alert severity="warning">Study not found.</Alert>
      )}

      {!loading && !error && study && (
        <>
          <DetailPageHeader
            backTo="/studies"
            backLabel="Studies"
            title={study.title}
            status={study.status}
            badge={study.protocolId}
            subtitle={`${study.sponsor} · ${study.phase}`}
          />

          {/* Study info card */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }} color="text.primary">
              Study Details
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Protocol ID" value={study.protocolId} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Sponsor" value={study.sponsor} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Phase" value={study.phase} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="Start Date" value={study.startDate} /></Box>
              <Box sx={{ flex: '1 1 160px' }}><InfoField label="End Date" value={study.endDate} /></Box>
              <Box sx={{ flex: '2 1 300px' }}><InfoField label="Description" value={study.description} /></Box>
            </Box>
          </Paper>

          {/* Sites table */}
          <RelatedDataGrid
            title="Assigned Sites"
            rows={study.sites ?? []}
            columns={siteColumns}
            emptyMessage="No sites assigned to this study"
            emptySubMessage="This study has not been linked to any clinical sites yet."
          />

          {/* Examiners table */}
          <RelatedDataGrid
            title="Assigned Examiners"
            rows={study.examiners ?? []}
            columns={examinerColumns}
            emptyMessage="No examiners assigned to this study"
            emptySubMessage="No examiners have been linked to this study's sites yet."
          />
        </>
      )}
    </Layout>
  );
}
