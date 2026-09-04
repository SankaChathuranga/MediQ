// src/App.jsx — MediQueue LK app shell
// Provides the top navigation bar with tabs linking to all four module routes.
// Each module renders in the main content area below the nav.

import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

import MedicineCatalog from './pages/MedicineCatalog';
import StockList from './pages/StockList';
import PharmacyDirectory from './pages/PharmacyDirectory';
import PatientRequests from './pages/PatientRequests';

const NAV_TABS = [
  { label: 'Medicines',   path: '/medicines' },
  { label: 'Stock',       path: '/stock' },
  { label: 'Pharmacies',  path: '/pharmacies' },
  { label: 'Requests',    path: '/requests' },
];

function useActiveTab() {
  const { pathname } = useLocation();
  const idx = NAV_TABS.findIndex((t) => pathname.startsWith(t.path));
  return idx === -1 ? 0 : idx;
}

export default function App() {
  const activeTab = useActiveTab();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Top App Bar ────────────────────────────────────────────────── */}
      <AppBar
        id="main-app-bar"
        position="sticky"
        color="primary"
        elevation={2}
        sx={{ zIndex: (theme) => theme.zIndex.appBar }}
      >
        <Toolbar>
          <LocalHospitalIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography
            variant="h6"
            fontWeight={700}
            component={Link}
            to="/medicines"
            sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 0, mr: 3 }}
          >
            MediQueue LK
          </Typography>

          <Tabs
            id="main-nav-tabs"
            value={activeTab}
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: '#ffffff' } }}
            aria-label="Main navigation"
          >
            {NAV_TABS.map((tab, i) => (
              <Tab
                key={tab.path}
                id={`nav-tab-${tab.label.toLowerCase()}`}
                label={tab.label}
                component={Link}
                to={tab.path}
                sx={{ fontWeight: activeTab === i ? 700 : 400 }}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* ── Page Content ────────────────────────────────────────────────── */}
      <Container
        id="main-content"
        maxWidth="xl"
        sx={{ flex: 1, py: 4, px: { xs: 2, md: 4 } }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/medicines" replace />} />
          <Route path="/medicines"  element={<MedicineCatalog />} />
          <Route path="/stock"      element={<StockList />} />
          <Route path="/pharmacies" element={<PharmacyDirectory />} />
          <Route path="/requests"   element={<PatientRequests />} />
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/medicines" replace />} />
        </Routes>
      </Container>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{ py: 2, px: 4, bgcolor: 'background.paper', borderTop: '1px solid #e0e0e0' }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          MediQueue LK — SE3090 Mini Hackathon
        </Typography>
      </Box>
    </Box>
  );
}
