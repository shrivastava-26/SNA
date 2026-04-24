import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { TableSkeleton } from '../components/TableSkeleton';
import { useStudies } from '../hooks/useStudies';

export function StudyPage() {
  const { studies, loading, error } = useStudies();
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'protocolId', headerName: 'Protocol ID', width: 120 },
    { field: 'title', headerName: 'Study Name', flex: 1, minWidth: 180 },
    { field: 'sponsor', headerName: 'Sponsor', width: 150 },
    { field: 'phase', headerName: 'Phase', width: 100 },
    { field: 'startDate', headerName: 'Start Date', width: 110 },
    { field: 'endDate', headerName: 'End Date', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  return (
    <Layout>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.primary">
          Studies
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click any row to view its related sites and examiners.
        </Typography>
      </Box>

      {loading && <TableSkeleton />}
      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && !error && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <DataGrid
            rows={studies}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            onRowClick={(params) => navigate(`/studies/${params.row.id}`)}
            sx={{
              border: 'none',
              cursor: 'pointer',
              '& .MuiDataGrid-row:hover': { bgcolor: '#f0fdfa' },
            }}
          />
        </Box>
      )}
    </Layout>
  );
}
