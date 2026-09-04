// src/pages/PharmacyDirectory.jsx
// Pharmacy Directory module placeholder — Member 3
// Replace this stub with your full implementation on the feature/pharmacies branch.

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';

export default function PharmacyDirectory() {
  return (
    <Box
      id="pharmacy-directory-page"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
      color="text.secondary"
    >
      <LocalPharmacyIcon sx={{ fontSize: 64, color: 'primary.light' }} />
      <Typography variant="h4" fontWeight={600} color="text.primary">
        Pharmacy Directory
      </Typography>
      <Typography variant="body1">
        Coming soon — Member 3 is building this module.
      </Typography>
    </Box>
  );
}
