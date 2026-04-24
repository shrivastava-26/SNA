import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { Sidebar } from './Sidebar';

const APPBAR_HEIGHT = 64;

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Fixed top bar */}
      <AppHeader showLogout />

      {/* Body: sidebar + main — pushed down by AppBar height */}
      <Box sx={{ display: 'flex', flex: 1, mt: `${APPBAR_HEIGHT}px` }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            bgcolor: 'background.default',
            minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      <AppFooter />
    </Box>
  );
}
