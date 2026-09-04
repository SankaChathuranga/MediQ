// src/pages/MedicineCatalog.jsx — Medicine Catalog module (Member 1)
// Fully replaces the placeholder. Does NOT touch App.jsx, theme.js, or shared components.

import React, { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// MUI core
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// MUI icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MedicationIcon from '@mui/icons-material/Medication';
import SearchIcon from '@mui/icons-material/Search';

// Shared components (CLAUDE.md §3 — use these, don't rebuild)
import ConfirmDialog from '../components/shared/ConfirmDialog';
import FormField from '../components/shared/FormField';
import StatusChip from '../components/shared/StatusChip';

// API client (shared Axios instance)
import apiClient from '../api/client';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'antibiotic',    label: 'Antibiotic' },
  { value: 'painkiller',    label: 'Painkiller' },
  { value: 'chronic-care',  label: 'Chronic Care' },
  { value: 'antihistamine', label: 'Antihistamine' },
  { value: 'other',         label: 'Other' },
];

// StatusChip variant by category
const CATEGORY_VARIANT = {
  antibiotic:    'error',
  painkiller:    'warning',
  'chronic-care':'info',
  antihistamine: 'success',
  other:         'info',
};

// ─── Zod schema — mirrors server-side (CLAUDE.md §6) ─────────────────────────

const MedicineSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  genericName: z.string().min(1, 'Generic name is required').max(100),
  category:    z.enum(
    ['antibiotic', 'painkiller', 'chronic-care', 'antihistamine', 'other'],
    { errorMap: () => ({ message: 'Select a valid category' }) }
  ),
  description: z.string().max(500).optional().or(z.literal('')),
});

// ─── API helpers ───────────────────────────────────────────────────────────────

const medicinesApi = {
  list:   (params) => apiClient.get('/api/medicines', { params }).then(r => r.data.data),
  getOne: (id)     => apiClient.get(`/api/medicines/${id}`).then(r => r.data.data),
  create: (body)   => apiClient.post('/api/medicines', body).then(r => r.data.data),
  update: (id, b)  => apiClient.put(`/api/medicines/${id}`, b).then(r => r.data.data),
  remove: (id)     => apiClient.delete(`/api/medicines/${id}`),
};

// ─── MedicineForm dialog — Add / Edit ─────────────────────────────────────────

function MedicineFormDialog({ open, medicine, onClose, onSaved }) {
  const isEdit = Boolean(medicine);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(MedicineSchema),
    defaultValues: {
      name:        '',
      genericName: '',
      category:    '',
      description: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (open) {
      reset(
        medicine
          ? {
              name:        medicine.name,
              genericName: medicine.genericName,
              category:    medicine.category,
              description: medicine.description ?? '',
            }
          : { name: '', genericName: '', category: '', description: '' }
      );
    }
  }, [open, medicine, reset]);

  const [serverError, setServerError] = useState('');

  async function onSubmit(data) {
    setServerError('');
    try {
      const payload = {
        name:        data.name,
        genericName: data.genericName,
        category:    data.category,
        description: data.description || null,
      };
      const saved = isEdit
        ? await medicinesApi.update(medicine.id, payload)
        : await medicinesApi.create(payload);
      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      setServerError(err.message || 'An error occurred. Please try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="medicine-form-title"
    >
      <DialogTitle
        id="medicine-form-title"
        sx={{ fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {isEdit ? 'Edit Medicine' : 'Add Medicine'}
        <IconButton
          id="medicine-form-close-btn"
          onClick={onClose}
          size="small"
          aria-label="Close form"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          id="medicine-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormField
            name="name"
            label="Brand / Trade Name"
            register={register('name')}
            error={errors.name}
            helperText="e.g. Panadol, Amoxil"
          />

          <FormField
            name="genericName"
            label="Generic Name"
            register={register('genericName')}
            error={errors.genericName}
            helperText="e.g. Paracetamol, Amoxicillin"
          />

          {/* Category — Select via Controller so value stays in sync */}
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormField
                name="category"
                label="Category"
                select
                register={field}   // FormField accepts register OR field spread
                error={errors.category}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </FormField>
            )}
          />

          <FormField
            name="description"
            label="Description (optional)"
            register={register('description')}
            error={errors.description}
            multiline
            rows={3}
          />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
            <Button
              id="medicine-form-cancel-btn"
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              id="medicine-form-submit-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Medicine'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── About panel — medicine shortage context ───────────────────────────────────

function AboutPanel() {
  return (
    <Card
      id="medicine-about-panel"
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'primary.light',
        borderRadius: 3,
        bgcolor: 'background.paper',
        mb: 3,
      }}
    >
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <MedicationIcon sx={{ color: 'primary.main', fontSize: 36, mt: 0.5, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.dark" gutterBottom>
            About Medicine Availability in Sri Lanka
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sri Lanka has faced acute medicine shortages since 2022, leaving patients unable to find
            essential drugs — from antibiotics to insulin — at their nearest pharmacy. MediQueue LK
            addresses this by providing a real-time catalog of available medicines across participating
            pharmacies, so patients can locate stock before making the trip.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            This catalog lists every registered medicine with its generic name and category. Use the
            search and filter tools below to find a specific drug, then check the Stock tab to see
            which pharmacies carry it and at what price.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton rows  ────────────────────────────────────────────────────

function TableSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={i}>
      {[40, 60, 50, 90, 80].map((w, j) => (
        <TableCell key={j}>
          <Skeleton variant="text" width={`${w}%`} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }) {
  return (
    <TableRow>
      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
        <MedicationIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          {hasFilter
            ? 'No medicines match your search — try a different name or category.'
            : 'No medicines in the catalog yet. Add the first one!'}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── Main page component ───────────────────────────────────────────────────────

export default function MedicineCatalog() {
  const [medicines, setMedicines]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');

  // Search / filter controlled state
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form dialog
  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);  // null = add, object = edit

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar feedback
  const [snack, setSnack]               = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = {};
      if (search)         params.search   = search;
      if (categoryFilter) params.category = categoryFilter;
      const data = await medicinesApi.list(params);
      setMedicines(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd()  { setEditTarget(null); setFormOpen(true); }
  function openEdit(m){ setEditTarget(m);    setFormOpen(true); }

  function handleSaved(saved, isEdit) {
    if (isEdit) {
      setMedicines((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      showSnack('Medicine updated successfully.', 'success');
    } else {
      // Re-fetch to keep ordering consistent
      fetchMedicines();
      showSnack('Medicine added successfully.', 'success');
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await medicinesApi.remove(deleteTarget.id);
      setMedicines((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showSnack(`"${deleteTarget.name}" removed from catalog.`, 'success');
    } catch (err) {
      showSnack(err.message || 'Failed to delete medicine.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  function showSnack(message, severity = 'success') {
    setSnack({ open: true, message, severity });
  }

  const hasFilter = Boolean(search || categoryFilter);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box id="medicine-catalog-page">
      {/* About panel */}
      <AboutPanel />

      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Medicine Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : `${medicines.length} medicine${medicines.length !== 1 ? 's' : ''} found`}
          </Typography>
        </Box>

        <Button
          id="add-medicine-btn"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add Medicine
        </Button>
      </Box>

      {/* Search + filter bar */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          id="medicine-search-input"
          size="small"
          placeholder="Search by name or generic name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          id="medicine-category-filter"
          select
          size="small"
          label="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All categories</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </TextField>

        {hasFilter && (
          <Button
            id="medicine-clear-filter-btn"
            variant="text"
            color="inherit"
            onClick={() => { setSearch(''); setCategoryFilter(''); }}
            size="small"
          >
            Clear
          </Button>
        )}
      </Paper>

      {/* Error state */}
      {fetchError && (
        <Alert
          severity="error"
          action={
            <Button size="small" color="inherit" onClick={fetchMedicines}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {fetchError}
        </Alert>
      )}

      {/* Main table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Table id="medicine-table" aria-label="Medicine catalog">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.paper' }}>
              <TableCell sx={{ fontWeight: 700 }}>Brand Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Generic Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : medicines.length === 0 ? (
              <EmptyState hasFilter={hasFilter} />
            ) : (
              medicines.map((m) => (
                <TableRow
                  key={m.id}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {m.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {m.genericName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={CATEGORIES.find((c) => c.value === m.category)?.label ?? m.category}
                      variant={CATEGORY_VARIANT[m.category] ?? 'info'}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {m.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        id={`edit-medicine-${m.id}`}
                        size="small"
                        color="primary"
                        onClick={() => openEdit(m)}
                        aria-label={`Edit ${m.name}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        id={`delete-medicine-${m.id}`}
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget(m)}
                        aria-label={`Delete ${m.name}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit form dialog */}
      <MedicineFormDialog
        open={formOpen}
        medicine={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Delete confirm dialog — uses shared ConfirmDialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name}"?`}
        message={`This will permanently remove ${deleteTarget?.name} (${deleteTarget?.genericName}) from the catalog. Any linked stock entries or patient requests may be affected.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
