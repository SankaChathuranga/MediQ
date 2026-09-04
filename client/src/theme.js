// src/theme.js — MediQueue LK shared MUI theme
// ⚠️  DO NOT modify this file in your feature branch — it is the single source
//     of truth for the entire app's visual identity. Coordinate any changes
//     with the team before touching it (CLAUDE.md §4).

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',      // primary blue — buttons, links, active states
      light: '#5E92F3',
      dark: '#003C8F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0288D1',      // secondary blue accent
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F8FC',      // very light blue-white for cards/surfaces
    },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },  // low stock
    success: { main: '#2E7D32' },  // in stock / fulfilled
    text: {
      primary: '#1A1C1E',
      secondary: '#44474A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Public Sans", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none' }, // MD3 buttons are not all-caps
  },
  shape: {
    borderRadius: 12, // MD3 uses larger, consistent corner radii
  },
});
