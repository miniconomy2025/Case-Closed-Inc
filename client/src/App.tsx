import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Outlet } from 'react-router';
import type { Navigation } from '@toolpad/core';

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'orders',
    title: '📱 Case Orders',
  },
];

const BRANDING = {
  title: 'Case-Closed-Inc',
  logo: <img src="./dashboardlogo.png" alt="Case-Closed-Logo" />,
};

export default function App() {
  return (
    <div style={{backgroundColor:'#f0f0fa'}}>
      <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING}>
      <Outlet />
    </ReactRouterAppProvider>
    </div>
  );
}