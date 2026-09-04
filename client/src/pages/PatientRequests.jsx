// src/pages/PatientRequests.jsx
// Patient Requests + Matching module placeholder — Member 4 (repo owner)
// Replace this stub with your full implementation on the feature/requests branch.

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';

export default function PatientRequests() {
  return (
    <Box
      id="patient-requests-page"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
      color="text.secondary"
    >
      <AssignmentIcon sx={{ fontSize: 64, color: 'primary.light' }} />
      <Typography variant="h4" fontWeight={600} color="text.primary">
        Patient Requests
      </Typography>
      <Typography variant="body1">
        Coming soon — Member 4 is building this module.
      </Typography>
    </Box>
  );
}
