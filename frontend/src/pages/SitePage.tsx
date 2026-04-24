import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { TableSkeleton } from '../components/TableSkeleton';
import { useSites } from '../hooks/useSites';

export function SitePage() {
  const { sites, loading, error } = useSites();
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'siteCode', headerName: 'Site Code', width: 120 },
    { field: 'name', headerName: 'Site Name', flex: 1, minWidth: 200 },
    { field: 'city', headerName: 'City', width: 130 },
    { field: 'country', headerName: 'Country', width: 130 },
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
          Sites
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click any row to view its related studies and examiners.
        </Typography>
      </Box>

      {loading && <TableSkeleton />}
      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && !error && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <DataGrid
            rows={sites}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            onRowClick={(params) => navigate(`/sites/${params.row.id}`)}
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
