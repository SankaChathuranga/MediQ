// src/components/shared/StatusChip.jsx
// Reusable status badge — always shows color + icon + label together per CLAUDE.md §10.
// Used across all four modules for stock status, request status, etc.
//
// Props:
//   status  {string}  — the label text (e.g. "In Stock", "Low Stock", "Out of Stock", "open", "fulfilled")
//   variant {string}  — "success" | "warning" | "error" | "info"  (maps to MUI palette)
//
// Usage examples:
//   <StatusChip status="In Stock"    variant="success" />
//   <StatusChip status="Low Stock"   variant="warning" />
//   <StatusChip status="Out of Stock" variant="error"  />
//   <StatusChip status="open"        variant="info"    />
//   <StatusChip status="fulfilled"   variant="success" />

import React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

const VARIANT_MAP = {
  success: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  warning: { color: 'warning', icon: <WarningAmberIcon fontSize="small" /> },
  error:   { color: 'error',   icon: <ErrorIcon fontSize="small" /> },
  info:    { color: 'info',    icon: <InfoIcon fontSize="small" /> },
};

/**
 * StatusChip — shows a status badge with color + icon + text label.
 * Never use color alone — always pair it with an icon and text (CLAUDE.md §10).
 */
export default function StatusChip({ status, variant = 'info' }) {
  const { color, icon } = VARIANT_MAP[variant] ?? VARIANT_MAP.info;

  return (
    <Chip
      label={status}
      color={color}
      icon={icon}
      size="small"
      variant="filled"
      sx={{ fontWeight: 500 }}
    />
  );
}
