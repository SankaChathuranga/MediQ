// src/pages/MedicineCatalog.jsx
// Medicine Catalog module placeholder — Member 1
// Replace this stub with your full implementation on the feature/medicines branch.

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MedicationIcon from '@mui/icons-material/Medication';

export default function MedicineCatalog() {
  return (
    <Box
      id="medicine-catalog-page"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
      color="text.secondary"
    >
      <MedicationIcon sx={{ fontSize: 64, color: 'primary.light' }} />
      <Typography variant="h4" fontWeight={600} color="text.primary">
        Medicine Catalog
      </Typography>
      <Typography variant="body1">
        Coming soon — Member 1 is building this module.
      </Typography>
    </Box>
  );
}
