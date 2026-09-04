// src/components/shared/ConfirmDialog.jsx
// Reusable delete confirmation dialog — CLAUDE.md §9 mandates that all delete
// actions go through a confirmation step before executing.
//
// Props:
//   open      {boolean}   — controls dialog visibility
//   title     {string}    — dialog heading, e.g. "Delete Medicine?"
//   message   {string}    — body text explaining what will be deleted
//   onConfirm {function}  — called when user clicks "Delete"
//   onCancel  {function}  — called when user clicks "Cancel" or closes dialog
//   loading   {boolean}   — (optional) shows spinner on confirm button during async op
//
// Usage:
//   <ConfirmDialog
//     open={dialogOpen}
//     title="Delete Medicine?"
//     message="This will permanently remove Paracetamol from the catalog."
//     onConfirm={handleDelete}
//     onCancel={() => setDialogOpen(false)}
//   />

import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ConfirmDialog({
  open,
  title = 'Confirm Delete',
  message = 'Are you sure? This action cannot be undone.',
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{ sx: { borderRadius: 3, minWidth: 360 } }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 600 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          id="confirm-dialog-cancel-btn"
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          id="confirm-dialog-confirm-btn"
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          disabled={loading}
        >
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
