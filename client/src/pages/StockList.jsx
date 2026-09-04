// src/pages/StockList.jsx
// Pharmacy Stock module placeholder — Member 2
// Replace this stub with your full implementation on the feature/stock branch.

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InventoryIcon from '@mui/icons-material/Inventory';

export default function StockList() {
  return (
    <Box
      id="stock-list-page"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
      color="text.secondary"
    >
      <InventoryIcon sx={{ fontSize: 64, color: 'primary.light' }} />
      <Typography variant="h4" fontWeight={600} color="text.primary">
        Pharmacy Stock
      </Typography>
      <Typography variant="body1">
        Coming soon — Member 2 is building this module.
      </Typography>
    </Box>
  );
}
