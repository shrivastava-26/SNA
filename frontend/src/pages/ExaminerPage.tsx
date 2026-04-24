import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { TableSkeleton } from '../components/TableSkeleton';
import { useExaminers } from '../hooks/useExaminers';

export function ExaminerPage() {
  const { examiners, loading, error } = useExaminers();
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'examinerCode', headerName: 'Code', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    { field: 'specialty', headerName: 'Specialty', width: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
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
          Examiners
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click any row to view its related studies and sites.
        </Typography>
      </Box>

      {loading && <TableSkeleton />}
      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading && !error && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <DataGrid
            rows={examiners}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 20]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            onRowClick={(params) => navigate(`/examiners/${params.row.id}`)}
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
